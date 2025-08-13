/**
 * Clean DocumentProcessor API for production NLP
 *
 * This module provides a single, clean interface for document processing
 * that hides all implementation details of underlying NLP libraries.
 *
 * @since 2.0.0
 */

import { Context, Effect } from "effect";
import type * as Core from "./Core.js";

// =============================================================================
// Service Interface
// =============================================================================

/**
 * Primary interface for document processing
 * @since 2.0.0
 */
export interface DocumentProcessor {
  /**
   * Process raw text into a Document with full linguistic analysis
   */
  readonly process: (
    text: string
  ) => Effect.Effect<Core.Document, Core.NlpError>;

  /**
   * Extract only entities from text (lightweight operation)
   */
  readonly extractEntities: (
    text: string
  ) => Effect.Effect<ReadonlyArray<Core.Entity>, Core.EntityExtractionError>;

  /**
   * Tokenize text into tokens (minimal processing)
   */
  readonly tokenize: (
    text: string
  ) => Effect.Effect<ReadonlyArray<Core.Token>, Core.TokenizationError>;

  /**
   * Get document statistics
   */
  readonly getStats: (document: Core.Document) => Core.DocumentStats;
}

/**
 * Document processor service tag
 * @since 2.0.0
 */
export class DocumentProcessorService extends Context.Tag(
  "effect-nlp/DocumentProcessor"
)<DocumentProcessorService, DocumentProcessor>() {}

// =============================================================================
// Query Interface
// =============================================================================

/**
 * Advanced querying capabilities for processed documents
 * @since 2.0.0
 */
export interface DocumentQuery {
  /**
   * Find entities matching specific criteria
   */
  readonly findEntities: (
    document: Core.Document,
    predicate: (entity: Core.Entity) => boolean
  ) => ReadonlyArray<Core.Entity>;

  /**
   * Find tokens matching specific criteria
   */
  readonly findTokens: (
    document: Core.Document,
    predicate: (token: Core.Token) => boolean
  ) => ReadonlyArray<Core.Token>;

  /**
   * Get entities within a character span
   */
  readonly getEntitiesInSpan: (
    document: Core.Document,
    span: Core.Span
  ) => ReadonlyArray<Core.Entity>;

  /**
   * Get context around an entity (surrounding tokens/sentences)
   */
  readonly getEntityContext: (
    document: Core.Document,
    entity: Core.Entity,
    windowSize?: number
  ) => {
    readonly before: ReadonlyArray<Core.Token>;
    readonly after: ReadonlyArray<Core.Token>;
    readonly sentence: Core.Sentence | undefined;
  };
}

/**
 * Document query service tag
 * @since 2.0.0
 */
export class DocumentQueryService extends Context.Tag(
  "effect-nlp/DocumentQuery"
)<DocumentQueryService, DocumentQuery>() {}

// =============================================================================
// Text Transformation Interface
// =============================================================================

/**
 * Text transformation operations
 * @since 2.0.0
 */
export type TextTransform =
  | { readonly _tag: "Normalize" }
  | { readonly _tag: "ToLowerCase" }
  | { readonly _tag: "ToUpperCase" }
  | { readonly _tag: "ToTitleCase" }
  | { readonly _tag: "RemovePunctuation" }
  | { readonly _tag: "RemoveStopwords"; readonly language?: string }
  | { readonly _tag: "Lemmatize" }
  | { readonly _tag: "ExtractKeywords"; readonly maxCount?: number };

/**
 * Text transformation service
 * @since 2.0.0
 */
export interface TextTransformer {
  /**
   * Apply transformation to text
   */
  readonly transform: (
    text: string,
    transform: TextTransform
  ) => Effect.Effect<string, Core.NlpError>;

  /**
   * Apply transformation to document
   */
  readonly transformDocument: (
    document: Core.Document,
    transform: TextTransform
  ) => Effect.Effect<Core.Document, Core.NlpError>;
}

/**
 * Text transformer service tag
 * @since 2.0.0
 */
export class TextTransformerService extends Context.Tag(
  "effect-nlp/TextTransformer"
)<TextTransformerService, TextTransformer>() {}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Processing configuration
 * @since 2.0.0
 */
export interface ProcessingConfig {
  readonly enableEntityExtraction: boolean;
  readonly enableSentenceSegmentation: boolean;
  readonly enablePosTagging: boolean;
  readonly enableLemmatization: boolean;
  readonly entityLabels: ReadonlyArray<Core.EntityLabel>;
  readonly language: string;
}

/**
 * Default processing configuration
 * @since 2.0.0
 */
export const defaultConfig: ProcessingConfig = {
  enableEntityExtraction: true,
  enableSentenceSegmentation: true,
  enablePosTagging: true,
  enableLemmatization: true,
  entityLabels: [
    "PERSON",
    "ORGANIZATION",
    "LOCATION",
    "DATE",
    "TIME",
    "MONEY",
    "PERCENT",
    "EMAIL",
    "URL",
  ],
  language: "en",
};

// =============================================================================
// Data-First API Functions
// =============================================================================

/**
 * Process text into a document
 * @since 2.0.0
 */
export const process = (text: string) =>
  Effect.flatMap(DocumentProcessorService, (service) => service.process(text));

/**
 * Extract entities from text
 * @since 2.0.0
 */
export const extractEntities = (text: string) =>
  Effect.flatMap(DocumentProcessorService, (service) =>
    service.extractEntities(text)
  );

/**
 * Tokenize text
 * @since 2.0.0
 */
export const tokenize = (text: string) =>
  Effect.flatMap(DocumentProcessorService, (service) => service.tokenize(text));

/**
 * Get document statistics
 * @since 2.0.0
 */
export const getStats = (document: Core.Document) =>
  Effect.map(DocumentProcessorService, (service) => service.getStats(document));

/**
 * Find entities in document
 * @since 2.0.0
 */
export const findEntities =
  (predicate: (entity: Core.Entity) => boolean) => (document: Core.Document) =>
    Effect.map(DocumentQueryService, (service) =>
      service.findEntities(document, predicate)
    );

/**
 * Find tokens in document
 * @since 2.0.0
 */
export const findTokens =
  (predicate: (token: Core.Token) => boolean) => (document: Core.Document) =>
    Effect.map(DocumentQueryService, (service) =>
      service.findTokens(document, predicate)
    );

/**
 * Transform text
 * @since 2.0.0
 */
export const transform = (transform: TextTransform) => (text: string) =>
  Effect.flatMap(TextTransformerService, (service) =>
    service.transform(text, transform)
  );

/**
 * Transform document
 * @since 2.0.0
 */
export const transformDocument =
  (transform: TextTransform) => (document: Core.Document) =>
    Effect.flatMap(TextTransformerService, (service) =>
      service.transformDocument(document, transform)
    );

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Process text and extract specific entity types
 * @since 2.0.0
 */
export const extractEntitiesByLabel =
  (labels: ReadonlyArray<Core.EntityLabel>) => (text: string) =>
    Effect.flatMap(process(text), (doc) =>
      Effect.succeed(
        doc.getEntities().filter((entity) => labels.includes(entity.label))
      )
    );

/**
 * Get all person names from text
 * @since 2.0.0
 */
export const extractPersons = (text: string) =>
  extractEntitiesByLabel(["PERSON"])(text);

/**
 * Get all organizations from text
 * @since 2.0.0
 */
export const extractOrganizations = (text: string) =>
  extractEntitiesByLabel(["ORGANIZATION"])(text);

/**
 * Get all locations from text
 * @since 2.0.0
 */
export const extractLocations = (text: string) =>
  extractEntitiesByLabel(["LOCATION"])(text);

/**
 * Process text and get basic statistics
 * @since 2.0.0
 */
export const analyzeText = (text: string) =>
  Effect.gen(function* () {
    const document = yield* process(text);
    const stats = yield* getStats(document);
    return { document, stats };
  });
