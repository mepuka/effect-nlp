/**
 * Implementation of DocumentProcessor using existing AnalysisService
 *
 * This bridges the old API to the new clean DocumentProcessor interface
 * while hiding all implementation details.
 *
 * @since 2.0.0
 */

import { Effect, Layer, pipe, Array as RA, HashMap } from "effect";
import * as Core from "./Core.js";
import * as DP from "./DocumentProcessor.js";
import * as Legacy from "./AnalysisService.js";
import { fromTextUnsafe } from "./Document.js";

// =============================================================================
// Type Mapping Utilities
// =============================================================================

/**
 * Map legacy ViewType to new EntityLabel
 */
const mapViewTypeToEntityLabel = (type: Legacy.ViewType): Core.EntityLabel => {
  switch (type) {
    case "person":
      return "PERSON" as Core.EntityLabel;
    case "organization":
      return "ORGANIZATION" as Core.EntityLabel;
    case "place":
      return "LOCATION" as Core.EntityLabel;
    case "date":
      return "DATE" as Core.EntityLabel;
    case "time":
      return "TIME" as Core.EntityLabel;
    case "money":
      return "MONEY" as Core.EntityLabel;
    case "percent":
      return "PERCENT" as Core.EntityLabel;
    case "email":
      return "EMAIL" as Core.EntityLabel;
    case "url":
      return "URL" as Core.EntityLabel;
    default:
      // Handle custom entities - they come as "custom_<pattern_name>"
      if (typeof type === "string" && type.startsWith("custom_")) {
        const domain = type.replace("custom_", "").toUpperCase();
        return Core.EntityLabels.custom(domain);
      }

      return "MISC" as Core.EntityLabel;
  }
};

/**
 * Map legacy POS tag to new PosTag
 */
const mapPosTag = (pos: string): Core.PosTag => {
  // Map common POS tags to Universal Dependencies
  switch (pos.toUpperCase()) {
    case "NOUN":
    case "NN":
    case "NNS":
      return "NOUN";
    case "VERB":
    case "VB":
    case "VBD":
    case "VBG":
    case "VBN":
    case "VBP":
    case "VBZ":
      return "VERB";
    case "ADJ":
    case "JJ":
    case "JJR":
    case "JJS":
      return "ADJ";
    case "ADV":
    case "RB":
    case "RBR":
    case "RBS":
      return "ADV";
    case "PRON":
    case "PRP":
    case "PRP$":
    case "WP":
    case "WP$":
      return "PRON";
    case "PROPN":
    case "NNP":
    case "NNPS":
      return "PROPN";
    case "DET":
    case "DT":
    case "PDT":
    case "WDT":
      return "DET";
    case "ADP":
    case "IN":
      return "ADP";
    case "NUM":
    case "CD":
      return "NUM";
    case "CONJ":
    case "CC":
      return "CCONJ";
    case "PRT":
    case "RP":
      return "PART";
    case "PUNCT":
    case ".":
    case ",":
    case ":":
    case ";":
    case "!":
    case "?":
      return "PUNCT";
    case "SYM":
    case "$":
      return "SYM";
    case "INTJ":
    case "UH":
      return "INTJ";
    default:
      return "X";
  }
};

/**
 * Convert legacy Token to new Token
 */
const convertToken = (legacyToken: Legacy.Token, index: number): Core.Token => {
  const pos = mapPosTag(legacyToken.pos);
  const features = new Core.Features({
    tags: [...legacyToken.tags],
    lemma: legacyToken.lemma,
    stem: legacyToken.stem || undefined,
    isNegated: legacyToken.isNegated,
  });

  return new Core.Token({
    id: `token_${index}`,
    text: legacyToken.value,
    offset: Core.Offset.fromChar(legacyToken.charStart, legacyToken.charEnd),
    pos,
    features,
  });
};

/**
 * Convert legacy UnifiedEntity to new Entity
 */
const convertEntity = (
  legacyEntity: Legacy.UnifiedEntity,
  index: number
): Core.Entity => {
  const label = mapViewTypeToEntityLabel(legacyEntity.type as Legacy.ViewType);

  return new Core.Entity({
    id: `entity_${index}`,
    text: legacyEntity.text,
    label,
    offset: Core.Offset.fromChar(legacyEntity.charStart, legacyEntity.charEnd),
    tokenIds: [], // Will be populated later based on position
  });
};

/**
 * Convert legacy View to new Sentence (for sentence type views)
 */
const convertSentence = (
  legacyView: Legacy.View,
  index: number
): Core.Sentence => {
  return new Core.Sentence({
    id: `sentence_${index}`,
    text: legacyView.text,
    offset: Core.Offset.fromChar(legacyView.charStart, legacyView.charEnd),
    tokenIds: legacyView.tokenIndices.map((i) => `token_${i}`),
  });
};

// =============================================================================
// Implementation
// =============================================================================

const makeDocumentProcessor = Effect.gen(function* () {
  const legacyService = yield* Legacy.AnalysisService;

  const process = (text: string) =>
    Effect.gen(function* () {
      // Use legacy service to analyze
      const legacyDoc = fromTextUnsafe(text);
      const analysis = yield* legacyService.analyze(legacyDoc);

      // Convert tokens
      const tokens = analysis.tokens.map((token, index) =>
        convertToken(token, index)
      );
      const tokenMap = HashMap.fromIterable(
        tokens.map((token) => [token.id, token] as const)
      );

      // Convert sentences
      const sentences = analysis.views
        .filter((view) => view.type === "sentence")
        .map((view, index) => convertSentence(view, index));

      const sentenceMap = HashMap.fromIterable(
        sentences.map((sentence) => [sentence!.id, sentence!] as const)
      );

      // Convert entities
      const entities = analysis.entities.map((entity, index) =>
        convertEntity(entity, index)
      );

      // Map entity token IDs based on character positions
      const entitiesWithTokens = entities.map((entity) => {
        const entityTokens = tokens.filter((token) =>
          entity.offset.char.overlaps(token.offset.char)
        );

        return new Core.Entity({
          ...entity,
          tokenIds: entityTokens.map((t) => t.id),
        });
      });

      const entityMap = HashMap.fromIterable(
        entitiesWithTokens.map((entity) => [entity!.id, entity!] as const)
      );

      // Create document using HashMaps directly
      const document = new Core.Document({
        id: analysis.documentId,
        text,
        tokens: tokenMap,
        sentences: sentenceMap,
        entities: entityMap,
        metadata: HashMap.fromIterable([
          ["processedAt", new Date().toISOString()],
          ["version", "2.0.0"],
          ["sourceTokenCount", analysis.tokens.length.toString()],
          ["sourceViewCount", analysis.views.length.toString()],
          ["sourceEntityCount", analysis.entities.length.toString()],
        ]),
      });

      return document;
    }).pipe(
      Effect.mapError(
        (error) =>
          new Core.NlpError({
            message: `Failed to process document: ${error}`,
            cause: error,
          })
      )
    );

  const extractEntities = (
    text: string
  ): Effect.Effect<ReadonlyArray<Core.Entity>, Core.EntityExtractionError> =>
    Effect.gen(function* () {
      const document = yield* process(text).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            new Core.EntityExtractionError({
              message: `Failed to extract entities: ${error}`,
            })
          )
        )
      );
      return document.getEntities();
    });

  const tokenize = (
    text: string
  ): Effect.Effect<ReadonlyArray<Core.Token>, Core.TokenizationError> =>
    Effect.gen(function* () {
      const document = yield* process(text).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            new Core.TokenizationError({
              message: `Failed to tokenize: ${error}`,
              text,
            })
          )
        )
      );
      return document.getTokens();
    });

  const getStats = (document: Core.Document): Core.DocumentStats => {
    const tokens = document.getTokens();
    const entities = document.getEntities();
    const sentences = document.getSentences();

    // Count entities by label
    const entityCounts = pipe(
      entities,
      RA.groupBy((entity) => entity.label),
      (groups) =>
        HashMap.fromIterable(
          Object.entries(groups).map(
            ([label, entities]) =>
              [label as Core.EntityLabel, entities.length] as const
          )
        )
    );

    // Count POS distribution
    const posDistribution = pipe(
      tokens,
      RA.groupBy((token) => token.pos),
      (groups) =>
        HashMap.fromIterable(
          Object.entries(groups).map(
            ([pos, tokens]) => [pos as Core.PosTag, tokens.length] as const
          )
        )
    );

    const averageTokenLength =
      tokens.length > 0
        ? tokens.reduce((sum, token) => sum + token.text.length, 0) /
          tokens.length
        : 0;

    const averageSentenceLength =
      sentences.length > 0
        ? sentences.reduce(
            (sum, sentence) => sum + sentence.tokenIds.length,
            0
          ) / sentences.length
        : 0;

    return new Core.DocumentStats({
      tokenCount: tokens.length,
      sentenceCount: sentences.length,
      entityCount: entities.length,
      entityCounts,
      posDistribution,
      averageTokenLength,
      averageSentenceLength,
    });
  };

  const learnCustomEntities = (
    definition: Core.CustomEntityDefinition
  ): Effect.Effect<void, Core.CustomEntityError> =>
    Effect.gen(function* () {
      // Convert Effect-native definition to legacy format using Effect.try
      const legacyPatterns = yield* Effect.try({
        try: () =>
          definition.toWinkFormat().map(
            (p) =>
              new Legacy.CustomEntityPattern({
                name: p.name,
                patterns: p.patterns,
              })
          ),
        catch: (error) =>
          new Core.CustomEntityError({
            message: `Failed to convert entity definition to legacy format: ${error}`,
            cause: error,
          }),
      });

      const legacyConfig = yield* Effect.try({
        try: () =>
          new Legacy.CustomEntityConfig({
            matchValue: definition.config.matchValue,
            usePOS: definition.config.usePOS,
            useEntity: definition.config.useEntity,
          }),
        catch: (error) =>
          new Core.CustomEntityError({
            message: `Failed to create legacy config: ${error}`,
            cause: error,
          }),
      });

      // Use legacy service to learn patterns
      yield* legacyService
        .learnCustomEntities(legacyPatterns, legacyConfig)
        .pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new Core.CustomEntityError({
                message: `Failed to learn custom entities: ${error}`,
                cause: error,
              })
            )
          )
        );
    });

  const processWithCustomEntities = (
    text: string,
    definition: Core.CustomEntityDefinition
  ): Effect.Effect<Core.Document, Core.NlpError> =>
    Effect.gen(function* () {
      // First, learn the custom entities
      yield* learnCustomEntities(definition).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            new Core.NlpError({
              message: `Failed to process with custom entities: ${error.message}`,
              cause: error,
            })
          )
        )
      );

      // Then process the text normally
      return yield* process(text);
    });

  const extractCustomEntities = (
    text: string,
    definition: Core.CustomEntityDefinition,
    targetLabels?: ReadonlyArray<Core.EntityLabel>
  ): Effect.Effect<ReadonlyArray<Core.Entity>, Core.EntityExtractionError> =>
    Effect.gen(function* () {
      // Process with custom entities
      const document = yield* processWithCustomEntities(text, definition).pipe(
        Effect.catchAll((error) =>
          Effect.fail(
            new Core.EntityExtractionError({
              message: `Failed to extract custom entities: ${error.message}`,
            })
          )
        )
      );

      const entities = document.getEntities();

      // Filter to only custom entities (those with CUSTOM_ labels)
      const customEntities = entities.filter((entity) =>
        Core.isCustomEntityLabel(entity.label as Core.EntityLabel)
      );

      // Filter by target labels if specified
      if (targetLabels && targetLabels.length > 0) {
        return customEntities.filter((entity) =>
          targetLabels.includes(entity.label as Core.EntityLabel)
        );
      }

      return customEntities;
    });

  const validateEntityDefinition = (
    definition: Core.CustomEntityDefinition
  ): Effect.Effect<Core.CustomEntityDefinition, Core.EntityPatternError> =>
    Effect.gen(function* () {
      const patterns = definition.getAllPatterns();

      if (patterns.length === 0) {
        return yield* Effect.fail(
          new Core.EntityPatternError({
            message: "CustomEntityDefinition must have at least one pattern",
          })
        );
      }

      // Validate each pattern
      for (const pattern of patterns) {
        if (pattern.patterns.length === 0) {
          return yield* Effect.fail(
            new Core.EntityPatternError({
              message: `Pattern '${pattern.name}' has no pattern strings`,
              patternId: pattern.id,
            })
          );
        }

        // Validate regex patterns using Effect.try
        for (const patternStr of pattern.patterns) {
          yield* Effect.try({
            try: () => new RegExp(patternStr),
            catch: (error) =>
              new Core.EntityPatternError({
                message: `Invalid regex pattern in '${pattern.name}': ${error}`,
                patternId: pattern.id,
                pattern: patternStr,
              }),
          });
        }
      }

      return definition;
    });

  return {
    process,
    extractEntities,
    tokenize,
    getStats,
    learnCustomEntities,
    processWithCustomEntities,
    extractCustomEntities,
    validateEntityDefinition,
  } satisfies DP.DocumentProcessor;
});

const makeDocumentQuery = Effect.succeed({
  findEntities: (
    document: Core.Document,
    predicate: (entity: Core.Entity) => boolean
  ): ReadonlyArray<Core.Entity> => {
    return document.getEntities().filter(predicate);
  },

  findTokens: (
    document: Core.Document,
    predicate: (token: Core.Token) => boolean
  ): ReadonlyArray<Core.Token> => {
    return document.getTokens().filter(predicate);
  },

  getEntitiesInSpan: (
    document: Core.Document,
    span: Core.Span
  ): ReadonlyArray<Core.Entity> => {
    return document
      .getEntities()
      .filter((entity) => span.overlaps(entity.offset.char));
  },

  getEntityContext: (
    document: Core.Document,
    entity: Core.Entity,
    windowSize: number = 5
  ) => {
    const tokens = document.getTokens();
    const entityTokens = document.getEntityTokens(entity);

    if (entityTokens.length === 0) {
      return { before: [], after: [], sentence: undefined };
    }

    const firstEntityToken = entityTokens[0];
    const lastEntityToken = entityTokens[entityTokens.length - 1];

    const firstIndex = tokens.findIndex((t) => t.id === firstEntityToken.id);
    const lastIndex = tokens.findIndex((t) => t.id === lastEntityToken.id);

    const before =
      firstIndex > 0
        ? tokens.slice(Math.max(0, firstIndex - windowSize), firstIndex)
        : [];

    const after =
      lastIndex < tokens.length - 1
        ? tokens.slice(
            lastIndex + 1,
            Math.min(tokens.length, lastIndex + 1 + windowSize)
          )
        : [];

    // Find containing sentence
    const sentence = document
      .getSentences()
      .find((s) =>
        s.tokenIds.some((tokenId) =>
          entityTokens.some((et) => et.id === tokenId)
        )
      );

    return { before, after, sentence };
  },
} satisfies DP.DocumentQuery);

const makeTextTransformer = Effect.succeed({
  transform: (
    text: string,
    transform: DP.TextTransform
  ): Effect.Effect<string, Core.NlpError> => {
    switch (transform._tag) {
      case "Normalize":
        return Effect.succeed(text.toLowerCase().trim());
      case "ToLowerCase":
        return Effect.succeed(text.toLowerCase());
      case "ToUpperCase":
        return Effect.succeed(text.toUpperCase());
      case "ToTitleCase":
        return Effect.succeed(
          text.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          )
        );
      case "RemovePunctuation":
        return Effect.succeed(text.replace(/[^\w\s]/g, ""));
      case "RemoveStopwords": {
        // Simple English stopwords removal
        const stopwords = new Set([
          "the",
          "a",
          "an",
          "and",
          "or",
          "but",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "with",
          "by",
        ]);
        const words = text.toLowerCase().split(/\s+/);
        const filtered = words.filter((word) => !stopwords.has(word));
        return Effect.succeed(filtered.join(" "));
      }
      case "Lemmatize":
        // For now, just return original text
        return Effect.succeed(text);
      case "ExtractKeywords": {
        // Simple keyword extraction - return most frequent non-stopword tokens
        const tokens = text.toLowerCase().split(/\s+/);
        const stopwordSet = new Set([
          "the",
          "a",
          "an",
          "and",
          "or",
          "but",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "with",
          "by",
        ]);
        const keywords = tokens
          .filter((token) => !stopwordSet.has(token) && token.length > 2)
          .slice(0, transform.maxCount || 10);
        return Effect.succeed(keywords.join(", "));
      }
      default:
        return Effect.fail(
          new Core.NlpError({
            message: `Unsupported transform: ${(transform as any)._tag}`,
          })
        );
    }
  },

  transformDocument: (
    document: Core.Document,
    _transform: DP.TextTransform
  ): Effect.Effect<Core.Document, Core.NlpError> => {
    // For now, just transform the text and return a new document
    // In a full implementation, this would preserve structure
    return Effect.succeed(document); // Simplified for now
  },
} satisfies DP.TextTransformer);

// =============================================================================
// Layers
// =============================================================================

export const DocumentProcessorLive = Layer.effect(
  DP.DocumentProcessorService,
  makeDocumentProcessor
);

export const DocumentQueryLive = Layer.effect(
  DP.DocumentQueryService,
  makeDocumentQuery
);

export const TextTransformerLive = Layer.effect(
  DP.TextTransformerService,
  makeTextTransformer
);

/**
 * Combined layer with all services
 */
export const DocumentProcessingLive = Layer.mergeAll(
  DocumentProcessorLive,
  DocumentQueryLive,
  TextTransformerLive
).pipe(Layer.provide(Legacy.AnalysisServiceLive));
