/**
 * Clean DocumentProcessor API for production NLP
 *
 * This module provides a single, clean interface for document processing
 * that hides all implementation details of underlying NLP libraries.
 *
 * @since 2.0.0
 */

import { Context, Effect, Schema } from "effect";
import * as Core from "./Core.js";

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

  /**
   * Learn custom entity patterns for recognition
   */
  readonly learnCustomEntities: (
    definition: Core.CustomEntityDefinition
  ) => Effect.Effect<void, Core.CustomEntityError>;

  /**
   * Process text with custom entity patterns
   */
  readonly processWithCustomEntities: (
    text: string,
    definition: Core.CustomEntityDefinition
  ) => Effect.Effect<Core.Document, Core.NlpError>;

  /**
   * Extract custom entities from text
   */
  readonly extractCustomEntities: (
    text: string,
    definition: Core.CustomEntityDefinition,
    targetLabels?: ReadonlyArray<Core.EntityLabel>
  ) => Effect.Effect<ReadonlyArray<Core.Entity>, Core.EntityExtractionError>;

  /**
   * Validate custom entity definition
   */
  readonly validateEntityDefinition: (
    definition: Core.CustomEntityDefinition
  ) => Effect.Effect<Core.CustomEntityDefinition, Core.EntityPatternError>;
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
    Core.EntityLabels.PERSON,
    Core.EntityLabels.ORGANIZATION,
    Core.EntityLabels.LOCATION,
    Core.EntityLabels.DATE,
    Core.EntityLabels.TIME,
    Core.EntityLabels.MONEY,
    Core.EntityLabels.PERCENT,
    Core.EntityLabels.EMAIL,
    Core.EntityLabels.URL,
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
        doc
          .getEntities()
          .filter((entity) => labels.includes(entity.label as Core.EntityLabel))
      )
    );

/**
 * Streamlined entity extraction by type
 * @since 2.1.0
 */
export const extract = {
  /**
   * Get all person names from text
   */
  persons: (text: string) =>
    extractEntitiesByLabel([Core.EntityLabels.PERSON])(text),

  /**
   * Get all organizations from text
   */
  organizations: (text: string) =>
    extractEntitiesByLabel([Core.EntityLabels.ORGANIZATION])(text),

  /**
   * Get all locations from text
   */
  locations: (text: string) =>
    extractEntitiesByLabel([Core.EntityLabels.LOCATION])(text),

  /**
   * Get all entities of specific types
   */
  byLabels: (labels: ReadonlyArray<Core.EntityLabel>) => (text: string) =>
    extractEntitiesByLabel(labels)(text),
} as const;

// Legacy exports (deprecated)
/** @deprecated Use extract.persons instead */
export const extractPersons = extract.persons;
/** @deprecated Use extract.organizations instead */
export const extractOrganizations = extract.organizations;
/** @deprecated Use extract.locations instead */
export const extractLocations = extract.locations;

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

// =============================================================================
// Custom Entity API Functions
// =============================================================================

/**
 * Learn custom entity patterns
 * @since 2.0.0
 */
export const learnCustomEntities = (definition: Core.CustomEntityDefinition) =>
  Effect.flatMap(DocumentProcessorService, (service) =>
    service.learnCustomEntities(definition)
  );

/**
 * Process text with custom entity patterns
 * @since 2.0.0
 */
export const processWithCustomEntities =
  (definition: Core.CustomEntityDefinition) => (text: string) =>
    Effect.flatMap(DocumentProcessorService, (service) =>
      service.processWithCustomEntities(text, definition)
    );

/**
 * Extract custom entities from text
 * @since 2.0.0
 */
export const extractCustomEntities =
  (
    definition: Core.CustomEntityDefinition,
    targetLabels?: ReadonlyArray<Core.EntityLabel>
  ) =>
  (text: string) =>
    Effect.flatMap(DocumentProcessorService, (service) =>
      service.extractCustomEntities(text, definition, targetLabels)
    );

/**
 * Validate custom entity definition
 * @since 2.0.0
 */
export const validateEntityDefinition = (
  definition: Core.CustomEntityDefinition
) =>
  Effect.flatMap(DocumentProcessorService, (service) =>
    service.validateEntityDefinition(definition)
  );

/**
 * Create and validate custom entity definition (legacy API)
 * @since 2.0.0
 * @deprecated Use createCustomEntityDefinitionFromOptions for better ergonomics
 */
export const createCustomEntityDefinition = (
  id: string,
  domain: string,
  version: string,
  patterns: ReadonlyArray<Core.EntityPattern>,
  options?: {
    description?: string;
    config?: Core.CustomEntityConfig;
  }
) =>
  createCustomEntityDefinitionFromOptions({
    id,
    domain,
    version,
    patterns,
    description: options?.description,
    config: options?.config,
  });

// =============================================================================
// Friendly Options-based API for Custom Entities
// =============================================================================

/**
 * Schema for creating a CustomEntityDefinition using a single options object.
 * - `version` defaults to "1.0.0"
 * - `id` defaults to `${domain}_patterns`
 *
 * @since 2.1.0
 */
export const CustomEntityDefinitionOptionsSchema = Schema.Struct({
  domain: Schema.String,
  patterns: Schema.Array(Core.EntityPattern),
  description: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  id: Schema.optional(Schema.String),
  config: Schema.optional(Core.CustomEntityConfig),
});

export type CustomEntityDefinitionOptions =
  typeof CustomEntityDefinitionOptionsSchema.Type;

/**
 * Create and validate a CustomEntityDefinition from a single options object.
 * Applies sensible defaults and derives `id` from `domain` when omitted.
 *
 * @example
 * createCustomEntityDefinitionFromOptions({
 *   domain: "technology",
 *   patterns,
 *   // version: defaults to "1.0.0"
 *   // id: defaults to `${domain}_patterns`
 * })
 */
export const createCustomEntityDefinitionFromOptions = (
  options: CustomEntityDefinitionOptions
) =>
  Effect.gen(function* () {
    // Decode/validate the options
    const parsed = options; // options are already strongly typed at compile-time

    const domain = parsed.domain;
    const version = parsed.version ?? "1.0.0";
    const id = parsed.id ?? `${domain}_patterns`;

    const definition = Core.CustomEntityDefinition.create(
      id,
      domain,
      version,
      parsed.patterns,
      {
        description: parsed.description ?? `${domain} patterns`,
        config: parsed.config ?? Core.CustomEntityConfig.default,
      }
    );

    return yield* validateEntityDefinition(definition);
  });

/**
 * Extract entities using custom patterns for specific domain
 * @since 2.0.0
 */
export const extractDomainEntities =
  (domain: string, patterns: ReadonlyArray<Core.EntityPattern>) =>
  (text: string) =>
    Effect.gen(function* () {
      const definition = yield* createCustomEntityDefinitionFromOptions({
        domain,
        patterns,
      });
      return yield* extractCustomEntities(definition)(text);
    });
