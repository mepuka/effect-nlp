import { Schema } from "effect";

// =============================================================================
// Symbols
// =============================================================================

/**
 * @since 1.0.0
 * @category symbols
 */
export const MorphologyTypeId: unique symbol = Symbol.for(
  "effect-nlp/Morphology"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type MorphologyTypeId = typeof MorphologyTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const SyntaxTypeId: unique symbol = Symbol.for("effect-nlp/Syntax");

/**
 * @since 1.0.0
 * @category symbols
 */
export type SyntaxTypeId = typeof SyntaxTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const SemanticsTypeId: unique symbol = Symbol.for(
  "effect-nlp/Semantics"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type SemanticsTypeId = typeof SemanticsTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const LemmaTypeId: unique symbol = Symbol.for("effect-nlp/Lemma");

/**
 * @since 1.0.0
 * @category symbols
 */
export type LemmaTypeId = typeof LemmaTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const StemTypeId: unique symbol = Symbol.for("effect-nlp/Stem");

/**
 * @since 1.0.0
 * @category symbols
 */
export type StemTypeId = typeof StemTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const Morphology = Schema.Struct({
  [MorphologyTypeId]: Schema.UniqueSymbolFromSelf(MorphologyTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Morphology = Schema.Schema.Type<typeof Morphology>;

/**
 * @since 1.0.0
 * @category models
 */
export const Syntax = Schema.Struct({
  [SyntaxTypeId]: Schema.UniqueSymbolFromSelf(SyntaxTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Syntax = Schema.Schema.Type<typeof Syntax>;

/**
 * @since 1.0.0
 * @category models
 */
export const Semantics = Schema.Struct({
  [SemanticsTypeId]: Schema.UniqueSymbolFromSelf(SemanticsTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Semantics = Schema.Schema.Type<typeof Semantics>;

/**
 * @since 1.0.0
 * @category models
 */
export const Lemma = Schema.Struct({
  [LemmaTypeId]: Schema.UniqueSymbolFromSelf(LemmaTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Lemma = Schema.Schema.Type<typeof Lemma>;

/**
 * @since 1.0.0
 * @category models
 */
export const Stem = Schema.Struct({
  [StemTypeId]: Schema.UniqueSymbolFromSelf(StemTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Stem = Schema.Schema.Type<typeof Stem>;

/**
 * Grammatical features based on Universal Features
 * @since 1.0.0
 * @category models
 */
export const GrammaticalFeature = Schema.Union(
  // Case
  Schema.Literal("Nom"), // nominative
  Schema.Literal("Acc"), // accusative
  Schema.Literal("Gen"), // genitive
  Schema.Literal("Dat"), // dative
  // Number
  Schema.Literal("Sing"), // singular
  Schema.Literal("Plur"), // plural
  // Tense
  Schema.Literal("Past"), // past
  Schema.Literal("Pres"), // present
  Schema.Literal("Fut"), // future
  // Person
  Schema.Literal("1"), // first person
  Schema.Literal("2"), // second person
  Schema.Literal("3"), // third person
  // Gender
  Schema.Literal("Masc"), // masculine
  Schema.Literal("Fem"), // feminine
  Schema.Literal("Neut") // neuter
);

/**
 * @since 1.0.0
 * @category models
 */
export type GrammaticalFeature = Schema.Schema.Type<typeof GrammaticalFeature>;

/**
 * Dependency relation types
 * @since 1.0.0
 * @category models
 */
export const DependencyRelation = Schema.Union(
  Schema.Literal("nsubj"), // nominal subject
  Schema.Literal("obj"), // direct object
  Schema.Literal("iobj"), // indirect object
  Schema.Literal("amod"), // adjectival modifier
  Schema.Literal("advmod"), // adverbial modifier
  Schema.Literal("det"), // determiner
  Schema.Literal("prep"), // preposition
  Schema.Literal("conj"), // conjunct
  Schema.Literal("cc"), // coordinating conjunction
  Schema.Literal("root"), // root
  Schema.Literal("compound"), // compound
  Schema.Literal("aux"), // auxiliary
  Schema.Literal("cop") // copula
);

/**
 * @since 1.0.0
 * @category models
 */
export type DependencyRelation = Schema.Schema.Type<typeof DependencyRelation>;

/**
 * Semantic roles based on PropBank/VerbNet
 * @since 1.0.0
 * @category models
 */
export const SemanticRole = Schema.Union(
  Schema.Literal("ARG0"), // agent
  Schema.Literal("ARG1"), // patient/theme
  Schema.Literal("ARG2"), // recipient/goal
  Schema.Literal("ARG3"), // start point/benefactive
  Schema.Literal("ARG4"), // end point
  Schema.Literal("ARGM-TMP"), // temporal
  Schema.Literal("ARGM-LOC"), // location
  Schema.Literal("ARGM-MNR"), // manner
  Schema.Literal("ARGM-CAU"), // cause
  Schema.Literal("ARGM-PRP") // purpose
);

/**
 * @since 1.0.0
 * @category models
 */
export type SemanticRole = Schema.Schema.Type<typeof SemanticRole>;

// =============================================================================
// Constructors
// =============================================================================

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeMorphology = (): Morphology => ({
  [MorphologyTypeId]: MorphologyTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeSyntax = (): Syntax => ({
  [SyntaxTypeId]: SyntaxTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeSemantics = (): Semantics => ({
  [SemanticsTypeId]: SemanticsTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeLemma = (): Lemma => ({
  [LemmaTypeId]: LemmaTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeStem = (): Stem => ({
  [StemTypeId]: StemTypeId,
});

// =============================================================================
// Utilities
// =============================================================================

/**
 * @since 1.0.0
 * @category utilities
 */
export const isMorphology = (
  u: unknown
): u is Schema.Schema.Type<typeof Morphology> =>
  typeof u === "object" && u !== null && MorphologyTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isSyntax = (u: unknown): u is Schema.Schema.Type<typeof Syntax> =>
  typeof u === "object" && u !== null && SyntaxTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isSemantics = (
  u: unknown
): u is Schema.Schema.Type<typeof Semantics> =>
  typeof u === "object" && u !== null && SemanticsTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isLemma = (u: unknown): u is Schema.Schema.Type<typeof Lemma> =>
  typeof u === "object" && u !== null && LemmaTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isStem = (u: unknown): u is Schema.Schema.Type<typeof Stem> =>
  typeof u === "object" && u !== null && StemTypeId in u;
