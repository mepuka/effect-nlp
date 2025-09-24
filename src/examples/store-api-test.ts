import { Effect, Schema, Console } from "effect";
import { MakeEntity } from "../Extraction/Entity.js";
import {
  storeEntity,
  retrieveEntity,
  EntityStoreService,
} from "../Extraction/Store.js";

// Define test schemas
const PersonFields = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  email: Schema.String,
});

const OrganizationFields = Schema.Struct({
  name: Schema.String,
  industry: Schema.String,
  founded: Schema.Number,
});

// Create test entities
const personEntity = MakeEntity(PersonFields.fields, { name: "Person" });
const orgEntity = MakeEntity(OrganizationFields.fields, {
  name: "Organization",
});

// Test the improved API
const testImprovedAPI = Effect.gen(function* () {
  yield* Console.log("=== Testing Improved Store API ===");

  // Test storing entities with the new simplified API
  yield* Console.log("\n1. Storing person entity...");
  yield* storeEntity(personEntity);

  yield* Console.log("\n2. Storing organization entity...");
  yield* storeEntity(orgEntity);

  // Test retrieving entities
  yield* Console.log("\n3. Retrieving person entity...");
  const personResult = yield* retrieveEntity(personEntity.entityId);
  yield* Console.log(
    `Person entity found: ${personResult._tag === "Some" ? "Yes" : "No"}`
  );

  yield* Console.log("\n4. Retrieving organization entity...");
  const orgResult = yield* retrieveEntity(orgEntity.entityId);
  yield* Console.log(
    `Organization entity found: ${orgResult._tag === "Some" ? "Yes" : "No"}`
  );

  yield* Console.log("\n=== API Test Complete ===");
});

testImprovedAPI.pipe(
  Effect.provide(EntityStoreService.Default),
  Effect.runPromise
);
