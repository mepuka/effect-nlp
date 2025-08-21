/**
 * Wink Services Layer
 * Complete layer composition for all Wink NLP services
 * @since 3.0.0
 */

import { Layer } from "effect";
import { WinkEngine } from "./WinkEngine.js";
import { WinkEngineRefLive } from "./WinkEngineRef.js";
import { WinkTokenizer, WinkTokenizerLive } from "./WinkTokenizer.js";
import { WinkVectorizer, WinkVectorizerLive } from "./WinkVectorizer.js";
import { WinkSimilarity, WinkSimilarityLive } from "./WinkSimilarity.js";
import { WinkUtils, WinkUtilsLive } from "./WinkUtils.js";

/**
 * Live layer for WinkEngine, providing the WinkPatternService
 */
export const WinkEngineLive = Layer.provide(
  WinkEngine.Default,
  Layer.mergeAll(WinkEngineRefLive, WinkUtilsLive)
);

/**
 * Complete Wink services layer for production
 * Includes all Wink services with proper dependency resolution
 */
export const WinkLayerLive = Layer.mergeAll(
  WinkTokenizerLive,
  WinkVectorizerLive,
  WinkSimilarityLive,
  WinkUtilsLive
).pipe(
  Layer.provideMerge(Layer.provide(WinkEngine.Default, WinkEngineRefLive))
);

/**
 * Complete Wink services layer for testing
 * Uses mock implementations for all services
 */
export const WinkLayerTest = Layer.mergeAll(
  WinkUtilsLive // Utils can use live implementation in tests
);

/**
 * Base engine and utilities layer
 * Provides fundamental services that other Wink services depend on
 */
export const WinkBaseLive = Layer.mergeAll(WinkEngineLive, WinkUtilsLive);

/**
 * Tokenization layer
 * Provides tokenization services (depends on base layer)
 */
export const WinkTokenizationLive = Layer.mergeAll(
  WinkBaseLive,
  WinkTokenizerLive
);

/**
 * Vectorization layer
 * Provides vectorization and similarity services (depends on base layer)
 */
export const WinkVectorizationLive = Layer.mergeAll(
  WinkBaseLive,
  WinkVectorizerLive,
  WinkSimilarityLive
).pipe(Layer.provide(Layer.provide(WinkEngine.Default, WinkEngineRefLive)));

/**
 *NLP processing layer
 * Combines tokenization and vectorization capabilities
 */
export const WinkNLPLive = Layer.mergeAll(
  WinkTokenizationLive,
  WinkVectorizationLive
);

/**
 * Convenience exports for individual services
 */
export {
  WinkEngine,
  WinkTokenizer,
  WinkTokenizerLive,
  WinkVectorizer,
  WinkVectorizerLive,
  WinkSimilarity,
  WinkSimilarityLive,
  WinkUtils,
  WinkUtilsLive,
};

/**
 * Default export for most common use case
 */
export default WinkLayerLive;
