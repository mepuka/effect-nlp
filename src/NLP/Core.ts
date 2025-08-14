/**
 * Core NLP types using Effect Schema for production-ready API
 *
 * This module defines the fundamental types for a clean, implementation-agnostic
 * NLP library built on Effect. All types use Effect Schema for validation,
 * serialization, and runtime type safety.
 *
 * @since 2.0.0
 */

import { Data, Schema, HashMap, Option, Array, Order, pipe } from "effect";
import type { Brand } from "effect";

// =============================================================================
// Fundamental Position Types
// =============================================================================

/**
 * A character or token span with start and end positions
 * @since 2.0.0
 */
export class Span extends Schema.Class<Span>("Span")({
  start: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  end: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
}) {
  static readonly create = (start: number, end: number) => {
    // Validate that end >= start
    if (end < start) {
      throw new Error(`Invalid span: end (${end}) must be >= start (${start})`);
    }
    return new Span({ start, end });
  };

  get length(): number {
    return this.end - this.start;
  }

  contains(other: Span): boolean {
    return this.start <= other.start && this.end >= other.end;
  }

  overlaps(other: Span): boolean {
    return this.start < other.end && this.end > other.start;
  }
}

/**
 * Document position with character and optional token spans
 * @since 2.0.0
 */
export class Offset extends Schema.Class<Offset>("Offset")({
  char: Span,
  token: Schema.optional(Span),
}) {
  static readonly fromChar = (charStart: number, charEnd: number) =>
    new Offset({ char: Span.create(charStart, charEnd) });

  static readonly fromCharAndToken = (
    charStart: number,
    charEnd: number,
    tokenStart: number,
    tokenEnd: number
  ) =>
    new Offset({
      char: Span.create(charStart, charEnd),
      token: Span.create(tokenStart, tokenEnd),
    });

  get hasTokenSpan(): boolean {
    return this.token !== undefined;
  }
}

// =============================================================================
// Linguistic Feature Types
// =============================================================================

/**
 * Part-of-speech tags following Universal Dependencies
 * @since 2.0.0
 */
export const PosTag = Schema.Literal(
  "ADJ", // adjective
  "ADP", // adposition
  "ADV", // adverb
  "AUX", // auxiliary
  "CCONJ", // coordinating conjunction
  "DET", // determiner
  "INTJ", // interjection
  "NOUN", // noun
  "NUM", // numeral
  "PART", // particle
  "PRON", // pronoun
  "PROPN", // proper noun
  "PUNCT", // punctuation
  "SCONJ", // subordinating conjunction
  "SYM", // symbol
  "VERB", // verb
  "X" // other
);

export type PosTag = Schema.Schema.Type<typeof PosTag>;

/**
 * Morphological features
 * @since 2.0.0
 */
export class Features extends Schema.Class<Features>("Features")({
  tags: Schema.Array(Schema.String),
  lemma: Schema.String,
  stem: Schema.optional(Schema.String),
  isNegated: Schema.Boolean,
}) {}

// =============================================================================
// Core Linguistic Units
// =============================================================================

/**
 * A token with full linguistic analysis
 * @since 2.0.0
 */
export class Token extends Schema.Class<Token>("Token")({
  id: Schema.String,
  text: Schema.String.pipe(Schema.minLength(1)),
  offset: Offset,
  pos: PosTag,
  features: Features,
}) {
  static readonly create = (
    id: string,
    text: string,
    charStart: number,
    charEnd: number,
    pos: PosTag,
    lemma: string,
    tags: ReadonlyArray<string> = [],
    isNegated: boolean = false
  ) =>
    new Token({
      id,
      text,
      offset: Offset.fromChar(charStart, charEnd),
      pos,
      features: new Features({ tags: [...tags], lemma, isNegated }),
    });

  get isProperNoun(): boolean {
    return this.pos === "PROPN";
  }

  get isPunctuation(): boolean {
    return this.pos === "PUNCT";
  }

  get normalizedText(): string {
    return this.features.lemma.toLowerCase();
  }
}

/**
 * A sentence containing tokens
 * @since 2.0.0
 */
export class Sentence extends Schema.Class<Sentence>("Sentence")({
  id: Schema.String,
  text: Schema.String.pipe(Schema.minLength(1)),
  offset: Offset,
  tokenIds: Schema.Array(Schema.String),
}) {
  static readonly create = (
    id: string,
    text: string,
    charStart: number,
    charEnd: number,
    tokenIds: ReadonlyArray<string>
  ) =>
    new Sentence({
      id,
      text,
      offset: Offset.fromChar(charStart, charEnd),
      tokenIds: [...tokenIds],
    });
}

// =============================================================================
// Entity Types
// =============================================================================

// =============================================================================
// Entity Label System with Branded Types
// =============================================================================

/**
 * Base entity label brand for type safety
 * @since 2.0.0
 */
export type EntityLabelBrand<T extends string> = string & Brand.Brand<T>;

/**
 * Standard NER entity labels as branded types
 * @since 2.0.0
 */
export type PersonLabel = EntityLabelBrand<"PERSON">;
export type OrganizationLabel = EntityLabelBrand<"ORGANIZATION">;
export type LocationLabel = EntityLabelBrand<"LOCATION">;
export type DateLabel = EntityLabelBrand<"DATE">;
export type TimeLabel = EntityLabelBrand<"TIME">;
export type MoneyLabel = EntityLabelBrand<"MONEY">;
export type PercentLabel = EntityLabelBrand<"PERCENT">;
export type EmailLabel = EntityLabelBrand<"EMAIL">;
export type UrlLabel = EntityLabelBrand<"URL">;
export type PhoneLabel = EntityLabelBrand<"PHONE">;
export type MiscLabel = EntityLabelBrand<"MISC">;

/**
 * Union of all standard entity labels
 * @since 2.0.0
 */
export type StandardEntityLabel =
  | PersonLabel
  | OrganizationLabel
  | LocationLabel
  | DateLabel
  | TimeLabel
  | MoneyLabel
  | PercentLabel
  | EmailLabel
  | UrlLabel
  | PhoneLabel
  | MiscLabel;

/**
 * Custom entity label for domain-specific entities
 * @since 2.0.0
 */
export type CustomEntityLabel<T extends string = string> =
  EntityLabelBrand<`CUSTOM_${T}`>;

/**
 * All possible entity labels (standard + custom)
 * @since 2.0.0
 */
export type EntityLabel = StandardEntityLabel | CustomEntityLabel;

/**
 * Entity label constructors with validation
 * @since 2.0.0
 */
export const EntityLabels = {
  // Standard labels - these create the branded values directly
  PERSON: "PERSON" as PersonLabel,
  ORGANIZATION: "ORGANIZATION" as OrganizationLabel,
  LOCATION: "LOCATION" as LocationLabel,
  DATE: "DATE" as DateLabel,
  TIME: "TIME" as TimeLabel,
  MONEY: "MONEY" as MoneyLabel,
  PERCENT: "PERCENT" as PercentLabel,
  EMAIL: "EMAIL" as EmailLabel,
  URL: "URL" as UrlLabel,
  PHONE: "PHONE" as PhoneLabel,
  MISC: "MISC" as MiscLabel,

  // Custom label constructor
  custom: <T extends string>(domain: T): CustomEntityLabel<T> =>
    `CUSTOM_${domain}` as CustomEntityLabel<T>,
} as const;

/**
 * Schema for entity labels with runtime validation
 * @since 2.0.0
 */
export const EntityLabelSchema = Schema.Union(
  Schema.Literal(
    "PERSON",
    "ORGANIZATION",
    "LOCATION",
    "DATE",
    "TIME",
    "MONEY",
    "PERCENT",
    "EMAIL",
    "URL",
    "PHONE",
    "MISC"
  ),
  Schema.String.pipe(Schema.startsWith("CUSTOM_"))
);

/**
 * Type guard for standard entity labels
 * @since 2.0.0
 */
export const isStandardEntityLabel = (
  label: EntityLabel
): label is StandardEntityLabel => {
  const standardLabels = [
    "PERSON",
    "ORGANIZATION",
    "LOCATION",
    "DATE",
    "TIME",
    "MONEY",
    "PERCENT",
    "EMAIL",
    "URL",
    "PHONE",
    "MISC",
  ];
  return standardLabels.includes(label as string);
};

/**
 * Type guard for custom entity labels
 * @since 2.0.0
 */
export const isCustomEntityLabel = (
  label: EntityLabel
): label is CustomEntityLabel => {
  return (label as string).startsWith("CUSTOM_");
};

/**
 * Extract domain from custom entity label
 * @since 2.0.0
 */
export const getCustomLabelDomain = (label: CustomEntityLabel): string => {
  return (label as string).replace("CUSTOM_", "");
};

// Legacy compatibility - maintain old Schema.Literal for existing code
export const LegacyEntityLabel = Schema.Literal(
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "DATE",
  "TIME",
  "MONEY",
  "PERCENT",
  "EMAIL",
  "URL",
  "PHONE",
  "MISC"
);

export type LegacyEntityLabel = Schema.Schema.Type<typeof LegacyEntityLabel>;

/**
 * A named entity with label and position
 * @since 2.0.0
 */
export class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.String,
  text: Schema.String.pipe(Schema.minLength(1)),
  label: EntityLabelSchema,
  offset: Offset,
  tokenIds: Schema.Array(Schema.String),
}) {
  static readonly create = (
    id: string,
    text: string,
    label: EntityLabel,
    charStart: number,
    charEnd: number,
    tokenIds: ReadonlyArray<string>
  ) =>
    new Entity({
      id,
      text,
      label, // EntityLabelSchema will handle the validation
      offset: Offset.fromChar(charStart, charEnd),
      tokenIds: [...tokenIds],
    });

  /**
   * Check if this entity has a specific label
   */
  hasLabel<T extends EntityLabel>(label: T): this is Entity & { label: T } {
    return this.label === label;
  }

  /**
   * Check if this entity is a standard entity type
   */
  get isStandardEntity(): boolean {
    return isStandardEntityLabel(this.label as EntityLabel);
  }

  /**
   * Check if this entity is a custom entity type
   */
  get isCustomEntity(): boolean {
    return isCustomEntityLabel(this.label as EntityLabel);
  }

  /**
   * Get the domain if this is a custom entity
   */
  get customDomain(): Option.Option<string> {
    return this.isCustomEntity
      ? Option.some(getCustomLabelDomain(this.label as CustomEntityLabel))
      : Option.none();
  }
}

// =============================================================================
// Order Instances for Domain Types
// =============================================================================

/**
 * Order instances for sorting domain types using Effect's Order system
 * @since 2.0.0
 */
export const EntityOrder = {
  /**
   * Sort entities by character position (start position)
   */
  byPosition: Order.mapInput(
    Order.number,
    (entity: Entity) => entity.offset.char.start
  ),

  /**
   * Sort entities by text length
   */
  byTextLength: Order.mapInput(
    Order.number,
    (entity: Entity) => entity.text.length
  ),

  /**
   * Sort entities by label (alphabetical)
   */
  byLabel: Order.mapInput(Order.string, (entity: Entity) => entity.label),

  /**
   * Sort entities by text content (alphabetical)
   */
  byText: Order.mapInput(Order.string, (entity: Entity) => entity.text),
} as const;

export const TokenOrder = {
  /**
   * Sort tokens by character position (start position)
   */
  byPosition: Order.mapInput(
    Order.number,
    (token: Token) => token.offset.char.start
  ),

  /**
   * Sort tokens by text content (alphabetical)
   */
  byText: Order.mapInput(Order.string, (token: Token) => token.text),
} as const;

export const SentenceOrder = {
  /**
   * Sort sentences by character position (start position)
   */
  byPosition: Order.mapInput(
    Order.number,
    (sentence: Sentence) => sentence.offset.char.start
  ),
} as const;

// =============================================================================
// Entity Collection Operations (Effect-Style)
// =============================================================================

/**
 * Effect-style entity filtering operations with type inference
 * @since 2.0.0
 */
export const EntityOperations = {
  /**
   * Filter entities by specific label with type narrowing
   */
  filterByLabel:
    <T extends EntityLabel>(label: T) =>
    (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity & { label: T }> =>
      Array.filter(
        entities,
        (entity): entity is Entity & { label: T } => entity.label === label
      ),

  /**
   * Filter entities by multiple labels
   */
  filterByLabels:
    <T extends EntityLabel>(labels: ReadonlyArray<T>) =>
    (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
      Array.filter(entities, (entity) =>
        Array.some(labels, (label) => entity.label === label)
      ),

  /**
   * Filter standard entities only
   */
  filterStandard: (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
    Array.filter(entities, (entity) => entity.isStandardEntity),

  /**
   * Filter custom entities only
   */
  filterCustom: (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
    Array.filter(entities, (entity) => entity.isCustomEntity),

  /**
   * Filter custom entities by domain
   */
  filterByDomain:
    (domain: string) =>
    (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
      Array.filter(
        entities,
        (entity) =>
          entity.isCustomEntity &&
          Option.isSome(entity.customDomain) &&
          entity.customDomain.value === domain
      ),

  /**
   * Group entities by label using Effect's groupBy
   */
  groupByLabel: (
    entities: ReadonlyArray<Entity>
  ): HashMap.HashMap<string, ReadonlyArray<Entity>> =>
    HashMap.fromIterable(
      Object.entries(Array.groupBy(entities, (entity) => entity.label))
    ),

  /**
   * Find first entity with specific label
   */
  findByLabel:
    <T extends EntityLabel>(label: T) =>
    (entities: ReadonlyArray<Entity>): Option.Option<Entity & { label: T }> =>
      Array.findFirst(
        entities,
        (entity): entity is Entity & { label: T } => entity.label === label
      ),

  /**
   * Check if any entity has specific label
   */
  hasLabel:
    (label: EntityLabel) =>
    (entities: ReadonlyArray<Entity>): boolean =>
      Array.some(entities, (entity) => entity.label === label),

  /**
   * Count entities by label
   */
  countByLabel: (
    entities: ReadonlyArray<Entity>
  ): HashMap.HashMap<string, number> =>
    pipe(
      entities,
      Array.groupBy((entity) => entity.label),
      (groups) =>
        HashMap.fromIterable(
          Array.map(Object.entries(groups), ([label, entityGroup]) => [
            label,
            entityGroup.length,
          ])
        )
    ),

  /**
   * Get unique labels from entities
   */
  getUniqueLabels: (entities: ReadonlyArray<Entity>): ReadonlyArray<string> =>
    pipe(
      entities,
      Array.map((entity) => entity.label),
      Array.dedupe
    ),

  /**
   * Filter entities by text pattern
   */
  filterByTextPattern:
    (pattern: RegExp) =>
    (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
      Array.filter(entities, (entity) => pattern.test(entity.text)),

  /**
   * Filter entities by text length
   */
  filterByTextLength:
    (minLength: number, maxLength?: number) =>
    (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
      Array.filter(entities, (entity) => {
        const length = entity.text.length;
        return (
          length >= minLength &&
          (maxLength === undefined || length <= maxLength)
        );
      }),

  /**
   * Sort entities by position using Effect's Order
   */
  sortByPosition: (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
    Array.sort(entities, EntityOrder.byPosition),

  /**
   * Sort entities by text length using Effect's Order
   */
  sortByTextLength: (entities: ReadonlyArray<Entity>): ReadonlyArray<Entity> =>
    Array.sort(entities, EntityOrder.byTextLength),
} as const;

// =============================================================================
// Streamlined Entity Operations (Dual API)
// =============================================================================

/**
 * Streamlined entity operations with dual API support (data-first and data-last)
 * @since 2.1.0
 */
export const E = EntityOperations;

// =============================================================================
// Document Structure
// =============================================================================

/**
 * Complete document analysis with all linguistic information
 * @since 2.0.0
 */
export class Document extends Schema.Class<Document>("Document")({
  id: Schema.String,
  text: Schema.String,
  tokens: Schema.HashMap({ key: Schema.String, value: Token }),
  sentences: Schema.HashMap({ key: Schema.String, value: Sentence }),
  entities: Schema.HashMap({ key: Schema.String, value: Entity }),
  metadata: Schema.HashMap({ key: Schema.String, value: Schema.Unknown }),
}) {
  /**
   * Get all tokens as an ordered array using Effect data structures
   */
  getTokens(): ReadonlyArray<Token> {
    return pipe(
      HashMap.values(this.tokens),
      Array.fromIterable,
      Array.sort(TokenOrder.byPosition)
    );
  }

  /**
   * Get all sentences as an ordered array using Effect data structures
   */
  getSentences(): ReadonlyArray<Sentence> {
    return pipe(
      HashMap.values(this.sentences),
      Array.fromIterable,
      Array.sort(SentenceOrder.byPosition)
    );
  }

  /**
   * Get all entities as an ordered array using Effect data structures
   */
  getEntities(): ReadonlyArray<Entity> {
    return pipe(
      HashMap.values(this.entities),
      Array.fromIterable,
      Array.sort(EntityOrder.byPosition)
    );
  }

  /**
   * Get entities by label using Effect data structures
   * @deprecated Use pipe(document.getEntities(), E.filterByLabel(label)) for better composability
   */
  getEntitiesByLabel(label: EntityLabel): ReadonlyArray<Entity> {
    return pipe(this.getEntities(), E.filterByLabel(label));
  }

  /**
   * Get tokens within a span using Effect data structures
   */
  getTokensInSpan(span: Span): ReadonlyArray<Token> {
    return pipe(
      this.getTokens(),
      Array.filter((token) => span.overlaps(token.offset.char))
    );
  }

  /**
   * Get tokens for a specific entity using Effect data structures
   */
  getEntityTokens(entity: Entity): ReadonlyArray<Token> {
    return pipe(
      entity.tokenIds,
      Array.map((id) => HashMap.get(this.tokens, id)),
      Array.filter(Option.isSome),
      Array.map((option) => option.value)
    );
  }

  /**
   * Get sentence containing a token using Effect data structures
   */
  getTokenSentence(token: Token): Sentence | undefined {
    return pipe(
      this.getSentences(),
      Array.findFirst((sentence) => sentence.tokenIds.includes(token.id)),
      Option.getOrUndefined
    );
  }
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * NLP processing errors
 * @since 2.0.0
 */
export class NlpError extends Data.TaggedError("NlpError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class TokenizationError extends Data.TaggedError("TokenizationError")<{
  readonly message: string;
  readonly text: string;
  readonly position?: number;
}> {}

export class EntityExtractionError extends Data.TaggedError(
  "EntityExtractionError"
)<{
  readonly message: string;
  readonly entityType?: string;
}> {}

/**
 * Error for custom entity pattern operations
 * @since 2.0.0
 */
export class CustomEntityError extends Data.TaggedError("CustomEntityError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error for invalid entity patterns
 * @since 2.0.0
 */
export class EntityPatternError extends Data.TaggedError("EntityPatternError")<{
  readonly message: string;
  readonly patternId?: string;
  readonly pattern?: string;
}> {}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Document processing statistics
 * @since 2.0.0
 */
export class DocumentStats extends Schema.Class<DocumentStats>("DocumentStats")(
  {
    tokenCount: Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0)
    ),
    sentenceCount: Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0)
    ),
    entityCount: Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(0)
    ),
    entityCounts: Schema.HashMap({ key: EntityLabelSchema, value: Schema.Int }),
    posDistribution: Schema.HashMap({ key: PosTag, value: Schema.Int }),
    averageTokenLength: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
    averageSentenceLength: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
  }
) {}

// =============================================================================
// Custom Entity Pattern Types
// =============================================================================

/**
 * Configuration for custom entity learning
 * @since 2.0.0
 */
export class CustomEntityConfig extends Schema.Class<CustomEntityConfig>(
  "CustomEntityConfig"
)({
  matchValue: Schema.Boolean,
  usePOS: Schema.Boolean,
  useEntity: Schema.Boolean,
}) {
  static readonly create = (
    options: {
      matchValue?: boolean;
      usePOS?: boolean;
      useEntity?: boolean;
    } = {}
  ) =>
    new CustomEntityConfig({
      matchValue: options.matchValue ?? false,
      usePOS: options.usePOS ?? true,
      useEntity: options.useEntity ?? true,
    });

  static readonly default = CustomEntityConfig.create();
}

/**
 * A pattern for custom entity recognition following wink-nlp format
 * @since 2.0.0
 * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
 */
export class EntityPattern extends Schema.Class<EntityPattern>("EntityPattern")(
  {
    id: Schema.String,
    name: Schema.String.pipe(Schema.minLength(1)),
    label: EntityLabelSchema,
    patterns: Schema.Array(Schema.String.pipe(Schema.minLength(1))),
    examples: Schema.Array(Schema.String),
    priority: Schema.Number.pipe(Schema.int(), Schema.between(1, 10)),
    metadata: Schema.HashMap({ key: Schema.String, value: Schema.Unknown }),
    mark: Schema.optional(Schema.Tuple(Schema.Number, Schema.Number)),
  }
) {
  static readonly create = (
    id: string,
    name: string,
    label: string,
    patterns: ReadonlyArray<string>,
    options: {
      examples?: ReadonlyArray<string>;
      priority?: number;
      metadata?: Record<string, unknown>;
      mark?: [number, number];
    } = {}
  ) => {
    if (patterns.length === 0) {
      throw new Error("EntityPattern must have at least one pattern");
    }

    return new EntityPattern({
      id,
      name,
      label,
      patterns: [...patterns],
      examples: [...(options.examples ?? [])],
      priority: options.priority ?? 5,
      metadata: HashMap.fromIterable(Object.entries(options.metadata ?? {})),
      mark: options.mark,
    });
  };

  /**
   * Create a pattern for matching specific terms using wink-nlp shorthand syntax
   * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
   */
  static readonly forTerms = (
    id: string,
    name: string,
    label: string,
    terms: ReadonlyArray<string>,
    examples: ReadonlyArray<string> = [],
    priority: number = 5
  ) => {
    // Use wink-nlp shorthand pattern syntax: [term1|term2|term3]
    const shorthandPattern = `[${terms.join("|")}]`;

    return EntityPattern.create(id, name, label, [shorthandPattern], {
      examples: examples.length > 0 ? [...examples] : [...terms],
      priority,
    });
  };

  /**
   * Create a pattern for matching regex patterns
   * Note: In wink-nlp, regex patterns are used directly as strings
   * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
   */
  static readonly forRegex = (
    id: string,
    name: string,
    label: string,
    regex: string,
    examples: ReadonlyArray<string> = [],
    priority: number = 5
  ) =>
    EntityPattern.create(id, name, label, [regex], {
      examples: [...examples],
      priority,
    });

  /**
   * Create a pattern for matching POS sequences using wink-nlp syntax
   * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
   */
  static readonly forPosSequence = (
    id: string,
    name: string,
    label: string,
    posSequence: ReadonlyArray<PosTag>,
    examples: ReadonlyArray<string> = [],
    priority: number = 5
  ) => {
    // Use wink-nlp POS pattern syntax: space-separated POS tags
    const pattern = posSequence.join(" ");
    return EntityPattern.create(id, name, label, [pattern], {
      examples:
        examples.length > 0
          ? [...examples]
          : [`POS sequence: ${posSequence.join(" → ")}`],
      priority,
    });
  };

  /**
   * Create a pattern using wink-nlp shorthand syntax
   * Example: "[|DET] [|ADJ] [NOUN|PROPN]" for optional determiners and adjectives with required nouns
   * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
   */
  static readonly forShorthand = (
    id: string,
    name: string,
    label: string,
    shorthandPattern: string,
    examples: ReadonlyArray<string> = [],
    priority: number = 5,
    mark?: [number, number]
  ) => {
    const options: {
      examples?: ReadonlyArray<string>;
      priority?: number;
      metadata?: Record<string, unknown>;
      mark?: [number, number];
    } = {
      examples: [...examples],
      priority,
    };

    if (mark !== undefined) {
      options.mark = mark;
    }

    return EntityPattern.create(id, name, label, [shorthandPattern], options);
  };

  /**
   * Create a noun phrase pattern using wink-nlp shorthand syntax
   * Equivalent to "[|DET] [|ADJ] [NOUN|PROPN]"
   */
  static readonly forNounPhrase = (
    id: string,
    name: string = "Noun Phrases",
    label: string = "MISC",
    priority: number = 5
  ) => {
    return EntityPattern.forShorthand(
      id,
      name,
      label,
      "[|DET] [|ADJ] [NOUN|PROPN]",
      ["the big house", "beautiful garden", "President", "small cat"],
      priority
    );
  };

  get hasExamples(): boolean {
    return this.examples.length > 0;
  }

  get hasMark(): boolean {
    return this.mark !== undefined;
  }

  get isHighPriority(): boolean {
    return this.priority >= 7;
  }

  addExample(example: string): EntityPattern {
    return new EntityPattern({
      ...this,
      examples: [...this.examples, example],
    });
  }

  addMetadata(key: string, value: unknown): EntityPattern {
    return new EntityPattern({
      ...this,
      metadata: HashMap.set(this.metadata, key, value),
    });
  }
}

/**
 * A collection of custom entity patterns for a specific domain
 * @since 2.0.0
 */
export class CustomEntityDefinition extends Schema.Class<CustomEntityDefinition>(
  "CustomEntityDefinition"
)({
  id: Schema.String,
  domain: Schema.String.pipe(Schema.minLength(1)),
  version: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.optional(Schema.String),
  patterns: Schema.HashMap({ key: Schema.String, value: EntityPattern }),
  config: CustomEntityConfig,
  createdAt: Schema.String, // ISO string format
  updatedAt: Schema.String, // ISO string format
}) {
  static readonly create = (
    id: string,
    domain: string,
    version: string,
    patterns: ReadonlyArray<EntityPattern>,
    options: {
      description?: string;
      config?: CustomEntityConfig;
    } = {}
  ) => {
    const now = new Date().toISOString();
    const patternMap = HashMap.fromIterable(
      Array.map(patterns, (pattern) => [pattern.id, pattern] as const)
    );

    return new CustomEntityDefinition({
      id,
      domain,
      version,
      description: options.description,
      patterns: patternMap,
      config: options.config ?? CustomEntityConfig.default,
      createdAt: now,
      updatedAt: now,
    });
  };

  /**
   * Add a new pattern to this definition
   */
  addPattern(pattern: EntityPattern): CustomEntityDefinition {
    return new CustomEntityDefinition({
      ...this,
      patterns: HashMap.set(this.patterns, pattern.id, pattern),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Remove a pattern by ID
   */
  removePattern(patternId: string): CustomEntityDefinition {
    return new CustomEntityDefinition({
      ...this,
      patterns: HashMap.remove(this.patterns, patternId),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get patterns by entity label using Effect data structures
   */
  getPatternsByLabel(label: string): ReadonlyArray<EntityPattern> {
    return pipe(
      HashMap.values(this.patterns),
      Array.fromIterable,
      Array.filter((p) => p.label === label)
    );
  }

  /**
   * Get all patterns as an array using Effect data structures
   */
  getAllPatterns(): ReadonlyArray<EntityPattern> {
    return pipe(HashMap.values(this.patterns), Array.fromIterable);
  }

  /**
   * Get pattern count
   */
  get patternCount(): number {
    return HashMap.size(this.patterns);
  }

  /**
   * Check if definition has patterns for a specific label
   */
  hasPatternForLabel(label: string): boolean {
    return this.getPatternsByLabel(label).length > 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: CustomEntityConfig): CustomEntityDefinition {
    return new CustomEntityDefinition({
      ...this,
      config,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Convert to wink-compatible format
   * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
   */
  toWinkFormat(): ReadonlyArray<{
    name: string;
    patterns: ReadonlyArray<string>;
    mark?: [number, number];
  }> {
    return Array.map(this.getAllPatterns(), (pattern) => {
      const result: {
        name: string;
        patterns: ReadonlyArray<string>;
        mark?: [number, number];
      } = {
        name: pattern.name,
        patterns: pattern.patterns,
      };

      if (pattern.mark !== undefined) {
        result.mark = [pattern.mark[0], pattern.mark[1]]; // Convert readonly tuple to mutable
      }

      return result;
    });
  }
}
