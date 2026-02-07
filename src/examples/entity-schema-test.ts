import { Effect, Schema, Console, SchemaAST, HashSet } from "effect";
import {
  MakeEntitySchema,
  MakeEntityId,
  MakeSchemaId,
  isEntitySchema,
  EntityPropHashSet,
  EntityHash,
  EntityId,
  SchemaId,
} from "../Extraction/Entity.js";

// Test schemas
const Person = MakeEntitySchema({
  name: "Person",
  schema: Schema.Struct({
    name: Schema.String,
    age: Schema.Number,
    email: Schema.String,
  }),
});

const Address = MakeEntitySchema({
  name: "Address",
  schema: Schema.Struct({
    street: Schema.String,
    city: Schema.String,
    zipCode: Schema.String,
  }),
});

const Organization = MakeEntitySchema({
  name: "Organization",
  schema: Schema.Struct({
    name: Schema.String,
    industry: Schema.String,
    founded: Schema.Number,
    address: Address,
  }),
});

const ComplexFields = Schema.Struct({
  name: Schema.String,
  metadata: Schema.Array(Schema.Tuple(Schema.String, Schema.String)),
  tags: Schema.Array(Schema.String),
  active: Schema.Boolean,
});

// Helper function to get symbol-based annotations
const getEntityId = (schema: any): string => {
  const symbolKeys = Object.getOwnPropertySymbols(schema.ast.annotations);
  const identifierSymbol = symbolKeys.find((s) =>
    s.toString().includes("Identifier")
  );
  return identifierSymbol
    ? schema.ast.annotations[identifierSymbol]
    : "unknown";
};

const getSchemaId = (schema: any): string => {
  const symbolKeys = Object.getOwnPropertySymbols(schema.ast.annotations);
  const schemaIdSymbol = symbolKeys.find((s) =>
    s.toString().includes("SchemaId")
  );
  return schemaIdSymbol ? schema.ast.annotations[schemaIdSymbol] : "unknown";
};

const testEntitySchemaCreation = () =>
  Effect.gen(function* () {
    yield* Console.log("=== Entity Schema Creation Test ===");

    // Test 1: Basic entity schema creation
    yield* Console.log("\n1. Creating basic person entity schema...");
    const personEntity = Person;

    yield* Console.log(`Person Entity ID: ${getEntityId(personEntity)}`);
    yield* Console.log(`Person Schema ID: ${getSchemaId(personEntity)}`);
    yield* Console.log(`Is Entity Schema: ${isEntitySchema(personEntity)}`);

    // Test 2: Entity schema with custom ID
    yield* Console.log("\n2. Creating organization entity with custom ID...");
    const customEntityId = MakeEntityId();
    const orgEntity = MakeEntitySchema({
      schema: Organization,
      name: "Organization",
      entityId: customEntityId,
    });

    yield* Console.log(`Custom Entity ID: ${getEntityId(orgEntity)}`);
    yield* Console.log(`Organization Schema ID: ${getSchemaId(orgEntity)}`);
    yield* Console.log(`Is Entity Schema: ${isEntitySchema(orgEntity)}`);

    // Test 3: Complex nested schema
    yield* Console.log("\n3. Creating complex entity schema...");
    const complexEntity = MakeEntitySchema({
      schema: ComplexFields,
      name: "ComplexEntity",
    });

    yield* Console.log(`Complex Entity ID: ${getEntityId(complexEntity)}`);
    yield* Console.log(`Complex Schema ID: ${getSchemaId(complexEntity)}`);
    yield* Console.log(`Is Entity Schema: ${isEntitySchema(complexEntity)}`);

    // Test 4: Schema validation
    yield* Console.log("\n4. Testing schema validation...");
    const validPersonData = {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
    };

    const validationResult = Schema.decode(personEntity)(validPersonData);
    const validatedData = yield* validationResult;
    yield* Console.log("Validated data:");
    yield* Console.log(validatedData);

    // Test 5: Entity property hash set
    yield* Console.log("\n5. Testing entity property hash set...");
    const personHashSet = EntityPropHashSet(personEntity);
    const orgHashSet = EntityPropHashSet(orgEntity);

    yield* Console.log(`Person property count: ${HashSet.size(personHashSet)}`);
    yield* Console.log(
      `Organization property count: ${HashSet.size(orgHashSet)}`
    );

    // Test 6: Entity hashing
    yield* Console.log("\n6. Testing entity hashing...");
    const personHash = EntityHash(personEntity);
    const orgHash = EntityHash(orgEntity);
    const complexHash = EntityHash(complexEntity);

    yield* Console.log(`Person hash: ${personHash}`);
    yield* Console.log(`Organization hash: ${orgHash}`);
    yield* Console.log(`Complex hash: ${complexHash}`);

    // Test 7: Branded type validation
    yield* Console.log("\n7. Testing branded type validation...");
    const testEntityId = MakeEntityId();
    const testSchemaId = MakeSchemaId("Test");

    yield* Console.log(`Entity ID pattern: ${testEntityId}`);
    yield* Console.log(`Schema ID pattern: ${testSchemaId}`);
    yield* Console.log(
      `Is valid EntityId: ${Schema.is(EntityId)(testEntityId)}`
    );
    yield* Console.log(
      `Is valid SchemaId: ${Schema.is(SchemaId)(testSchemaId)}`
    );

    // Test 8: AST inspection
    yield* Console.log("\n8. Inspecting AST structure...");
    yield* Console.log(`Person AST tag: ${personEntity.ast._tag}`);
    yield* Console.log(
      `Person property signatures: ${
        SchemaAST.getPropertySignatures(personEntity.ast)?.length || 0
      }`
    );

    if (SchemaAST.getPropertySignatures(personEntity.ast)) {
      yield* Console.log("Person property names:");
      for (const sig of SchemaAST.getPropertySignatures(personEntity.ast)) {
        yield* Console.log(`  - ${String(sig.name)}: ${sig.type._tag}`);

        // Show symbol-based annotations
        const symbolKeys = Object.getOwnPropertySymbols(sig.annotations);
        if (symbolKeys.length > 0) {
          yield* Console.log(`    Symbol annotations:`);
          for (const symbol of symbolKeys) {
            yield* Console.log(
              `      ${symbol.toString()}: ${sig.annotations[symbol]}`
            );
          }
        }
      }
    }

    // Test 9: Nested entity inspection
    yield* Console.log("\n9. Inspecting nested entity structure...");
    const addressSignatures = SchemaAST.getPropertySignatures(Address.ast);
    yield* Console.log(
      `Address property signatures: ${addressSignatures?.length || 0}`
    );

    if (addressSignatures) {
      yield* Console.log("Address property names:");
      for (const sig of addressSignatures) {
        yield* Console.log(`  - ${String(sig.name)}: ${sig.type._tag}`);

        // Show symbol-based annotations
        const symbolKeys = Object.getOwnPropertySymbols(sig.annotations);
        if (symbolKeys.length > 0) {
          yield* Console.log(`    Symbol annotations:`);
          for (const symbol of symbolKeys) {
            yield* Console.log(
              `      ${symbol.toString()}: ${sig.annotations[symbol]}`
            );
          }
        }
      }
    }

    // Test 10: Organization with nested Address entity
    yield* Console.log("\n10. Inspecting Organization with nested Address...");
    const orgSignatures = SchemaAST.getPropertySignatures(orgEntity.ast);
    yield* Console.log(
      `Organization property signatures: ${orgSignatures?.length || 0}`
    );

    if (orgSignatures) {
      yield* Console.log("Organization property names:");
      for (const sig of orgSignatures) {
        yield* Console.log(`  - ${String(sig.name)}: ${sig.type._tag}`);
        if (sig.type._tag === "TypeLiteral") {
          yield* Console.log(
            `    (Nested TypeLiteral with ${
              SchemaAST.getPropertySignatures(sig.type)?.length || 0
            } properties)`
          );
        }

        // Show symbol-based annotations
        const symbolKeys = Object.getOwnPropertySymbols(sig.annotations);
        if (symbolKeys.length > 0) {
          yield* Console.log(`    Symbol annotations:`);
          for (const symbol of symbolKeys) {
            yield* Console.log(
              `      ${symbol.toString()}: ${sig.annotations[symbol]}`
            );
          }
        }
      }
    }

    yield* Console.log("\n=== Test Complete ===");
  });

// Run the test
Effect.runPromise(testEntitySchemaCreation()).catch(console.error);
