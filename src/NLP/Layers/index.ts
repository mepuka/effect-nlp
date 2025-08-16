/**
 * NLP Layer Architecture
 * Hierarchical composition of NLP services following Effect patterns
 * @since 3.0.0
 */

import { Layer } from "effect";
import {
  WinkEngine,
  WinkEngineLive,
  WinkEngineTest,
} from "../Wink/WinkEngine.js";
import {
  WinkTokenizer,
  WinkTokenizerLive,
  WinkTokenizerTest,
} from "../Wink/WinkTokenizer.js";

/**
 * Base infrastructure layer - core engines and utilities
 * This layer provides the fundamental NLP engine
 */
export const NLPBaseLive = WinkEngineLive;

/**
 * Tokenization module layer
 * Depends on the base engine layer
 */
export const TokenizationModuleLive = WinkTokenizerLive;

export const NLPAppLive = Layer.merge(NLPBaseLive, TokenizationModuleLive);

/**
 * Convenience exports for direct service access
 */
export {
  WinkEngine,
  WinkEngineLive,
  WinkEngineTest,
  WinkTokenizer,
  WinkTokenizerLive,
  WinkTokenizerTest,
};
