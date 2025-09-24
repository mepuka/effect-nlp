/**
 * Entity Store - KeyValueStore implementation for Entity management
 *
 * Provides a robust interface for storing and retrieving entities using
 * Effect Platform's KeyValueStore with schema validation.
 */

import { Data, Effect, Schema, pipe, Option, Console } from "effect";
import type { SchemaStore } from "@effect/platform/KeyValueStore";
import { KeyValueStore, layerMemory } from "@effect/platform/KeyValueStore";
import type { Entity } from "./Entity.js";
import { EntityHash, EntityId, SchemaId } from "./Entity.js";

// ============================================================================
// ENTITY STORE SCHEMA
// ============================================================================

/**
 * Entity store entry schema - stores serialized AST/JSON schema
 */
export const EntityStoreEntry = Schema.Struct({
  entityId: EntityId,
  schemaId: SchemaId,
  entityHash: Schema.Number,
  createdAt: Schema.DateTimeUtcFromDate,
  schemaJson: Schema.String, // Store the serialized schema as JSON
  schemaAst: Schema.Unknown, // Store the AST structure
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

class SchemaASTSerializationError extends Data.TaggedError(
  "SchemaASTSerializationError"
)<{
  readonly cause: unknown;
  readonly operation: string;
}> {}

/**
 * Entity Store service interface
 */
export interface EntityStore {
  readonly _tag: "EntityStore";

  // Core operations - using non-generic signatures for accessor compatibility
  readonly storeEntity: (
    entity: Entity<any>,
    schemaJson: string,
    schemaAst: unknown
  ) => Effect.Effect<
    void,
    SchemaSerializationError | SchemaASTSerializationError,
    never
  >;

  readonly retrieveEntity: (
    entityId: EntityId
  ) => Effect.Effect<
    Option.Option<{ schemaJson: string; schemaAst: unknown }>,
    SchemaSerializationError | SchemaASTSerializationError
  >;

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
  schema: Schema.Schema.Any
): Effect.Effect<string, SchemaSerializationError, never> =>
  Effect.try({
    try: () =>
      JSON.stringify({
        type: "schema",
        ast: schema.ast._tag,
        timestamp: new Date().toISOString(),
      }),
    catch: (cause) =>
      new SchemaSerializationError({
        cause,
        operation: "serializeSchema",
      }),
  });

/**
 * Serialize schema AST structure using Effect error handling
 */
const serializeSchemaAST = (
  schema: Schema.Schema.Any
): Effect.Effect<unknown, SchemaASTSerializationError, never> =>
  Effect.try({
    try: () => ({
      ast: schema.ast,
      astType: schema.ast._tag,
      propertySignatures:
        schema.ast._tag === "TypeLiteral"
          ? schema.ast.propertySignatures
          : undefined,
    }),
    catch: (cause) =>
      new SchemaASTSerializationError({
        cause,
        operation: "serializeSchemaAST",
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

      const store: EntityStore = {
        _tag: "EntityStore",

        storeEntity: (entity: Entity<any>) =>
          Effect.gen(function* () {
            const schemaJson = yield* serializeSchema(entity.schema);
            const schemaAst = yield* serializeSchemaAST(entity.schema);
            const entry = EntityStoreEntry.make({
              entityId: entity.entityId,
              schemaId: entity.schemaId,
              entityHash: EntityHash(entity),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              schemaJson,
              schemaAst,
            });
            const key = entityKey(entity.entityId);
            yield* entityStore.set(key, entry);
            yield* Console.log(`Stored entity schema: ${entity.entityId}`);
          }).pipe(
            Effect.mapError(
              (cause) =>
                new SchemaSerializationError({
                  cause,
                  operation: "storeEntity",
                })
            )
          ),

        retrieveEntity: (entityId: EntityId) =>
          Effect.gen(function* () {
            const key = entityKey(entityId);
            const entry = yield* entityStore.get(key);
            return pipe(
              entry,
              Option.map((e) => ({
                schemaJson: e.schemaJson,
                schemaAst: e.schemaAst,
              }))
            );
          }).pipe(
            Effect.mapError(
              (cause) =>
                new SchemaSerializationError({
                  cause,
                  operation: "retrieveEntity",
                })
            )
          ),

        removeEntity: (entityId: EntityId) =>
          Effect.gen(function* () {
            const key = entityKey(entityId);
            yield* entityStore.remove(key);
            yield* Console.log(`Removed entity: ${entityId}`);
          }).pipe(
            Effect.mapError(
              (cause) =>
                new SchemaSerializationError({
                  cause,
                  operation: "removeEntity",
                })
            )
          ),

        hasEntity: (entityId: EntityId) =>
          Effect.gen(function* () {
            const key = entityKey(entityId);
            return yield* entityStore.has(key);
          }).pipe(
            Effect.mapError(
              (cause) =>
                new SchemaSerializationError({ cause, operation: "hasEntity" })
            )
          ),

        clear: Effect.gen(function* () {
          yield* entityStore.clear;
          yield* Console.log("Cleared all entities");
        }).pipe(
          Effect.mapError(
            (cause) =>
              new SchemaSerializationError({ cause, operation: "clear" })
          )
        ),

        size: entityStore.size.pipe(
          Effect.mapError(
            (cause) =>
              new SchemaSerializationError({ cause, operation: "size" })
          )
        ),

        isEmpty: entityStore.isEmpty.pipe(
          Effect.mapError(
            (cause) =>
              new SchemaSerializationError({ cause, operation: "isEmpty" })
          )
        ),
      };

      return store;
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
export const storeEntity = <A extends Schema.Struct.Fields>(
  entity: Entity<A>
): Effect.Effect<
  void,
  SchemaSerializationError | SchemaASTSerializationError,
  EntityStoreService
> =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStoreService;
    const schemaJson = yield* serializeSchema(entity.schema);
    const schemaAst = yield* serializeSchemaAST(entity.schema);

    yield* entityStore.storeEntity(entity, schemaJson, schemaAst);
  });

/**
 * Retrieve entity by ID
 */
export const retrieveEntity = (entityId: EntityId) =>
  Effect.gen(function* () {
    const entityStore = yield* EntityStoreService;
    return yield* entityStore.retrieveEntity(entityId);
  });
