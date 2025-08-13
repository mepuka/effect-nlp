/**
 * Core NLP types using Effect Schema for production-ready API
 *
 * This module defines the fundamental types for a clean, implementation-agnostic
 * NLP library built on Effect. All types use Effect Schema for validation,
 * serialization, and runtime type safety.
 *
 * @since 2.0.0
 */

import { Data, Schema, HashMap, Option } from "effect";

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

/**
 * Standard entity labels following common NER conventions
 * @since 2.0.0
 */
export const EntityLabel = Schema.Literal(
  "PERSON", // Person names
  "ORGANIZATION", // Company, agency, institution names
  "LOCATION", // Countries, cities, states
  "DATE", // Absolute or relative dates
  "TIME", // Times smaller than a day
  "MONEY", // Monetary values
  "PERCENT", // Percentage values
  "EMAIL", // Email addresses
  "URL", // Web URLs
  "PHONE", // Phone numbers
  "MISC" // Miscellaneous named entities
);

export type EntityLabel = Schema.Schema.Type<typeof EntityLabel>;

/**
 * A named entity with label and position
 * @since 2.0.0
 */
export class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.String,
  text: Schema.String.pipe(Schema.minLength(1)),
  label: EntityLabel,
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
      label,
      offset: Offset.fromChar(charStart, charEnd),
      tokenIds: [...tokenIds],
    });
}

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
   * Get all tokens as an ordered array
   */
  getTokens(): ReadonlyArray<Token> {
    return Array.from(HashMap.values(this.tokens)).sort(
      (a, b) => a.offset.char.start - b.offset.char.start
    );
  }

  /**
   * Get all sentences as an ordered array
   */
  getSentences(): ReadonlyArray<Sentence> {
    return Array.from(HashMap.values(this.sentences)).sort(
      (a, b) => a.offset.char.start - b.offset.char.start
    );
  }

  /**
   * Get all entities as an ordered array
   */
  getEntities(): ReadonlyArray<Entity> {
    return Array.from(HashMap.values(this.entities)).sort(
      (a, b) => a.offset.char.start - b.offset.char.start
    );
  }

  /**
   * Get entities by label
   */
  getEntitiesByLabel(label: EntityLabel): ReadonlyArray<Entity> {
    return this.getEntities().filter((entity) => entity.label === label);
  }

  /**
   * Get tokens within a span
   */
  getTokensInSpan(span: Span): ReadonlyArray<Token> {
    return this.getTokens().filter((token) => span.overlaps(token.offset.char));
  }

  /**
   * Get tokens for a specific entity
   */
  getEntityTokens(entity: Entity): ReadonlyArray<Token> {
    return entity.tokenIds
      .map((id) => HashMap.get(this.tokens, id))
      .filter(Option.isSome)
      .map((option) => option.value);
  }

  /**
   * Get sentence containing a token
   */
  getTokenSentence(token: Token): Sentence | undefined {
    return this.getSentences().find((sentence) =>
      sentence.tokenIds.includes(token.id)
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
    entityCounts: Schema.HashMap({ key: EntityLabel, value: Schema.Int }),
    posDistribution: Schema.HashMap({ key: PosTag, value: Schema.Int }),
    averageTokenLength: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
    averageSentenceLength: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
  }
) {}
