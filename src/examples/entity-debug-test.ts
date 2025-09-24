import { Effect, Schema, Console } from "effect";
import {
  MakeEntitySchema,
  MakeEntityId,
  MakeSchemaId,
  EntityId,
  SchemaId,
} from "../Extraction/Entity.js";

const debugEntityAnnotations = () =>
  Effect.gen(function* () {
    yield* Console.log("=== Entity Annotation Debug Test ===");

    // Test 1: Create a simple entity
    const Person = MakeEntitySchema({
      name: "Person",
      schema: Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      }),
    });

    yield* Console.log("\n1. Entity AST annotations:");
    yield* Console.log(`All annotations: ${JSON.stringify(Person.ast.annotations, null, 2)}`);
    
    // Check for symbol-based annotations
    const symbolKeys = Object.getOwnPropertySymbols(Person.ast.annotations);
    yield* Console.log(`Symbol keys: ${symbolKeys.map(s => s.toString())}`);
    
    for (const symbol of symbolKeys) {
      yield* Console.log(`Symbol ${symbol.toString()}: ${Person.ast.annotations[symbol]}`);
    }

    // Test 2: Check property signatures
    yield* Console.log("\n2. Property signature annotations:");
    const signatures = Person.ast.propertySignatures;
    if (signatures) {
      for (const sig of signatures) {
        yield* Console.log(`Property ${String(sig.name)}:`);
        yield* Console.log(`  All annotations: ${JSON.stringify(sig.annotations, null, 2)}`);
        
        const propSymbolKeys = Object.getOwnPropertySymbols(sig.annotations);
        yield* Console.log(`  Symbol keys: ${propSymbolKeys.map(s => s.toString())}`);
        
        for (const symbol of propSymbolKeys) {
          yield* Console.log(`  Symbol ${symbol.toString()}: ${sig.annotations[symbol]}`);
        }
      }
    }

    // Test 3: Try to access string-based annotations
    yield* Console.log("\n3. String-based annotation access:");
    yield* Console.log(`identifier: ${Person.ast.annotations.identifier}`);
    yield* Console.log(`schemaId: ${Person.ast.annotations.schemaId}`);
    yield* Console.log(`entityPropFor: ${Person.ast.annotations.entityPropFor}`);

    // Test 4: Check branded types
    yield* Console.log("\n4. Branded type creation:");
    const entityId = MakeEntityId();
    const schemaId = MakeSchemaId("Test");
    
    yield* Console.log(`EntityId: ${entityId}`);
    yield* Console.log(`SchemaId: ${schemaId}`);
    yield* Console.log(`EntityId type: ${typeof entityId}`);
    yield* Console.log(`SchemaId type: ${typeof schemaId}`);

    yield* Console.log("\n=== Debug Complete ===");
  });

// Run the debug test
Effect.runPromise(debugEntityAnnotations()).catch(console.error);


