/**
 * Wink Services Layer
 * Complete layer composition for all Wink NLP services
 * @since 3.0.0
 */

import { Layer } from "effect";
import { WinkEngine, WinkEngineLive, WinkEngineTest } from "./WinkEngine.js";
import {
  WinkTokenizer,
  WinkTokenizerLive,
  WinkTokenizerTest,
} from "./WinkTokenizer.js";
import { WinkVectorizer, WinkVectorizerLive } from "./WinkVectorizer.js";
import { WinkSimilarity, WinkSimilarityLive } from "./WinkSimilarity.js";
import { WinkUtils, WinkUtilsLive } from "./WinkUtils.js";

/**
 * Complete Wink services layer for production
 * Includes all Wink services with proper dependency resolution
 */
export const WinkLayerLive = Layer.mergeAll(
  WinkEngineLive,
  WinkTokenizerLive,
  WinkVectorizerLive(),
  WinkSimilarityLive,
  WinkUtilsLive
);

/**
 * Complete Wink services layer for testing
 * Uses mock implementations for all services
 */
export const WinkLayerTest = Layer.mergeAll(
  WinkEngineTest,
  WinkTokenizerTest,
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
  WinkVectorizerLive(),
  WinkSimilarityLive
).pipe(Layer.provide(WinkEngine.Default));

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
  WinkEngineLive,
  WinkEngineTest,
  WinkTokenizer,
  WinkTokenizerLive,
  WinkTokenizerTest,
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
