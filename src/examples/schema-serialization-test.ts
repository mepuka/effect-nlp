import { Effect, Schema, pipe, Console , JSONSchema } from "effect";
import { MakeEntity, EntityHash } from "../Extraction/Entity.js";

// ============================================================================
// TEST SCHEMAS
// ============================================================================

const PersonFields = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  email: Schema.String,
});

const OrganizationFields = Schema.Struct({
  name: Schema.String,
  industry: Schema.String,
  founded: Schema.Number,
  ceo: PersonFields, // Nested schema
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

const testSchemaSerialization = Effect.gen(function* () {
  yield* Console.log("=== Effect Schema Serialization Test ===");

  // Create test entities
  const personEntity = MakeEntity(PersonFields, { name: "Person" });
  const orgEntity = MakeEntity(OrganizationFields, { name: "Organization" });

  yield* Console.log(
    "\n1. JSONSchema.make - Generate JSON Schema definitions:"
  );
  yield* Console.log(
    "   This creates JSON Schema representations for validation"
  );

  // Generate JSON Schema definitions using JSONSchema.make
  const personJsonSchema = JSONSchema.make(personEntity.schema);
  const orgJsonSchema = JSONSchema.make(orgEntity.schema);

  yield* Console.log("Person JSON Schema:");
  yield* Console.log(JSON.stringify(personJsonSchema, null, 2));

  yield* Console.log("\nOrganization JSON Schema:");
  yield* Console.log(JSON.stringify(orgJsonSchema, null, 2));

  yield* Console.log("\n2. Schema.encode - Encode data according to schema:");
  yield* Console.log(
    "   This transforms data according to schema transformations"
  );

  // Test data that conforms to the schemas
  const personData = {
    name: "John Doe",
    age: 30,
    email: "john@example.com",
  };

  const orgData = {
    name: "Acme Corp",
    industry: "Technology",
    founded: 2020,
    ceo: {
      name: "Jane Smith",
      age: 35,
      email: "jane@acme.com",
    },
  };

  // Encode data using Schema.encode (for data transformations)
  const encodePerson = Schema.encode(personEntity.schema);
  const encodeOrg = Schema.encode(orgEntity.schema);

  const encodedPerson = yield* encodePerson(personData);
  const encodedOrg = yield* encodeOrg(orgData);

  yield* Console.log("Encoded Person Data (using Schema.encode):");
  yield* Console.log(JSON.stringify(encodedPerson, null, 2));

  yield* Console.log("\nEncoded Organization Data (using Schema.encode):");
  yield* Console.log(JSON.stringify(encodedOrg, null, 2));

  yield* Console.log(
    "\n3. Schema.parseJson - Parse JSON strings into structured data:"
  );
  yield* Console.log(
    "   This is for parsing JSON strings, not for schema serialization"
  );

  // Example of Schema.parseJson usage
  const jsonString = JSON.stringify(personData);
  const parseJsonSchema = Schema.parseJson(personEntity.schema);

  const parsedData = yield* Schema.decode(parseJsonSchema)(jsonString);
  yield* Console.log("Parsed JSON string back to data:");
  yield* Console.log(JSON.stringify(parsedData, null, 2));

  yield* Console.log("\n4. Entity Hash for storage:");

  const personHash = EntityHash(personEntity);
  const orgHash = EntityHash(orgEntity);

  yield* Console.log(`Person Entity Hash: ${personHash}`);
  yield* Console.log(`Organization Entity Hash: ${orgHash}`);

  yield* Console.log("\n=== Summary ===");
  yield* Console.log(
    "• JSONSchema.make: Generate JSON Schema definitions for validation"
  );
  yield* Console.log(
    "• Schema.encode: Transform data according to schema transformations"
  );
  yield* Console.log(
    "• Schema.parseJson: Parse JSON strings into structured data"
  );
  yield* Console.log(
    "• For storing schema definitions, we use JSONSchema.make + JSON.stringify"
  );
});

// ============================================================================
// RUN TEST
// ============================================================================

Effect.runPromise(testSchemaSerialization).catch(console.error);
