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
export const QueryTypeId: unique symbol = Symbol.for("effect-nlp/Query");

/**
 * @since 1.0.0
 * @category symbols
 */
export type QueryTypeId = typeof QueryTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const TermQueryTypeId: unique symbol = Symbol.for(
  "effect-nlp/TermQuery"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type TermQueryTypeId = typeof TermQueryTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const BooleanQueryTypeId: unique symbol = Symbol.for(
  "effect-nlp/BooleanQuery"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type BooleanQueryTypeId = typeof BooleanQueryTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const PhraseQueryTypeId: unique symbol = Symbol.for(
  "effect-nlp/PhraseQuery"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type PhraseQueryTypeId = typeof PhraseQueryTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const WildcardQueryTypeId: unique symbol = Symbol.for(
  "effect-nlp/WildcardQuery"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type WildcardQueryTypeId = typeof WildcardQueryTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const Query = Schema.Struct({
  [QueryTypeId]: Schema.UniqueSymbolFromSelf(QueryTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export const TermQuery = Schema.Struct({
  [TermQueryTypeId]: Schema.UniqueSymbolFromSelf(TermQueryTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type TermQuery = Schema.Schema.Type<typeof TermQuery>;

/**
 * @since 1.0.0
 * @category models
 */
export const BooleanQuery = Schema.Struct({
  [BooleanQueryTypeId]: Schema.UniqueSymbolFromSelf(BooleanQueryTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type BooleanQuery = Schema.Schema.Type<typeof BooleanQuery>;

/**
 * @since 1.0.0
 * @category models
 */
export const PhraseQuery = Schema.Struct({
  [PhraseQueryTypeId]: Schema.UniqueSymbolFromSelf(PhraseQueryTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type PhraseQuery = Schema.Schema.Type<typeof PhraseQuery>;

/**
 * @since 1.0.0
 * @category models
 */
export const WildcardQuery = Schema.Struct({
  [WildcardQueryTypeId]: Schema.UniqueSymbolFromSelf(WildcardQueryTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type WildcardQuery = Schema.Schema.Type<typeof WildcardQuery>;

/**
 * Boolean operators for query composition
 * @since 1.0.0
 * @category models
 */
export const BooleanOperator = Schema.Union(
  Schema.Literal("AND"),
  Schema.Literal("OR"),
  Schema.Literal("NOT")
);

/**
 * @since 1.0.0
 * @category models
 */
export type BooleanOperator = Schema.Schema.Type<typeof BooleanOperator>;

/**
 * Match pattern types for compromise-style matching
 * @since 1.0.0
 * @category models
 */
export const MatchPattern = Schema.Union(
  Schema.Literal("EXACT"), // exact text match
  Schema.Literal("TAG"), // POS tag match (#Noun)
  Schema.Literal("WILDCARD"), // . or * wildcards
  Schema.Literal("REGEX"), // /regex/ patterns
  Schema.Literal("FUZZY"), // ~ fuzzy matching
  Schema.Literal("OPTIONAL"), // ? optional matching
  Schema.Literal("NEGATIVE"), // ! negative matching
  Schema.Literal("CAPTURE"), // [] capture groups
  Schema.Literal("RANGE") // {min,max} range matching
);

/**
 * @since 1.0.0
 * @category models
 */
export type MatchPattern = Schema.Schema.Type<typeof MatchPattern>;

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
export const makeTermQuery = (): TermQuery => ({
  [TermQueryTypeId]: TermQueryTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeBooleanQuery = (): BooleanQuery => ({
  [BooleanQueryTypeId]: BooleanQueryTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makePhraseQuery = (): PhraseQuery => ({
  [PhraseQueryTypeId]: PhraseQueryTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeWildcardQuery = (): WildcardQuery => ({
  [WildcardQueryTypeId]: WildcardQueryTypeId,
});

// =============================================================================
// Utilities
// =============================================================================

/**
 * @since 1.0.0
 * @category utilities
 */
export const isQuery = (u: unknown): u is Schema.Schema.Type<typeof Query> =>
  typeof u === "object" && u !== null && QueryTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isTermQuery = (
  u: unknown
): u is Schema.Schema.Type<typeof TermQuery> =>
  typeof u === "object" && u !== null && TermQueryTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isBooleanQuery = (
  u: unknown
): u is Schema.Schema.Type<typeof BooleanQuery> =>
  typeof u === "object" && u !== null && BooleanQueryTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isPhraseQuery = (
  u: unknown
): u is Schema.Schema.Type<typeof PhraseQuery> =>
  typeof u === "object" && u !== null && PhraseQueryTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isWildcardQuery = (
  u: unknown
): u is Schema.Schema.Type<typeof WildcardQuery> =>
  typeof u === "object" && u !== null && WildcardQueryTypeId in u;
