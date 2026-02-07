/**
 * Simple AST Traversal Test - Debug version
 */

import { Schema, Effect, Option, Console, HashMap } from "effect";
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

const debugASTTraversal = Effect.gen(function* () {
  yield* Console.log("=== Simple AST Traversal Debug ===\n");

  // Build the AST tree
  const tree = yield* buildSchemaASTTree(TestSchema);
  
  yield* Console.log("✓ Schema AST Tree built successfully");
  const core = tree.root.context.annotations.core;
  yield* Console.log(
    `Root node title: ${Option.getOrElse(core, () => ({ title: "" })).title ?? ""}`
  );
  yield* Console.log(
    `Root node description: ${
      Option.getOrElse(core, () => ({ description: "" })).description ?? ""
    }`
  );
  yield* Console.log(
    `Root node semantic type: ${
      Option.getOrElse(tree.root.context.semanticType, () => "unknown")
    }`
  );
  yield* Console.log(`Root node path: ${tree.root.path.join(".")}`);
  yield* Console.log(`Root node children count: ${tree.root.children.length}`);
  yield* Console.log("");

  // Log all children
  tree.root.children.forEach((child, index) => {
    console.log(`Child ${index + 1}:`);
    console.log(`  Path: ${child.path.join(".")}`);
    console.log(
      `  Role: ${
        Option.getOrElse(child.context.annotations.role, () => ({ role: "" })).role
      }`
    );
    console.log(
      `  Type: ${
        Option.getOrElse(child.context.semanticType, () => "unknown")
      }`
    );
    console.log("");
  });

  // Log node maps
  yield* Console.log(`Node map size: ${HashMap.size(tree.nodeMap)}`);
  yield* Console.log(`Path map size: ${HashMap.size(tree.pathMap)}`);
  
  // Log all paths in path map
  yield* Console.log("\nPaths in path map:");
  HashMap.forEach(tree.pathMap, (node, path) => {
    console.log(
      `  ${path} -> ${Option.getOrElse(node.context.semanticType, () => "unknown")}`
    );
  });

  yield* Console.log("\n=== Debug completed ===");
});

Effect.runPromise(debugASTTraversal).catch(console.error);
