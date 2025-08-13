/**
 * @since 1.0.0
 */

import { Schema } from "effect";

// =============================================================================
// Symbols
// =============================================================================

/**
 * @since 1.0.0
 * @category symbols
 */
export const POSTypeId: unique symbol = Symbol.for("effect-nlp/POS");

/**
 * @since 1.0.0
 * @category symbols
 */
export const SentenceTypeId: unique symbol = Symbol.for("effect-nlp/Sentence");

/**
 * @since 1.0.0
 * @category symbols
 */
export type SentenceTypeId = typeof SentenceTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const TokenTypeId: unique symbol = Symbol.for("effect-nlp/Token");

/**
 * @since 1.0.0
 * @category symbols
 */
export type TokenTypeId = typeof TokenTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const CompromiseDataTypeId: unique symbol = Symbol.for(
  "effect-nlp/CompromiseData"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type CompromiseDataTypeId = typeof CompromiseDataTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export type POSTypeId = typeof POSTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * Part-of-Speech tags based on Universal Dependencies
 * @since 1.0.0
 * @category models
 */
export const POS = Schema.Union(
  Schema.Literal("ADJ"), // adjective
  Schema.Literal("ADP"), // adposition
  Schema.Literal("ADV"), // adverb
  Schema.Literal("AUX"), // auxiliary
  Schema.Literal("CCONJ"), // coordinating conjunction
  Schema.Literal("DET"), // determiner
  Schema.Literal("INTJ"), // interjection
  Schema.Literal("NOUN"), // noun
  Schema.Literal("NUM"), // numeral
  Schema.Literal("PART"), // particle
  Schema.Literal("PRON"), // pronoun
  Schema.Literal("PROPN"), // proper noun
  Schema.Literal("PUNCT"), // punctuation
  Schema.Literal("SCONJ"), // subordinating conjunction
  Schema.Literal("SYM"), // symbol
  Schema.Literal("VERB"), // verb
  Schema.Literal("X"), // other
  Schema.Literal("SPACE") // space (wink-nlp specific)
).annotations({
  identifier: "POS",
  [POSTypeId]: POSTypeId,
});

/**
 * @category symbols
 */
export const SpanTypeId: unique symbol = Symbol.for("effect-nlp/Span");

/**
 * @since 1.0.0
 * @category models
 */
export const Span = Schema.Struct({
  [SpanTypeId]: Schema.UniqueSymbolFromSelf(SpanTypeId),
  start: Schema.Int,
  end: Schema.Int,
});

/**
 * @since 1.0.0
 * @category models
 */
export class CompromiseData extends Schema.Class<CompromiseData>(
  "CompromiseData"
)({
  // The original text from compromise
  text: Schema.String,

  // Normalized form
  normal: Schema.String,

  // Compromise tags
  tags: Schema.Array(Schema.String).pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => [])
  ),

  // Character offset information
  charStart: Schema.optional(Schema.Int).annotations({
    description: "Character position where term starts in original text",
  }),

  charEnd: Schema.optional(Schema.Int).annotations({
    description: "Character position where term ends in original text",
  }),

  // Term ID from compromise
  termId: Schema.optional(Schema.String),

  // Preceding and following text
  pre: Schema.String.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => "")
  ),

  post: Schema.String.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => "")
  ),

  // Phrase information
  isPartOfPhrase: Schema.Boolean.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => false)
  ),

  phraseText: Schema.optional(Schema.String),

  // Additional linguistic data from compromise
  lemma: Schema.optional(Schema.String).annotations({
    description: "Lemma form from compromise analysis",
  }),

  // Verb-specific information (if token is a verb)
  verbInfo: Schema.optional(Schema.Struct({
    tense: Schema.optional(Schema.String),
    conjugation: Schema.optional(Schema.String),
    isNegative: Schema.optional(Schema.Boolean),
    isPlural: Schema.optional(Schema.Boolean),
  })),

  // Noun-specific information (if token is a noun)
  nounInfo: Schema.optional(Schema.Struct({
    isPlural: Schema.optional(Schema.Boolean),
    isProper: Schema.optional(Schema.Boolean),
  })),
}) {}

/**
 * @since 1.0.0
 * @category models
 */
export class Sentence extends Schema.Class<Sentence>("Sentence")({
  [SentenceTypeId]: Schema.UniqueSymbolFromSelf(SentenceTypeId),
}) {}

/**
 * @since 1.0.0
 * @category models
 */
export class Token extends Schema.Class<Token>("Token")({
  // Token value/text
  value: Schema.String,

  // Position in document
  index: Schema.Int.annotations({
    description: "Zero-based index of token in document",
  }),

  // Part of speech tag
  pos: Schema.optional(POS),

  // Token type from wink-nlp
  type: Schema.optional(Schema.String).annotations({
    description: "Token type: word, punctuation, space, etc.",
  }),

  // Token shape pattern
  shape: Schema.optional(Schema.String).annotations({
    description: "Token shape: Xxxx, XXX, xxx, etc.",
  }),

  // Lemmatized form
  lemma: Schema.optional(Schema.String),

  // Stemmed form
  stem: Schema.optional(Schema.String),

  // Negation flag
  isNegated: Schema.Boolean.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => false)
  ),

  // Sentiment score
  sentiment: Schema.Number.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 0)
  ),

  // Normalized form (from compromise or lemma)
  normalized: Schema.String,

  // Compromise.js data (optional, only if token has compromise analysis)
  compromise: Schema.optional(CompromiseData),
}) {}

/**
 * @since 1.0.0
 * @category models
 */
export type POS = Schema.Schema.Type<typeof POS>;

// =============================================================================
// Constructors
// =============================================================================

/**
 * Create a Token from provided fields
 * @since 1.0.0
 * @category constructors
 */
export const makeToken = (fields: {
  value: string;
  index: number;
  pos?: POS;
  type?: string;
  shape?: string;
  lemma?: string;
  stem?: string;
  isNegated?: boolean;
  sentiment?: number;
  normalized: string;
  compromise: CompromiseData | undefined;
}): Token => new Token(fields);

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeCompromiseData = (fields: {
  text: string;
  normal: string;
  tags?: ReadonlyArray<string>;
  charStart?: number;
  charEnd?: number;
  termId?: string;
  pre?: string;
  post?: string;
  isPartOfPhrase?: boolean;
  phraseText?: string;
  lemma?: string;
  verbInfo?: {
    tense?: string;
    conjugation?: string;
    isNegative?: boolean;
    isPlural?: boolean;
  };
  nounInfo?: {
    isPlural?: boolean;
    isProper?: boolean;
  };
}): CompromiseData => new CompromiseData(fields);

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeSentence = (): Sentence =>
  new Sentence({
    [SentenceTypeId]: SentenceTypeId,
  });

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeSpan = (start: number, end: number) => ({
  [SpanTypeId]: SpanTypeId,
  start,
  end,
});

// =============================================================================
// Utilities
// =============================================================================

/**
 * @since 1.0.0
 * @category utilities
 */
export const isSentence = (u: unknown): u is Sentence =>
  typeof u === "object" && u !== null && SentenceTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isToken = (u: unknown): u is Token =>
  typeof u === "object" && u !== null && TokenTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isPOS = (u: unknown): u is POS =>
  typeof u === "string" &&
  [
    "ADJ",
    "ADP",
    "ADV",
    "AUX",
    "CCONJ",
    "DET",
    "INTJ",
    "NOUN",
    "NUM",
    "PART",
    "PRON",
    "PROPN",
    "PUNCT",
    "SCONJ",
    "SYM",
    "VERB",
    "X",
    "SPACE",
  ].includes(u);
