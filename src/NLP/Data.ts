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
export const POSTypeId: unique symbol = Symbol.for("effect-nlp/POS");

/**
 * @since 1.0.0
 * @category symbols
 */
export type POSTypeId = typeof POSTypeId;

// =============================================================================
// Models
// =============================================================================

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
export class Sentence extends Schema.Class<Sentence>("Sentence")({
  [SentenceTypeId]: Schema.UniqueSymbolFromSelf(SentenceTypeId),
}) {}

/**
 * @since 1.0.0
 * @category models
 */
export class Token extends Schema.Class<Token>("Token")({
  [TokenTypeId]: Schema.UniqueSymbolFromSelf(TokenTypeId),
}) {}

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
 * @since 1.0.0
 * @category models
 */
export type POS = Schema.Schema.Type<typeof POS>;

// =============================================================================
// Constructors
// =============================================================================

/**
 * @since 1.0.0
 * @category constructors
 */

/**
 * @since 1.0.0
 * @category constructors
 */

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
