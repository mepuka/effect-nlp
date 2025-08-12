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
export const IndexTypeId: unique symbol = Symbol.for("effect-nlp/Index");

/**
 * @since 1.0.0
 * @category symbols
 */
export type IndexTypeId = typeof IndexTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const VectorSpaceTypeId: unique symbol = Symbol.for(
  "effect-nlp/VectorSpace"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type VectorSpaceTypeId = typeof VectorSpaceTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const CorpusTypeId: unique symbol = Symbol.for("effect-nlp/Corpus");

/**
 * @since 1.0.0
 * @category symbols
 */
export type CorpusTypeId = typeof CorpusTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const Index = Schema.Struct({
  [IndexTypeId]: Schema.UniqueSymbolFromSelf(IndexTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Index = Schema.Schema.Type<typeof Index>;

/**
 * @since 1.0.0
 * @category models
 */
export const VectorSpace = Schema.Struct({
  [VectorSpaceTypeId]: Schema.UniqueSymbolFromSelf(VectorSpaceTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type VectorSpace = Schema.Schema.Type<typeof VectorSpace>;

/**
 * @since 1.0.0
 * @category models
 */
export const Corpus = Schema.Struct({
  [CorpusTypeId]: Schema.UniqueSymbolFromSelf(CorpusTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Corpus = Schema.Schema.Type<typeof Corpus>;

/**
 * Index types for information retrieval
 * @since 1.0.0
 * @category models
 */
export const IndexType = Schema.Union(
  Schema.Literal("INVERTED"), // inverted index
  Schema.Literal("POSITIONAL"), // positional index
  Schema.Literal("COMPRESSED"), // compressed index
  Schema.Literal("DISTRIBUTED"), // distributed index
  Schema.Literal("REALTIME") // real-time index
);

/**
 * @since 1.0.0
 * @category models
 */
export type IndexType = Schema.Schema.Type<typeof IndexType>;

/**
 * Vector space model types
 * @since 1.0.0
 * @category models
 */
export const VectorModel = Schema.Union(
  Schema.Literal("TF_IDF"), // term frequency-inverse document frequency
  Schema.Literal("BOW"), // bag of words
  Schema.Literal("WORD2VEC"), // word embeddings
  Schema.Literal("GLOVE"), // global vectors
  Schema.Literal("BERT"), // bidirectional encoder representations
  Schema.Literal("LSA"), // latent semantic analysis
  Schema.Literal("LDA") // latent dirichlet allocation
);

/**
 * @since 1.0.0
 * @category models
 */
export type VectorModel = Schema.Schema.Type<typeof VectorModel>;

/**
 * Classification algorithms
 * @since 1.0.0
 * @category models
 */
export const ClassificationAlgorithm = Schema.Union(
  Schema.Literal("NAIVE_BAYES"), // naive bayes
  Schema.Literal("SVM"), // support vector machines
  Schema.Literal("KNN"), // k-nearest neighbors
  Schema.Literal("DECISION_TREE"), // decision trees
  Schema.Literal("RANDOM_FOREST"), // random forest
  Schema.Literal("NEURAL_NETWORK"), // neural networks
  Schema.Literal("LOGISTIC_REGRESSION") // logistic regression
);

/**
 * @since 1.0.0
 * @category models
 */
export type ClassificationAlgorithm = Schema.Schema.Type<
  typeof ClassificationAlgorithm
>;

// =============================================================================
// Constructors
// =============================================================================

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeIndex = (): Index => ({
  [IndexTypeId]: IndexTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeVectorSpace = (): VectorSpace => ({
  [VectorSpaceTypeId]: VectorSpaceTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */
export const makeCorpus = (): Corpus => ({
  [CorpusTypeId]: CorpusTypeId,
});

// =============================================================================
// Utilities
// =============================================================================

/**
 * @since 1.0.0
 * @category utilities
 */
export const isIndex = (u: unknown): u is Schema.Schema.Type<typeof Index> =>
  typeof u === "object" && u !== null && IndexTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isVectorSpace = (
  u: unknown
): u is Schema.Schema.Type<typeof VectorSpace> =>
  typeof u === "object" && u !== null && VectorSpaceTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isCorpus = (u: unknown): u is Schema.Schema.Type<typeof Corpus> =>
  typeof u === "object" && u !== null && CorpusTypeId in u;
