/**
 * Vector Index with Stop Words Investigation Test
 * Tests creating a vector index from English articles and investigates stop word removal
 * @since 3.0.0
 */

import { describe, it, expect } from "vitest";
import { Effect, Chunk, Option } from "effect";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { WinkVectorizer } from "../../src/NLP/Wink/WinkVectorizer.js";
import {
  WinkUtils,
  StopWordsConfig,
  removeWords,
  documentToTokensInput,
} from "../../src/NLP/Wink/WinkUtils.js";
import { WinkTokenizer } from "../../src/NLP/Wink/WinkTokenizer.js";
import { WinkLayerLive } from "../../src/NLP/Wink/Layer.js";
import { Document, DocumentId } from "../../src/NLP/Core/Document.js";

/**
 * Article data structure from JSON files
 */
interface ArticleData {
  title: string;
  text: string;
  language: string;
  sentiment?: string;
  categories?: string[];
}

/**
 * Load and filter English articles from test data
 */
const loadEnglishArticles = Effect.gen(function* () {
  const dataDir = join(process.cwd(), "test", "data");
  const files = yield* Effect.tryPromise(() => readdir(dataDir));

  // Filter JSON files and limit to first 50 for testing
  const jsonFiles = files.filter((f) => f.endsWith(".json")).slice(0, 50); // Limit for test performance

  const articles: Array<ArticleData> = [];

  for (const file of jsonFiles) {
    try {
      const filePath = join(dataDir, file);
      const content = yield* Effect.tryPromise(() =>
        readFile(filePath, "utf-8")
      );
      const data = JSON.parse(content) as ArticleData;

      // Only include English articles with substantial text
      if (data.language === "english" && data.text && data.text.length > 100) {
        articles.push(data);
      }
    } catch (error) {
      // Skip files that can't be parsed
      console.warn(`Skipping file ${file}:`, error);
    }
  }

  console.log(
    `Loaded ${articles.length} English articles from ${jsonFiles.length} files`
  );
  return articles;
});

/**
 * Convert article data to Core Document objects
 */
const createDocuments = (articles: Array<ArticleData>) =>
  Effect.gen(function* () {
    const tokenizer = yield* WinkTokenizer;

    const documents = yield* Effect.forEach(
      articles,
      (article, index) =>
        Effect.gen(function* () {
          const docId = DocumentId(`article-${index}`);
          const fullText = `${article.title}\n\n${article.text}`;

          // Create document with tokenization
          return yield* tokenizer.tokenizeToDocument(fullText, docId);
        }),
      { concurrency: 5 }
    );

    return Chunk.fromIterable(documents);
  });

/**
 * Investigation: Compare terms before and after stop word removal
 */
const investigateStopWordRemoval = (documents: Chunk.Chunk<Document>) =>
  Effect.gen(function* () {
    const utils = yield* WinkUtils;

    // Get first document for detailed investigation
    const firstDoc = Chunk.head(documents);
    if (Option.isNone(firstDoc)) {
      throw new Error("No documents available");
    }

    const doc = firstDoc.value;
    console.log(`\n=== Stop Word Investigation for Document: ${doc.id} ===`);
    console.log(`Original text length: ${doc.text.length} characters`);
    console.log(`Token count: ${Chunk.size(doc.tokens)}`);

    // Convert document tokens to TokensInput
    const tokensInput = documentToTokensInput(doc);
    console.log(`\nOriginal tokens (first 20):`);
    console.log(Chunk.take(tokensInput.tokens, 20));

    // Remove stop words using default wink-nlp-utils stop words
    const defaultStopWordsConfig = StopWordsConfig({
      customStopWords: Option.none(),
    });

    const filteredResult = yield* utils.removeWords(
      tokensInput,
      defaultStopWordsConfig
    );

    console.log(`\nAfter stop word removal:`);
    console.log(`Original token count: ${Chunk.size(tokensInput.tokens)}`);
    console.log(`Filtered token count: ${Chunk.size(filteredResult.tokens)}`);
    console.log(
      `Removed: ${
        Chunk.size(tokensInput.tokens) - Chunk.size(filteredResult.tokens)
      } tokens`
    );
    console.log(`Filtered tokens (first 20):`);
    console.log(Chunk.take(filteredResult.tokens, 20));

    // Test with custom stop words
    const customStopWords = Chunk.fromIterable([
      "the",
      "and",
      "is",
      "in",
      "at",
      "of",
      "a",
      "an",
    ]);
    const customStopWordsConfig = StopWordsConfig({
      customStopWords: Option.some(customStopWords),
    });

    const customFilteredResult = yield* utils.removeWords(
      tokensInput,
      customStopWordsConfig
    );

    console.log(`\nWith custom stop words:`, Chunk.toArray(customStopWords));
    console.log(
      `Custom filtered token count: ${Chunk.size(customFilteredResult.tokens)}`
    );
    console.log(`Custom filtered tokens (first 20):`);
    console.log(Chunk.take(customFilteredResult.tokens, 20));

    return {
      original: tokensInput,
      defaultFiltered: filteredResult,
      customFiltered: customFilteredResult,
    };
  });

describe("Vector Index with Stop Words Investigation", () => {
  it("should load English articles, create vector index, and investigate stop word removal", async () => {
    const program = Effect.gen(function* () {
      console.log("=== Loading English Articles ===");
      const articles = yield* loadEnglishArticles;
      expect(articles.length).toBeGreaterThan(0);

      console.log("\n=== Creating Documents ===");
      const documents = yield* createDocuments(articles);
      expect(Chunk.size(documents)).toBe(articles.length);

      console.log("\n=== Investigating Stop Word Removal ===");
      const stopWordInvestigation = yield* investigateStopWordRemoval(
        documents
      );

      // Verify stop word removal worked
      expect(
        Chunk.size(stopWordInvestigation.defaultFiltered.tokens)
      ).toBeLessThan(Chunk.size(stopWordInvestigation.original.tokens));

      expect(
        Chunk.size(stopWordInvestigation.customFiltered.tokens)
      ).toBeLessThan(Chunk.size(stopWordInvestigation.original.tokens));

      console.log("\n=== Creating Vector Index ===");
      const vectorizer = yield* WinkVectorizer;

      // Learn from all documents
      yield* vectorizer.learnDocuments(documents);

      // Get corpus statistics
      const corpusStats = yield* vectorizer.getCorpusStats();

      console.log(`\n=== Vector Index Results ===`);
      console.log(`Total documents learned: ${corpusStats.totalDocuments}`);
      console.log(`Unique terms: ${Chunk.size(corpusStats.uniqueTerms)}`);
      console.log(`First 30 terms:`, Chunk.take(corpusStats.uniqueTerms, 30));

      // Verify the index was created
      expect(corpusStats.totalDocuments).toBe(Chunk.size(documents));
      expect(Chunk.size(corpusStats.uniqueTerms)).toBeGreaterThan(0);
      expect(Chunk.size(corpusStats.idfValues)).toBe(
        Chunk.size(corpusStats.uniqueTerms)
      );

      // Test vectorization of a sample document
      const firstDoc = Chunk.head(documents);
      if (Option.isSome(firstDoc)) {
        const docVector = yield* vectorizer.vectorizeDocument(firstDoc.value);

        console.log(`\n=== Sample Document Vectorization ===`);
        console.log(`Document ID: ${docVector.documentId}`);
        console.log(`Vector dimension: ${Chunk.size(docVector.vector)}`);
        console.log(`Terms count: ${Chunk.size(docVector.terms)}`);
        console.log(
          `Vector (first 10 values):`,
          Chunk.take(docVector.vector, 10)
        );

        expect(Chunk.size(docVector.vector)).toBe(
          Chunk.size(corpusStats.uniqueTerms)
        );
        expect(docVector.documentId).toBe(firstDoc.value.id);
      }

      console.log("\n=== Creating Vector Index with Stop Word Removal ===");

      // Create a new vectorizer instance for comparison
      const vectorizerFiltered = yield* WinkVectorizer;
      yield* vectorizerFiltered.reset();

      // Process documents with stop word removal before learning
      const documentsWithStopWordRemoval = yield* Effect.forEach(
        documents,
        (doc) =>
          Effect.gen(function* () {
            const tokensInput = documentToTokensInput(doc);
            const filtered = yield* removeWords(
              tokensInput,
              StopWordsConfig({
                customStopWords: Option.none(), // Use default stop words
              })
            );

            // Create a simplified document with filtered text
            // Note: This is a simplified approach - in practice you'd want to preserve
            // the full Document structure with filtered tokens
            const filteredText = Chunk.join(filtered.tokens, " ");

            return Document({
              id: doc.id,
              text: filteredText,
              tokens: Chunk.empty(), // Will be re-tokenized by vectorizer
              sentences: Chunk.empty(),
              sentiment: doc.sentiment,
            });
          }),
        { concurrency: 5 }
      );

      // Learn with stop-word filtered documents
      yield* vectorizerFiltered.learnDocuments(documentsWithStopWordRemoval);
      const filteredCorpusStats = yield* vectorizerFiltered.getCorpusStats();

      console.log(`\n=== Filtered Vector Index Results ===`);
      console.log(
        `Total documents learned: ${filteredCorpusStats.totalDocuments}`
      );
      console.log(
        `Unique terms (after stop word removal): ${Chunk.size(
          filteredCorpusStats.uniqueTerms
        )}`
      );
      console.log(
        `Terms reduction: ${
          Chunk.size(corpusStats.uniqueTerms) -
          Chunk.size(filteredCorpusStats.uniqueTerms)
        }`
      );
      console.log(
        `First 30 filtered terms:`,
        Chunk.take(filteredCorpusStats.uniqueTerms, 30)
      );

      // Verify stop word removal reduced vocabulary
      expect(Chunk.size(filteredCorpusStats.uniqueTerms)).toBeLessThan(
        Chunk.size(corpusStats.uniqueTerms)
      );

      return {
        articles: articles.length,
        documents: Chunk.size(documents),
        originalTerms: Chunk.size(corpusStats.uniqueTerms),
        filteredTerms: Chunk.size(filteredCorpusStats.uniqueTerms),
        termsReduction:
          Chunk.size(corpusStats.uniqueTerms) -
          Chunk.size(filteredCorpusStats.uniqueTerms),
        stopWordInvestigation,
      };
    });

    // Use the comprehensive Wink layer that includes all services
    const layer = WinkLayerLive;
    const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));

    // Final assertions
    expect(result.articles).toBeGreaterThan(0);
    expect(result.documents).toBe(result.articles);
    expect(result.originalTerms).toBeGreaterThan(result.filteredTerms);
    expect(result.termsReduction).toBeGreaterThan(0);

    console.log(`\n=== Final Summary ===`);
    console.log(`Processed ${result.articles} English articles`);
    console.log(`Original vocabulary: ${result.originalTerms} unique terms`);
    console.log(`Filtered vocabulary: ${result.filteredTerms} unique terms`);
    console.log(
      `Reduction: ${result.termsReduction} terms (${Math.round(
        (result.termsReduction / result.originalTerms) * 100
      )}%)`
    );
  }, 30000); // 30 second timeout for file processing
});
