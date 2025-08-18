/**
 * Pure Wink BM25 Vectorizer Service
 * Clean wrapper around wink-nlp's BM25 vectorizer with Effect patterns
 * @since 3.0.0
 */

import { Effect, Data, Context, Layer, Chunk, Option } from "effect";
import { WinkEngine } from "./WinkEngine.js";
import type { Document } from "../Core/Document.js";
import { DocumentId } from "../Core/Document.js";
import type { Token } from "../Core/Token.js";
import { createRequire } from "module";

// Import the BM25 vectorizer utility using createRequire for ES modules
const require = createRequire(import.meta.url);
const BM25Vectorizer: BM25VectorizerFactory = require("wink-nlp/utilities/bm25-vectorizer");

/**
 * Type for BM25Vectorizer output functions
 * These functions receive tf, idf, terms, docId, and sumOfAllDLs parameters
 * Note: The actual signature varies based on the specific its function being used
 */
export type BM25OutputFunction<T> = (...args: Array<any>) => T;

/**
 * BM25 configuration parameters
 */
export interface BM25Config {
  readonly k1: number; // Controls TF saturation (default: 1.2)
  readonly b: number; // Controls doc length normalization (default: 0.75)
  readonly k: number; // Controls IDF saturation (default: 1)
  readonly norm: "none" | "l1" | "l2"; // Vector normalization (default: "none")
  readonly precision?: number; // Decimal precision for calculations (default: 6)
}

/**
 * Type definition for the BM25Vectorizer instance returned by wink-nlp
 * Based on the actual implementation in wink-nlp/utilities/bm25-vectorizer.js
 */
export interface BM25VectorizerInstance {
  /**
   * Learn from a tokenized document
   * @param tokens - Array of tokenized strings
   */
  learn(tokens: Array<string>): void;

  /**
   * Get output based on the specified function
   * @param f - Output function from wink-nlp's its module
   * @returns Array containing strings, objects, or arrays based on the function
   */
  out<T>(f: BM25OutputFunction<T>): T;

  /**
   * Get document-specific APIs
   * @param n - Document index
   * @returns Document API object
   */
  doc(n: number): {
    /**
     * Get document output based on function
     * @param f - Output function
     * @returns Document-specific output
     */
    out(f: any): any;
    /**
     * Get number of unique tokens in the document
     * @returns Number of unique tokens
     */
    length(): number;
  };

  /**
   * Compute vector for input tokens using learned tf-idf
   * @param tokens - Array of tokenized strings
   * @returns Array of numbers representing the vector
   */
  vectorOf(tokens: Array<string>): Array<number>;

  /**
   * Compute bag-of-words for input tokens
   * @param tokens - Array of tokenized strings
   * @param processOOV - Whether to process out-of-vocabulary tokens (default: false)
   * @returns Object with term frequencies
   */
  bowOf(tokens: Array<string>, processOOV?: boolean): Record<string, number>;

  /**
   * Get current configuration
   * @returns Configuration object
   */
  config(): { k: number; k1: number; b: number; norm: string };

  /**
   * Load model from JSON
   * @param json - Model JSON string
   */
  loadModel(json: string): void;
}

/**
 * Type definition for the BM25Vectorizer factory function
 */
export type BM25VectorizerFactory = (
  config?: BM25Config
) => BM25VectorizerInstance;

/**
 * Default BM25 configuration
 */
export const DefaultBM25Config: BM25Config = {
  k1: 1.2,
  b: 0.75,
  k: 1,
  norm: "none",
};

/**
 * Document vector representation
 */
export const DocumentVector = Data.case<{
  readonly documentId: DocumentId;
  readonly vector: Chunk.Chunk<number>;
  readonly terms: Chunk.Chunk<string>;
}>();
export type DocumentVector = ReturnType<typeof DocumentVector>;

/**
 * Bag of words representation
 */
export const BagOfWords = Data.case<{
  readonly documentId: DocumentId;
  readonly bow: Record<string, number>;
}>();
export type BagOfWords = ReturnType<typeof BagOfWords>;

/**
 * Term frequency data
 */
export const TermFrequency = Data.case<{
  readonly term: string;
  readonly frequency: number;
}>();
export type TermFrequency = ReturnType<typeof TermFrequency>;

/**
 * IDF (Inverse Document Frequency) data
 */
export const InverseDocumentFrequency = Data.case<{
  readonly term: string;
  readonly idf: number;
}>();
export type InverseDocumentFrequency = ReturnType<
  typeof InverseDocumentFrequency
>;

/**
 * Corpus statistics
 */
export const CorpusStats = Data.case<{
  readonly totalDocuments: number;
  readonly uniqueTerms: Chunk.Chunk<string>;
  readonly documentTermMatrix: Chunk.Chunk<Chunk.Chunk<number>>;
  readonly idfValues: Chunk.Chunk<InverseDocumentFrequency>;
}>();
export type CorpusStats = ReturnType<typeof CorpusStats>;

/**
 * Vectorizer error types
 */
export class VectorizerError extends Data.TaggedError("VectorizerError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Wink BM25 Vectorizer Service
 */
export class WinkVectorizer extends Context.Tag("effect-nlp/WinkVectorizer")<
  WinkVectorizer,
  {
    /**
     * Learn from a single document
     */
    readonly learnDocument: (
      document: Document
    ) => Effect.Effect<void, VectorizerError>;

    /**
     * Learn from multiple documents (batch learnmng)
     */
    readonly learnDocuments: (
      documents: Chunk.Chunk<Document>
    ) => Effect.Effect<void, VectorizerError>;

    /**
     * Get vector representation of a document
     */
    readonly vectorizeDocument: (
      document: Document
    ) => Effect.Effect<DocumentVector, VectorizerError>;

    /**
     * Get bag-of-words representation of a document
     */
    readonly getBagOfWords: (
      document: Document
    ) => Effect.Effect<BagOfWords, VectorizerError>;

    /**
     * Get vector for arbitrary text (doesn't need to be a learned document)
     */
    readonly vectorizeText: (
      text: string,
      id?: string
    ) => Effect.Effect<DocumentVector, VectorizerError>;

    /**
     * Get corpus statistics after learning
     */
    readonly getCorpusStats: () => Effect.Effect<CorpusStats, VectorizerError>;

    /**
     * Get term frequencies for a specific learned document by index
     */
    readonly getDocumentTermFrequencies: (
      docIndex: number
    ) => Effect.Effect<Chunk.Chunk<TermFrequency>, VectorizerError>;

    /**
     * Export model as JSON for saving
     */
    readonly exportModel: () => Effect.Effect<string, VectorizerError>;

    /**
     * Load model from JSON
     */
    readonly loadModel: (
      modelJson: string
    ) => Effect.Effect<void, VectorizerError>;

    /**
     * Get current configuration
     */
    readonly getConfig: () => BM25Config;

    /**
     * Reset vectorizer (clear all learned data)
     */
    readonly reset: () => Effect.Effect<void, VectorizerError>;
  }
>() {}

/**
 * Extract normalized tokens from Core Token objects
 * Falls back to text if normal is not available
 */
const extractNormalizedTokens = (tokens: Chunk.Chunk<Token>): Array<string> =>
  Chunk.toArray(
    Chunk.map(tokens, (token) =>
      Option.getOrElse(token.normal, () => token.text)
    )
  );

/**
 * Create WinkVectorizer implementation
 */
const createWinkVectorizerImpl = (
  engine: WinkEngine,
  config: BM25Config = DefaultBM25Config
) => {
  const vectorizer = BM25Vectorizer(config);
  const its = engine.getIts();
  // let isLearned = false;
  const documentIds: Array<DocumentId> = [];

  return WinkVectorizer.of({
    learnDocument: (document: Document) =>
      Effect.try({
        try: () => {
          // Use existing Core Token data if available, otherwise tokenize
          const tokens =
            Chunk.size(document.tokens) > 0
              ? extractNormalizedTokens(document.tokens)
              : (() => {
                  const winkDoc = engine.getDocument(document.text);
                  return winkDoc.tokens().out(its.normal);
                })();
          vectorizer.learn(tokens);
          documentIds.push(document.id);
        },
        catch: (error) =>
          new VectorizerError({
            message: `Failed to learn document ${document.id}`,
            cause: error,
          }),
      }),

    learnDocuments: (documents: Chunk.Chunk<Document>) =>
      Effect.forEach(
        documents,
        (doc) =>
          Effect.try({
            try: () => {
              // Use existing Core Token data if available, otherwise tokenize
              const tokens =
                Chunk.size(doc.tokens) > 0
                  ? extractNormalizedTokens(doc.tokens)
                  : (() => {
                      const winkDoc = engine.getDocument(doc.text);
                      return winkDoc.tokens().out(its.normal);
                    })();
              vectorizer.learn(tokens);
              documentIds.push(doc.id);
            },
            catch: (error) =>
              new VectorizerError({
                message: `Failed to learn document ${doc.id}`,
                cause: error,
              }),
          }),
        { discard: true }
      ),

    vectorizeDocument: (document: Document) =>
      Effect.try({
        try: () => {
          // Use existing Core Token data if available, otherwise tokenize
          const tokens =
            Chunk.size(document.tokens) > 0
              ? extractNormalizedTokens(document.tokens)
              : (() => {
                  const winkDoc = engine.getDocument(document.text);
                  return winkDoc.tokens().out(its.normal);
                })();
          const vector = vectorizer.vectorOf(tokens);
          const terms = vectorizer.out(its.terms);

          return DocumentVector({
            documentId: document.id,
            vector: Chunk.fromIterable(vector),
            terms: Chunk.fromIterable(terms),
          });
        },
        catch: (error) =>
          new VectorizerError({
            message: `Failed to vectorize document ${document.id}`,
            cause: error,
          }),
      }),

    getBagOfWords: (document: Document) =>
      Effect.try({
        try: () => {
          // Use existing Core Token data if available, otherwise tokenize
          const tokens =
            Chunk.size(document.tokens) > 0
              ? extractNormalizedTokens(document.tokens)
              : (() => {
                  const winkDoc = engine.getDocument(document.text);
                  return winkDoc.tokens().out(its.normal);
                })();
          const bow = vectorizer.bowOf(tokens, true); // processOOV = true

          return BagOfWords({
            documentId: document.id,
            bow,
          });
        },
        catch: (error) =>
          new VectorizerError({
            message: `Failed to get bag-of-words for document ${document.id}`,
            cause: error,
          }),
      }),

    vectorizeText: (text: string, id?: string) =>
      Effect.try({
        try: () => {
          const winkDoc = engine.getDocument(text);
          const tokens = winkDoc.tokens().out(its.normal);
          const vector = vectorizer.vectorOf(tokens);
          const terms = vectorizer.out(its.terms);

          return DocumentVector({
            documentId: DocumentId.make(id || `text-${Date.now()}`),
            vector: Chunk.fromIterable(vector),
            terms: Chunk.fromIterable(terms),
          });
        },
        catch: (error) =>
          new VectorizerError({
            message: "Failed to vectorize text",
            cause: error,
          }),
      }),

    getCorpusStats: () =>
      Effect.try({
        try: () => {
          const terms = vectorizer.out(its.terms);
          const docTermMatrix = vectorizer.out(its.docTermMatrix);
          const idfData = vectorizer.out(its.idf);

          const idfValues = Chunk.fromIterable(
            idfData.map(([term, idf]: [string, number]) =>
              InverseDocumentFrequency({ term, idf })
            )
          );

          return CorpusStats({
            totalDocuments: documentIds.length,
            uniqueTerms: Chunk.fromIterable(terms),
            documentTermMatrix: Chunk.fromIterable(
              docTermMatrix.map((row: Array<number>) => Chunk.fromIterable(row))
            ),
            idfValues: idfValues as Chunk.Chunk<InverseDocumentFrequency>,
          });
        },
        catch: (error) =>
          new VectorizerError({
            message: "Failed to get corpus statistics",
            cause: error,
          }),
      }),

    getDocumentTermFrequencies: (docIndex: number) =>
      Effect.try({
        try: () => {
          const tfData = vectorizer.doc(docIndex).out(its.tf);
          return Chunk.fromIterable(
            tfData.map(([term, frequency]: [string, number]) =>
              TermFrequency({ term, frequency })
            )
          );
        },
        catch: (error) =>
          new VectorizerError({
            message: `Failed to get term frequencies for document ${docIndex}`,
            cause: error,
          }),
      }),

    exportModel: () =>
      Effect.try({
        try: () => JSON.stringify(vectorizer.out(its.modelJSON)),
        catch: (error) =>
          new VectorizerError({
            message: "Failed to export model",
            cause: error,
          }),
      }),

    loadModel: (modelJson: string) =>
      Effect.try({
        try: () => {
          const model = JSON.parse(modelJson);
          vectorizer.loadModel(model);
          // isLearned = true;
        },
        catch: (error) =>
          new VectorizerError({
            message: "Failed to load model",
            cause: error,
          }),
      }),

    getConfig: () => config,

    reset: () =>
      Effect.try({
        try: () => {
          // Create new vectorizer instance to reset state
          Object.assign(vectorizer, BM25Vectorizer(config));
          documentIds.length = 0;
          // isLearned = false;
        },
        catch: (error) =>
          new VectorizerError({
            message: "Failed to reset vectorizer",
            cause: error,
          }),
      }),
  });
};

/**
 * Live implementation of WinkVectorizer
 */
export const WinkVectorizerLive = (config?: Partial<BM25Config>) =>
  Layer.effect(
    WinkVectorizer,
    Effect.gen(function* () {
      const engine = yield* WinkEngine;

      const finalConfig = { ...DefaultBM25Config, ...config };
      return createWinkVectorizerImpl(engine, finalConfig);
    })
  );

/**
 * Data-first convenience functions
 */

export const learnDocument = (document: Document) =>
  Effect.flatMap(WinkVectorizer, (service) => service.learnDocument(document));

export const learnDocuments = (documents: Chunk.Chunk<Document>) =>
  Effect.flatMap(WinkVectorizer, (service) =>
    service.learnDocuments(documents)
  );

export const vectorizeDocument = (document: Document) =>
  Effect.flatMap(WinkVectorizer, (service) =>
    service.vectorizeDocument(document)
  );

export const getBagOfWords = (document: Document) =>
  Effect.flatMap(WinkVectorizer, (service) => service.getBagOfWords(document));

export const vectorizeText = (text: string, id?: string) =>
  Effect.flatMap(WinkVectorizer, (service) => service.vectorizeText(text, id));

export const getCorpusStats = () =>
  Effect.flatMap(WinkVectorizer, (service) => service.getCorpusStats());

export const getDocumentTermFrequencies = (docIndex: number) =>
  Effect.flatMap(WinkVectorizer, (service) =>
    service.getDocumentTermFrequencies(docIndex)
  );

export const exportModel = () =>
  Effect.flatMap(WinkVectorizer, (service) => service.exportModel());

export const loadModel = (modelJson: string) =>
  Effect.flatMap(WinkVectorizer, (service) => service.loadModel(modelJson));

export const resetVectorizer = () =>
  Effect.flatMap(WinkVectorizer, (service) => service.reset());
