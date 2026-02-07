import { Effect, Schema, Console } from "effect";
import { MakeEntity } from "../Extraction/Entity.js";

// ============================================================================
// DEMO SCHEMAS
// ============================================================================

const PersonFields = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  email: Schema.String,
});

const personEntity = MakeEntity(PersonFields, { name: "Person" });

// ============================================================================
// DEMONSTRATE SCHEMA.PARSEJSON USAGE
// ============================================================================

const demonstrateParseJson = Effect.gen(function* () {
  yield* Console.log("=== Schema.parseJson Demo ===");
  yield* Console.log("Schema.parseJson is for parsing JSON strings into structured data");

  // Example 1: Parse a JSON string into structured data
  const jsonString = '{"name": "John Doe", "age": 30, "email": "john@example.com"}';
  
  yield* Console.log("\n1. Parsing JSON string into structured data:");
  yield* Console.log(`Input JSON string: ${jsonString}`);
  
  // Create a schema that can parse JSON strings into our Person type
  const parseJsonSchema = Schema.parseJson(personEntity.schema);
  
  // Parse the JSON string
  const parsedPerson = yield* Schema.decode(parseJsonSchema)(jsonString);
  
  yield* Console.log("Parsed result:");
  yield* Console.log(parsedPerson);

  // Example 2: Encode data back to JSON string
  yield* Console.log("\n2. Encoding data back to JSON string:");
  
  const personData = {
    name: "Jane Smith",
    age: 25,
    email: "jane@example.com"
  };
  
  yield* Console.log("Input data:");
  yield* Console.log(personData);
  
  // Encode using the parseJson schema
  const encodePerson = Schema.encode(parseJsonSchema);
  const encodedJsonString = yield* encodePerson(personData);
  
  yield* Console.log("Encoded JSON string:");
  yield* Console.log(encodedJsonString);

  // Example 3: Show that Schema.parseJson handles JSON.stringify internally
  yield* Console.log("\n3. Schema.parseJson handles JSON.stringify internally:");
  yield* Console.log("When you encode with Schema.parseJson, it automatically stringifies the data");
  
  const complexData = {
    name: "Bob Wilson",
    age: 35,
    email: "bob@example.com",
    metadata: {
      department: "Engineering",
      startDate: "2023-01-15"
    }
  };
  
  const encodedComplex = yield* encodePerson(complexData);
  yield* Console.log("Complex data encoded to JSON string:");
  yield* Console.log(encodedComplex);
  
  // Parse it back
  const parsedComplex = yield* Schema.decode(parseJsonSchema)(encodedComplex);
  yield* Console.log("Parsed back to structured data:");
  yield* Console.log(parsedComplex);
});

// ============================================================================
// RUN DEMO
// ============================================================================

Effect.runPromise(demonstrateParseJson).catch(console.error);
