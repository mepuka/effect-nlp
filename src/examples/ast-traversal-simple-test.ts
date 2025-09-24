/**
 * Simple AST Traversal Test - Debug version
 */

import { Schema, Effect, Option, Console } from "effect";
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
  const core = tree.root.context.annotations.core;
  yield* _(
    Console.log(
      `Root node title: ${Option.getOrElse(core, () => ({ title: "" })).title ?? ""}`
    )
  );
  yield* _(
    Console.log(
      `Root node description: ${
        Option.getOrElse(core, () => ({ description: "" })).description ?? ""
      }`
    )
  );
  yield* _(
    Console.log(
      `Root node semantic type: ${
        Option.getOrElse(tree.root.context.semanticType, () => "unknown")
      }`
    )
  );
  yield* _(Console.log(`Root node path: ${tree.root.path.join(".")}`));
  yield* _(Console.log(`Root node children count: ${tree.root.children.length}`));
  yield* _(Console.log(""));

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
  yield* _(Console.log(`Node map size: ${tree.nodeMap.size}`));
  yield* _(Console.log(`Path map size: ${tree.pathMap.size}`));
  
  // Log all paths in path map
  yield* _(Console.log("\nPaths in path map:"));
  tree.pathMap.forEach((node, path) => {
    console.log(`  ${path} -> ${
      Option.getOrElse(node.context.semanticType, () => "unknown")
    }`);
  });

  yield* _(Console.log("\n=== Debug completed ==="));
});

Effect.runPromise(debugASTTraversal).catch(console.error);
