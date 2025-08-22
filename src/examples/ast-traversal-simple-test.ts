/**
 * Simple AST Traversal Test - Debug version
 */

import { Schema, Effect, pipe, Console } from "effect";
import { buildSchemaASTTree } from "../Extraction/ASTTraverse.js";

// Simple test schema
const TestSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
}).annotations({
  identifier: "TestSchema",
  title: "Test Schema",
  description: "A simple test schema"
});

const debugASTTraversal = Effect.gen(function* (_) {
  yield* _(Console.log("=== Simple AST Traversal Debug ===\n"));

  // Build the AST tree
  const tree = yield* _(buildSchemaASTTree(TestSchema));
  
  yield* _(Console.log("✓ Schema AST Tree built successfully"));
  yield* _(Console.log(`Root node identifier: ${tree.root.context.identifier}`));
  yield* _(Console.log(`Root node title: ${tree.root.context.title}`));
  yield* _(Console.log(`Root node description: ${tree.root.context.description}`));
  yield* _(Console.log(`Root node semantic type: ${tree.root.context.semanticType}`));
  yield* _(Console.log(`Root node path: ${tree.root.path.join(".")}`));
  yield* _(Console.log(`Root node children count: ${tree.root.children.length}`));
  yield* _(Console.log(""));

  // Log all children
  tree.root.children.forEach((child, index) => {
    console.log(`Child ${index + 1}:`);
    console.log(`  Path: ${child.path.join(".")}`);
    console.log(`  Role: ${child.context.role}`);
    console.log(`  Type: ${child.context.semanticType}`);
    console.log("");
  });

  // Log node maps
  yield* _(Console.log(`Node map size: ${tree.nodeMap.size}`));
  yield* _(Console.log(`Path map size: ${tree.pathMap.size}`));
  
  // Log all paths in path map
  yield* _(Console.log("\nPaths in path map:"));
  tree.pathMap.forEach((node, path) => {
    console.log(`  ${path} -> ${node.context.semanticType}`);
  });

  yield* _(Console.log("\n=== Debug completed ==="));
});

Effect.runPromise(debugASTTraversal).catch(console.error);
