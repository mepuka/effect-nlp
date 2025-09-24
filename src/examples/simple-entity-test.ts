import { Effect, Schema, Console } from "effect";
import {
  buildSchemaASTTree,
  generatePromptContext,
} from "../Extraction/ASTTraverse.js";
import {
  getEntityId,
  getSchemaId,
  MakeEntitySchema,
  EntityHash,
} from "../Extraction/Entity.js";

// Define a simple test schema
const SimpleFields = Schema.Struct({
  name: Schema.String,
});

// Test the MakeEntity function
const testMakeEntity = Effect.gen(function* () {
  yield* Console.log("=== Testing MakeEntity ===");

  yield* Console.log("Creating simple entity...");
  const simpleEntity = MakeEntitySchema({
    schema: SimpleFields,
    name: "Simple",
  });
  yield* Console.log(
    `Entity created successfully: ${getEntityId(simpleEntity)}`
  );
  yield* Console.log(`Schema ID: ${getSchemaId(simpleEntity)}`);
  yield* Console.log(`Entity Hash: ${EntityHash(simpleEntity)}`);

  const tree = yield* buildSchemaASTTree(simpleEntity);
  const context = generatePromptContext(tree.nodeMap);
  yield* Console.log(context);
});

// Run the test
Effect.runPromise(testMakeEntity).catch(console.error);
