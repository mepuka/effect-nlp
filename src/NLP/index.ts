/**
 * Effect-NLP: Production-ready NLP library built on Effect
 *
 * This module provides both a clean new API (v2.0) and legacy compatibility (v1.0)
 *
 * @since 1.0.0
 */

import * as DPModule from "./DocumentProcessor.js";

// =============================================================================
// New Clean API (v2.0) - Recommended for new projects
// =============================================================================

export * as Core from "./Core.js";
export * as DP from "./DocumentProcessor.js";
export * from "./DocumentProcessorLive.js";

// =============================================================================
// Legacy API (v1.0) - For backward compatibility
// =============================================================================

// Document types
export * from "./Document.js";

// Core NLP data types - excluding conflicting names
export {
  POSTypeId,
  SentenceTypeId,
  TokenTypeId,
  CompromiseDataTypeId,
  POS,
  CompromiseData,
  makeToken,
  makeCompromiseData,
  makeSentence,
  makeSpan,
  isSentence,
  isToken,
  isPOS,
} from "./Data.js";

// Legacy entity types
export * from "./Entity.js";

// Legacy analysis service
export * from "./AnalysisService.js";

// =============================================================================
// Quick Start API (v2.0) - Import the namespaces separately
// =============================================================================

/**
 * Quick process function for simple use cases
 * @since 2.0.0
 */
export const process = DPModule.process;

/**
 * Quick entity extraction for simple use cases
 * @since 2.0.0
 */
export const extractEntities = DPModule.extractEntities;

/**
 * Quick tokenization for simple use cases
 * @since 2.0.0
 */
export const tokenize = DPModule.tokenize;

/**
 * Convenience functions for common entity types
 * @since 2.0.0
 */
export const extractPersons = DPModule.extractPersons;
export const extractOrganizations = DPModule.extractOrganizations;
export const extractLocations = DPModule.extractLocations;

/**
 * Complete text analysis with document and stats
 * @since 2.0.0
 */
export const analyzeText = DPModule.analyzeText;
