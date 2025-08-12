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
export const DocumentTypeId: unique symbol = Symbol.for("effect-nlp/Document");

/**
 * @since 1.0.0
 * @category symbols
 */
export type DocumentTypeId = typeof DocumentTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export class Document extends Schema.Class<Document>("Document")({
  [DocumentTypeId]: Schema.UniqueSymbolFromSelf(DocumentTypeId),
}) {}

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
export const isDocument = (
  u: unknown
): u is Schema.Schema.Type<typeof Document> =>
  typeof u === "object" && u !== null && DocumentTypeId in u;
