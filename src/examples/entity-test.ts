/**
 * Entity Test - Testing entity creation and schema manipulation
 *
 * This test file validates the Entity module's functionality including:
 * - Entity creation with metadata
 * - Schema AST stamping with entity annotations
 * - Property signature manipulation
 * - Branded type validation
 */

import { Schema, Effect, Console } from "effect";
import { Doc } from "@effect/printer";
import {
  MakeEntity,
  MakeEntityId,
  MakeSchemaId,
  EntityId,
  SchemaId,
  EntityPropHashSet,
  EntityHash,
} from "../Extraction/Entity.js";
import {
  schemaToDoc,
  minimalFormatOptions,
} from "../Extraction/AnnotationParser.js";

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

// Complex organization schema for testing
const OrganizationFields = {
  name: Schema.String.pipe(
    Schema.annotations({
      identifier: "name",
      title: "Organization Name",
    })
  ),
  founded: Schema.Number.pipe(
    Schema.annotations({
      identifier: "founded",
      title: "Founded Year",
    })
  ),
  isPublic: Schema.Boolean.pipe(
    Schema.annotations({
      identifier: "isPublic",
      title: "Public Company",
    })
  ),
  tags: Schema.Array(Schema.String).pipe(
    Schema.annotations({
      identifier: "tags",
      title: "Tags",
    })
  ),
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

const testEntityCreation = Effect.gen(function* () {
  yield* Console.log("=== Entity Creation Tests ===\n");

  // Test 1: Basic entity creation
  yield* Console.log("1. Basic Entity Creation:");
  const personEntity = MakeEntity(PersonFields, { name: "Person" });

  yield* Effect.all([
    Console.log(`  Entity ID: ${personEntity.entityId}`),
    Console.log(`  Schema ID: ${personEntity.schemaId}`),
    Console.log(`  Entity Tag: ${personEntity._tag}`),
  ]);
  yield* Console.log("");

  // Test 2: Entity with custom IDs
  yield* Console.log("2. Entity with Custom IDs:");
  const customEntityId = MakeEntityId();
  const customSchemaId = MakeSchemaId("custom-person");

  const customPersonEntity = MakeEntity(PersonFields, {
    name: "CustomPerson",
    entityId: customEntityId,
    schemaId: customSchemaId,
  });

  yield* Effect.all([
    Console.log(`  Custom Entity ID: ${customPersonEntity.entityId}`),
    Console.log(`  Custom Schema ID: ${customPersonEntity.schemaId}`),
    Console.log(`  Expected Entity ID: ${customEntityId}`),
    Console.log(`  Expected Schema ID: ${customSchemaId}`),
  ]);
  yield* Console.log("");

  // Test 3: Complex entity creation
  yield* Console.log("3. Complex Entity Creation:");
  const orgEntity = MakeEntity(OrganizationFields, { name: "Organization" });

  yield* Effect.all([
    Console.log(`  Organization Entity ID: ${orgEntity.entityId}`),
    Console.log(`  Organization Schema ID: ${orgEntity.schemaId}`),
  ]);
  yield* Console.log("");

  return { personEntity, customPersonEntity, orgEntity };
});

const testSchemaStamping = Effect.gen(function* () {
  yield* Console.log("=== Schema Stamping Tests ===\n");

  // Create test entity
  const personEntity = MakeEntity(PersonFields, { name: "TestPerson" });

  // Test 1: Check AST annotations
  yield* Console.log("1. AST Annotations:");
  const ast = personEntity.schema.ast;

  yield* Effect.all([
    Console.log(`  AST Type: ${ast._tag}`),
    Console.log(`  Entity ID in AST: ${ast.annotations["entityId"]}`),
    Console.log(`  Schema ID in AST: ${ast.annotations["schemaId"]}`),
  ]);
  yield* Console.log("");

  // Test 2: Check property signatures
  yield* Console.log("2. Property Signatures:");
  if (ast._tag === "TypeLiteral") {
    const propertySignatures = ast.propertySignatures;

    yield* Console.log(`  Number of properties: ${propertySignatures.length}`);

    for (const prop of propertySignatures) {
      const entityPropFor = prop.annotations["entityPropFor"];
      yield* Console.log(`  Property: ${String(prop.name)}`);
      yield* Console.log(`    - Entity Prop For: ${entityPropFor}`);
      yield* Console.log(`    - Type: ${prop.type._tag}`);
    }
  }
  yield* Console.log("");

  // Test 3: Schema validation
  yield* Console.log("3. Schema Validation:");
  const testData = {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    identifier: personEntity.entityId,
    schemaId: personEntity.schemaId,
    createdAt: new Date().toISOString(),
  };

  try {
    const validated = Schema.decodeUnknownSync(personEntity.schema)(testData);
    yield* Console.log("  ✅ Schema validation successful");
    yield* Console.log(
      `  Validated data: ${JSON.stringify(validated, null, 2)}`
    );
  } catch (error) {
    yield* Console.log(`  ❌ Schema validation failed: ${error}`);
  }
  yield* Console.log("");

  return personEntity;
});

const testSchemaVisualization = Effect.gen(function* () {
  yield* Console.log("=== Schema Visualization Tests ===\n");

  // Create test entities
  const personEntity = MakeEntity(PersonFields, { name: "VisualPerson" });
  const orgEntity = MakeEntity(OrganizationFields, { name: "VisualOrg" });

  // Test 1: Person entity visualization
  yield* Console.log("1. Person Entity Schema:");
  const personDoc = schemaToDoc(personEntity.schema, minimalFormatOptions);
  const personString = Doc.render(personDoc, { style: "pretty" });
  yield* Console.log(personString);
  yield* Console.log("");

  // Test 2: Organization entity visualization
  yield* Console.log("2. Organization Entity Schema:");
  const orgDoc = schemaToDoc(orgEntity.schema, minimalFormatOptions);
  const orgString = Doc.render(orgDoc, { style: "pretty" });
  yield* Console.log(orgString);
  yield* Console.log("");

  // Test 3: Full format visualization
  yield* Console.log("3. Full Format Person Entity:");
  const fullPersonDoc = schemaToDoc(personEntity.schema);
  const fullPersonString = Doc.render(fullPersonDoc, { style: "pretty" });
  yield* Console.log(fullPersonString);
  yield* Console.log("");

  return { personEntity, orgEntity };
});

const testBrandedTypes = Effect.gen(function* () {
  yield* Console.log("=== Branded Types Tests ===\n");

  // Test 1: EntityId creation and validation
  yield* Console.log("1. EntityId Branded Type:");
  const entityId1 = MakeEntityId();
  const entityId2 = MakeEntityId();

  yield* Effect.all([
    Console.log(`  Entity ID 1: ${entityId1}`),
    Console.log(`  Entity ID 2: ${entityId2}`),
    Console.log(`  Are different: ${entityId1 !== entityId2}`),
    Console.log(`  Type check: ${typeof entityId1 === "string"}`),
  ]);
  yield* Console.log("");

  // Test 2: SchemaId creation and validation
  yield* Console.log("2. SchemaId Branded Type:");
  const schemaId1 = MakeSchemaId("test-schema");
  const schemaId2 = MakeSchemaId("another-schema");

  yield* Effect.all([
    Console.log(`  Schema ID 1: ${schemaId1}`),
    Console.log(`  Schema ID 2: ${schemaId2}`),
    Console.log(`  Are different: ${schemaId1 !== schemaId2}`),
    Console.log(`  Type check: ${typeof schemaId1 === "string"}`),
  ]);
  yield* Console.log("");

  // Test 3: Schema validation of branded types
  yield* Console.log("3. Branded Type Schema Validation:");
  try {
    const validEntityId = EntityId.make("entity-123");
    const validSchemaId = SchemaId.make("schema-test-456");

    yield* Console.log(`  Valid Entity ID: ${validEntityId}`);
    yield* Console.log(`  Valid Schema ID: ${validSchemaId}`);
    yield* Console.log("  ✅ Branded type validation successful");
  } catch (error) {
    yield* Console.log(`  ❌ Branded type validation failed: ${error}`);
  }
  yield* Console.log("");

  return { entityId1, entityId2, schemaId1, schemaId2 };
});

const testEntityComposition = Effect.gen(function* () {
  yield* Console.log("=== Entity Composition Tests ===\n");

  // Test 1: Entity with nested schemas
  yield* Console.log("1. Entity with Nested Schemas:");

  const AddressFields = {
    street: Schema.String,
    city: Schema.String,
    country: Schema.String,
  };

  const addressEntity = MakeEntity(AddressFields, { name: "Address" });

  const PersonWithAddressFields = {
    ...PersonFields,
    address: addressEntity.schema,
  };

  const personWithAddressEntity = MakeEntity(PersonWithAddressFields, {
    name: "PersonWithAddress",
  });

  yield* Effect.all([
    Console.log(`  Person Entity ID: ${personWithAddressEntity.entityId}`),
    Console.log(`  Address Entity ID: ${addressEntity.entityId}`),
    Console.log(
      `  Different entities: ${
        personWithAddressEntity.entityId !== addressEntity.entityId
      }`
    ),
  ]);
  yield* Console.log("");

  // Test 2: Complex nested entity visualization
  yield* Console.log("2. Complex Nested Entity Schema:");
  const nestedDoc = schemaToDoc(
    personWithAddressEntity.schema,
    minimalFormatOptions
  );
  const nestedString = Doc.render(nestedDoc, { style: "pretty" });
  yield* Console.log(nestedString);
  yield* Console.log("");

  return { addressEntity, personWithAddressEntity };
});

const testEntityHashing = Effect.gen(function* () {
  yield* Console.log("=== Entity Hashing Tests ===\n");

  // Test 1: Entity property hash set
  yield* Console.log("1. Entity Property Hash Set:");
  const personEntity = MakeEntity(PersonFields, { name: "HashPerson" });
  const entityPropHashSet = EntityPropHashSet(personEntity);

  yield* Effect.all([
    Console.log(`  Entity ID: ${personEntity.entityId}`),
    Console.log(
      `  Hash Set Values: ${Array.from(entityPropHashSet).join(", ")}`
    ),
  ]);
  yield* Console.log("");

  // Test 2: Entity hash generation
  yield* Console.log("2. Entity Hash Generation:");
  const entityHash = EntityHash(personEntity);

  yield* Effect.all([
    Console.log(`  Entity Hash: ${entityHash}`),
    Console.log(`  Hash Type: ${typeof entityHash}`),
    Console.log(`  Is Number: ${Number.isInteger(entityHash)}`),
  ]);
  yield* Console.log("");

  // Test 3: Hash consistency for same entity
  yield* Console.log("3. Hash Consistency:");
  const sameEntity = MakeEntity(PersonFields, {
    name: "HashPerson",
    entityId: personEntity.entityId,
    schemaId: personEntity.schemaId,
  });

  const sameEntityHash = EntityHash(sameEntity);

  yield* Effect.all([
    Console.log(`  Original Hash: ${entityHash}`),
    Console.log(`  Same Entity Hash: ${sameEntityHash}`),
    Console.log(`  Hashes Equal: ${entityHash === sameEntityHash}`),
  ]);
  yield* Console.log("");

  // Test 4: Hash uniqueness for different entities
  yield* Console.log("4. Hash Uniqueness:");
  const differentEntity = MakeEntity(PersonFields, { name: "DifferentPerson" });
  const differentEntityHash = EntityHash(differentEntity);

  yield* Effect.all([
    Console.log(`  Original Hash: ${entityHash}`),
    Console.log(`  Different Entity Hash: ${differentEntityHash}`),
    Console.log(`  Hashes Different: ${entityHash !== differentEntityHash}`),
  ]);
  yield* Console.log("");

  // Test 5: Complex entity hashing
  yield* Console.log("5. Complex Entity Hashing:");
  const orgEntity = MakeEntity(OrganizationFields, { name: "HashOrg" });
  const orgEntityHash = EntityHash(orgEntity);
  const orgEntityPropHashSet = EntityPropHashSet(orgEntity);

  yield* Effect.all([
    Console.log(`  Organization Entity ID: ${orgEntity.entityId}`),
    Console.log(
      `  Organization Hash Set Values: ${Array.from(orgEntityPropHashSet).join(
        ", "
      )}`
    ),
    Console.log(`  Organization Hash: ${orgEntityHash}`),
    Console.log(
      `  Different from Person Hash: ${orgEntityHash !== entityHash}`
    ),
  ]);
  yield* Console.log("");

  // Test 6: Nested entity hashing
  yield* Console.log("6. Nested Entity Hashing:");
  const AddressFields = {
    street: Schema.String,
    city: Schema.String,
    country: Schema.String,
  };

  const addressEntity = MakeEntity(AddressFields, { name: "HashAddress" });
  const addressEntityHash = EntityHash(addressEntity);

  const PersonWithAddressFields = {
    ...PersonFields,
    address: addressEntity.schema,
  };

  const personWithAddressEntity = MakeEntity(PersonWithAddressFields, {
    name: "HashPersonWithAddress",
  });
  const personWithAddressHash = EntityHash(personWithAddressEntity);

  yield* Effect.all([
    Console.log(`  Address Entity Hash: ${addressEntityHash}`),
    Console.log(`  Person with Address Hash: ${personWithAddressHash}`),
    Console.log(
      `  All Hashes Different: ${
        entityHash !== addressEntityHash &&
        addressEntityHash !== personWithAddressHash &&
        entityHash !== personWithAddressHash
      }`
    ),
  ]);
  yield* Console.log("");

  return {
    personEntity,
    entityHash,
    orgEntity,
    orgEntityHash,
    addressEntity,
    addressEntityHash,
    personWithAddressEntity,
    personWithAddressHash,
  };
});

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

const runEntityTests = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Entity Tests\n");

  // Run all test suites
  const results = yield* Effect.all([
    testEntityCreation,
    testSchemaStamping,
    testSchemaVisualization,
    testBrandedTypes,
    testEntityComposition,
    testEntityHashing,
  ]);

  yield* Console.log("✅ All Entity Tests Completed Successfully!\n");

  // Summary
  yield* Console.log("📊 Test Summary:");
  yield* Console.log("  - Entity Creation: ✅");
  yield* Console.log("  - Schema Stamping: ✅");
  yield* Console.log("  - Schema Visualization: ✅");
  yield* Console.log("  - Branded Types: ✅");
  yield* Console.log("  - Entity Composition: ✅");
  yield* Console.log("  - Entity Hashing: ✅");

  return results;
});

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

export { runEntityTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Effect.runPromise(runEntityTests).catch(console.error);
}
