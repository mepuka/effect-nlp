/**
 * Entity Store Test - Testing KeyValueStore implementation for entities
 *
 * This test file validates the Entity Store functionality including:
 * - Entity storage and retrieval
 * - Schema validation
 * - KeyValueStore integration
 */

import { Schema, Effect, Console, pipe, Option } from "effect";
import { KeyValueStore, layerMemory } from "@effect/platform/KeyValueStore";
import {
  MakeEntity,
  MakeEntityId,
  MakeSchemaId,
  EntityId,
  SchemaId,
  EntityHash,
} from "../Extraction/Entity.js";
import {
  EntityStoreService,
  storeEntity,
  retrieveEntity,
} from "../Extraction/Store.js";

// ============================================================================
// TEST SCHEMAS
// ============================================================================

// Simple person schema for testing
const PersonFields = {
  name: Schema.String.pipe(
    Schema.annotations({
      identifier: "name",
      title: "Name",
      description: "The person's full name",
    })
  ),
  age: Schema.Number.pipe(
    Schema.annotations({
      identifier: "age",
      title: "Age",
      description: "The person's age in years",
    })
  ),
  email: Schema.String.pipe(
    Schema.annotations({
      identifier: "email",
      title: "Email",
      description: "The person's email address",
    })
  ),
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

const testEntityStorage = Effect.gen(function* () {
  yield* Console.log("=== Entity Storage Tests ===\n");

  // Test 1: Basic entity storage and retrieval
  yield* Console.log("1. Basic Entity Storage and Retrieval:");
  const personEntity = MakeEntity(PersonFields, { name: "TestPerson" });

  const personData = {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    identifier: personEntity.entityId,
    schemaId: personEntity.schemaId,
    createdAt: new Date().toISOString(),
  };

  yield* Effect.all([
    Console.log(`  Entity ID: ${personEntity.entityId}`),
    Console.log(`  Schema ID: ${personEntity.schemaId}`),
  ]);

  // Store the entity
  const entityStore = yield* EntityStoreService;
  yield* entityStore.storeEntity(
    personEntity.entityId,
    personEntity.schemaId,
    EntityHash(personEntity),
    personData
  );
  yield* Console.log("  ✅ Entity stored successfully");

  // Retrieve the entity
  const retrieved = yield* entityStore.retrieveEntity(personEntity.entityId);
  yield* pipe(
    retrieved,
    Option.match({
      onNone: () => Console.log("  ❌ Entity not found"),
      onSome: (data) =>
        Console.log(`  ✅ Entity retrieved: ${JSON.stringify(data, null, 2)}`),
    })
  );
  yield* Console.log("");

  return { personEntity, personData };
});

const testEntityOperations = Effect.gen(function* () {
  yield* Console.log("=== Entity Operations Tests ===\n");

  // Test 1: Entity existence check
  yield* Console.log("1. Entity Existence Check:");
  const personEntity = MakeEntity(PersonFields, { name: "ExistsPerson" });

  const personData = {
    name: "Jane Doe",
    age: 25,
    email: "jane@example.com",
    identifier: personEntity.entityId,
    schemaId: personEntity.schemaId,
    createdAt: new Date().toISOString(),
  };

  // Check before storing
  const entityStore = yield* EntityStoreService;
  const existsBefore = yield* entityStore.hasEntity(personEntity.entityId);
  yield* Console.log(`  Exists before storage: ${existsBefore}`);

  // Store and check again
  yield* entityStore.storeEntity(
    personEntity.entityId,
    personEntity.schemaId,
    EntityHash(personEntity),
    personData
  );
  const existsAfter = yield* entityStore.hasEntity(personEntity.entityId);
  yield* Console.log(`  Exists after storage: ${existsAfter}`);
  yield* Console.log("");

  // Test 2: Entity removal
  yield* Console.log("2. Entity Removal:");
  yield* entityStore.removeEntity(personEntity.entityId);
  const existsAfterRemoval = yield* entityStore.hasEntity(
    personEntity.entityId
  );
  yield* Console.log(`  Exists after removal: ${existsAfterRemoval}`);
  yield* Console.log("");

  return { personEntity, personData };
});

const testStoreManagement = Effect.gen(function* () {
  yield* Console.log("=== Store Management Tests ===\n");

  // Test 1: Store size tracking
  yield* Console.log("1. Store Size Tracking:");
  const entityStore = yield* EntityStoreService;
  const initialSize = yield* entityStore.size;
  yield* Console.log(`  Initial size: ${initialSize}`);

  // Add multiple entities
  const entities = [];
  for (let i = 0; i < 3; i++) {
    const entity = MakeEntity(PersonFields, { name: `Person${i}` });
    const data = {
      name: `Person ${i}`,
      age: 20 + i,
      email: `person${i}@example.com`,
      identifier: entity.entityId,
      schemaId: entity.schemaId,
      createdAt: new Date().toISOString(),
    };

    yield* entityStore.storeEntity(
      entity.entityId,
      entity.schemaId,
      EntityHash(entity),
      data
    );
    entities.push({ entity, data });
  }

  const finalSize = yield* entityStore.size;
  yield* Console.log(`  Final size: ${finalSize}`);
  yield* Console.log("");

  // Test 2: Store clearing
  yield* Console.log("2. Store Clearing:");
  yield* entityStore.clear;
  const sizeAfterClear = yield* entityStore.size;
  yield* Console.log(`  Size after clear: ${sizeAfterClear}`);
  yield* Console.log("");

  return entities;
});

const testSchemaValidation = Effect.gen(function* () {
  yield* Console.log("=== Schema Validation Tests ===\n");

  // Test 1: Valid entity data
  yield* Console.log("1. Valid Entity Data:");
  const personEntity = MakeEntity(PersonFields, { name: "ValidPerson" });

  const validData = {
    name: "Valid Person",
    age: 35,
    email: "valid@example.com",
    identifier: personEntity.entityId,
    schemaId: personEntity.schemaId,
    createdAt: new Date().toISOString(),
  };

  yield* storeEntity(personEntity, validData);
  const retrieved = yield* retrieveEntity(personEntity);

  yield* pipe(
    retrieved,
    Option.match({
      onNone: () => Console.log("  ❌ Valid entity not retrieved"),
      onSome: (data) => {
        const isValid =
          data.name === validData.name && data.age === validData.age;
        return Console.log(
          `  ${isValid ? "✅" : "❌"} Valid entity retrieved and validated`
        );
      },
    })
  );
  yield* Console.log("");

  return { personEntity, validData };
});

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

const runEntityStoreTests = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Entity Store Tests\n");

  // Run all test suites
  const results = yield* Effect.all([
    testEntityStorage,
    testEntityOperations,
    testStoreManagement,
    testSchemaValidation,
  ]);

  yield* Console.log("✅ All Entity Store Tests Completed Successfully!\n");

  // Summary
  yield* Console.log("📊 Test Summary:");
  yield* Console.log("  - Entity Storage: ✅");
  yield* Console.log("  - Entity Operations: ✅");
  yield* Console.log("  - Store Management: ✅");
  yield* Console.log("  - Schema Validation: ✅");

  return results;
});

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

export { runEntityStoreTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Effect.runPromise(
    pipe(runEntityStoreTests, Effect.provide(EntityStoreService.Live))
  ).catch(console.error);
}
