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
export const EntityTypeId: unique symbol = Symbol.for("effect-nlp/Entity");

/**
 * @since 1.0.0
 * @category symbols
 */
export type EntityTypeId = typeof EntityTypeId;

/**
 * @since 1.0.0
 * @category symbols
 */
export const EntityPatternTypeId: unique symbol = Symbol.for(
  "effect-nlp/EntityPattern"
);

/**
 * @since 1.0.0
 * @category symbols
 */
export type EntityPatternTypeId = typeof EntityPatternTypeId;

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const Entity = Schema.Struct({
  [EntityTypeId]: Schema.UniqueSymbolFromSelf(EntityTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type Entity = Schema.Schema.Type<typeof Entity>;

/**
 * @since 1.0.0
 * @category models
 */
export const EntityPattern = Schema.Struct({
  [EntityPatternTypeId]: Schema.UniqueSymbolFromSelf(EntityPatternTypeId),
});

/**
 * @since 1.0.0
 * @category models
 */
export type EntityPattern = Schema.Schema.Type<typeof EntityPattern>;

// =============================================================================
// Constructors
// =============================================================================

/**
 * @since 1.0.0
 * @category constructors
 */
export const make = (): Entity => ({
  [EntityTypeId]: EntityTypeId,
});

/**
 * @since 1.0.0
 * @category constructors
 */

/**
 * @since 1.0.0
 * @category constructors
 */
export const makePattern = (): EntityPattern => ({
  [EntityPatternTypeId]: EntityPatternTypeId,
});

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
export const isEntity = (u: unknown): u is Entity =>
  typeof u === "object" && u !== null && EntityTypeId in u;

/**
 * @since 1.0.0
 * @category utilities
 */
export const isEntityPattern = (u: unknown): u is EntityPattern =>
  typeof u === "object" && u !== null && EntityPatternTypeId in u;
