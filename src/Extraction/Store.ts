/**
 * Entity Store - KeyValueStore implementation for Entity management
 *
 * Provides a robust interface for storing and retrieving entities using
 * Effect Platform's KeyValueStore with schema validation.
 */

import { Data, Effect, Schema, Option, Console, DateTime } from "effect";
import type { SchemaStore } from "@effect/platform/KeyValueStore";
import { KeyValueStore, layerMemory } from "@effect/platform/KeyValueStore";
import type { Entity } from "./Entity.js";
import {
  EntityHash,
  EntityId,
  SchemaId,
  getEntityId,
  getSchemaId,
} from "./Entity.js";
import { Annotations } from "./Annotations.js";
import type { Provenance } from "./Provenance.js";
import { ProvenanceHistory } from "./Provenance.js";

// ============================================================================
// ENTITY STORE SCHEMA
// ============================================================================

/**
 * Canonical schema representation stored with entity metadata.
 */
const SchemaAnnotations = Schema.Struct({
  core: Schema.optional(Annotations.Core),
  role: Schema.optional(Annotations.Role),
  semantic: Schema.optional(Annotations.Semantic),
  provenance: Schema.optional(Annotations.Provenance),
});

const SchemaSpec = Schema.Struct({
  version: Schema.Literal(1),
  rootTag: Schema.String,
  properties: Schema.Array(
    Schema.Struct({
      path: Schema.Array(Schema.String),
      type: Schema.String,
      optional: Schema.Boolean,
      isReadonly: Schema.Boolean,
    })
  ),
});

export const StoredSchema = Schema.Struct({
  schemaId: SchemaId,
  hash: Schema.Number,
  format: Schema.Literal("effect.schema/ast@v1"),
  annotations: SchemaAnnotations,
  spec: SchemaSpec,
});
export type StoredSchema = Schema.Schema.Type<typeof StoredSchema>;

const EntityValueSnapshot = Schema.Struct({
  json: Schema.String,
  recordedAt: Schema.DateTimeUtcFromDate,
});
type EntityValueSnapshot = Schema.Schema.Type<typeof EntityValueSnapshot>;
type StoredProvenance = Schema.Schema.Type<typeof Provenance>;

/**
 * Entity store entry schema - stores canonical schema representation and provenance.
 */
export const EntityStoreEntry = Schema.Struct({
  entityId: EntityId,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
  schema: StoredSchema,
  valueSnapshot: Schema.optional(EntityValueSnapshot),
  provenance: ProvenanceHistory,
});

export type EntityStoreEntry = Schema.Schema.Type<typeof EntityStoreEntry>;

// ============================================================================
// ENTITY STORE SERVICE
// ============================================================================

// Define tagged errors for serialization failures
class SchemaSerializationError extends Data.TaggedError(
  "SchemaSerializationError"
)<{
  readonly cause: unknown;
  readonly operation: string;
}> {}

/**
 * Entity Store service interface
 */
export interface StoreEntityOptions {
  readonly value?: unknown;
  readonly recordedAt?: Date;
  readonly provenance?: ReadonlyArray<StoredProvenance>;
}

export interface EntityStore {
  readonly _tag: "EntityStore";

  // Core operations - using non-generic signatures for accessor compatibility
  readonly storeEntity: (
    entity: Entity<any, any, unknown>,
    options?: StoreEntityOptions
  ) => Effect.Effect<void, SchemaSerializationError, never>;

  readonly retrieveEntity: (
    entityId: EntityId
  ) => Effect.Effect<Option.Option<EntityStoreEntry>, SchemaSerializationError>;

  readonly removeEntity: (
    entityId: EntityId
  ) => Effect.Effect<void, SchemaSerializationError>;

  readonly hasEntity: (
    entityId: EntityId
  ) => Effect.Effect<boolean, SchemaSerializationError>;

  // Utility operations
  readonly clear: Effect.Effect<void, SchemaSerializationError>;
  readonly size: Effect.Effect<number, SchemaSerializationError>;
  readonly isEmpty: Effect.Effect<boolean, SchemaSerializationError>;
}

// ============================================================================
// ENTITY STORE SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Generate key for entity storage
 */
const entityKey = (entityId: EntityId): string => `entity#${entityId}`;

/**
 * Serialize schema definition for storage using Effect error handling
 */
const serializeSchema = (
  entity: Entity<any, any, unknown>
): Effect.Effect<StoredSchema, SchemaSerializationError, never> =>
  Effect.try({
    try: () => {
      const ast = entity.ast;
      const annotations = ast.annotations ?? {};
      const context = Annotations.getContext(annotations);

      const properties: Array<{
        readonly path: ReadonlyArray<string>;
        readonly type: string;
        readonly optional: boolean;
        readonly isReadonly: boolean;
      }> = [];

      if (ast._tag === "TypeLiteral") {
        for (const signature of ast.propertySignatures) {
          properties.push({
            path: [String(signature.name)],
            type: String(signature.type._tag),
            optional: signature.isOptional,
            isReadonly: signature.isReadonly,
          });
        }
      }

      return StoredSchema.make({
        schemaId: getSchemaId(entity),
        hash: EntityHash(entity),
        format: "effect.schema/ast@v1",
        annotations: {
          core: Option.isSome(context.core) ? context.core.value : undefined,
          role: Option.isSome(context.role) ? context.role.value : undefined,
          semantic: Option.isSome(context.semantic)
            ? context.semantic.value
            : undefined,
          provenance: Option.isSome(context.provenance)
            ? context.provenance.value
            : undefined,
        },
        spec: {
          version: 1,
          rootTag: ast._tag,
          properties,
        },
      });
    },
    catch: (cause) =>
      new SchemaSerializationError({
        cause,
        operation: "serializeSchema",
      }),
  });

/**
 * Entity Store service using Effect.Service
 */
export class EntityStoreService extends Effect.Service<EntityStoreService>()(
  "EntityStore",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const kv = yield* KeyValueStore;

      // Create schema store for entity entries with proper typing
      const entityStore: SchemaStore<EntityStoreEntry, never> =
        kv.forSchema(EntityStoreEntry);

      const storeEntity = (
        entity: Entity<any, any, unknown>,
        options?: StoreEntityOptions
      ) =>
        Effect.gen(function* () {
          const storedSchema = yield* serializeSchema(entity);
          const entityId = getEntityId(entity);
          const now = DateTime.unsafeFromDate(new Date());
          const valueSnapshot =
            options?.value === undefined
              ? undefined
              : yield* Effect.try({
                  try: () =>
                    EntityValueSnapshot.make({
                      json: JSON.stringify(options.value),
                      recordedAt: DateTime.unsafeFromDate(
                        options.recordedAt ?? new Date()
                      ),
                    }),
                  catch: (cause) =>
                    new SchemaSerializationError({
                      cause,
                      operation: "serializeValueSnapshot",
                    }),
                });

          const entry = EntityStoreEntry.make({
            entityId,
            createdAt: now,
            updatedAt: now,
            schema: storedSchema,
            valueSnapshot,
            provenance: options?.provenance ?? [],
          });
          const key = entityKey(entityId);
          yield* entityStore.set(key, entry);
          yield* Console.log(`Stored entity schema: ${entityId}`);
        });

      const retrieveEntity = (entityId: EntityId) =>
        Effect.gen(function* () {
          const key = entityKey(entityId);
          return yield* entityStore.get(key);
        });

      const removeEntity = (entityId: EntityId) =>
        Effect.gen(function* () {
          const key = entityKey(entityId);
          yield* entityStore.remove(key);
          yield* Console.log(`Removed entity: ${entityId}`);
        });

      const hasEntity = (entityId: EntityId) =>
        Effect.gen(function* () {
          const key = entityKey(entityId);
          return yield* entityStore.has(key);
        });

      const clear = Effect.gen(function* () {
        yield* entityStore.clear;
        yield* Console.log("Cleared all entities");
      });

      const size = entityStore.size;

      const isEmpty = entityStore.isEmpty;

      return {
        storeEntity,
        retrieveEntity,
        removeEntity,
        hasEntity,
        clear,
        size,
        isEmpty,
      } as const;
    }),
    dependencies: [layerMemory],
  }
) {}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Store an entity with automatic serialization
 */
export const storeEntity = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never,
>(
  entity: Entity<A, I, R>,
  options?: StoreEntityOptions
): Effect.Effect<void, SchemaSerializationError, EntityStoreService> =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStoreService;
    yield* entityStore.storeEntity(entity, options);
  }).pipe(
    Effect.mapError(
      (cause) =>
        new SchemaSerializationError({
          cause,
          operation: "storeEntity",
        })
    )
  );

/**
 * Retrieve entity by ID
 */
export const retrieveEntity = (entityId: EntityId) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStoreService;
    return yield* entityStore.retrieveEntity(entityId);
  });
