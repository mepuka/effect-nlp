/**
 * AST Traversal Corrected Test - Proper usage of SchemaAST.getCompiler and Match API
 */

import { Schema, Effect, pipe, Console, Option, HashMap } from "effect";
import {
  buildSchemaASTTree,
  generateSchemaPrompt,
  extractContextAtPath,
  findNodesBySemanticType,
} from "../Extraction/ASTTraverse.js";

// ============================================================================
// CREATE ANNOTATED SCHEMAS
// ============================================================================

// Person schema with proper annotations
const PersonSchema = Schema.Struct({
  name: Schema.String.annotations({
    title: "Full Name",
    description: "The person's full name",
    examples: ["John Smith", "Jane Doe"],
  }),
  age: Schema.Number.annotations({
    title: "Age",
    description: "Age in years",
    constraints: ["Must be positive", "Must be less than 150"],
  }),
  email: Schema.String.annotations({
    title: "Email Address",
    description: "Primary email contact",
    examples: ["john@example.com", "jane@example.com"],
  }),
}).annotations({
  identifier: "Person",
  title: "Person",
  description: "A person with basic contact information",
  semanticType: "entity",
  role: "data_model",
});

// Address schema with annotations
const AddressSchema = Schema.Struct({
  street: Schema.String.annotations({
    title: "Street Address",
    description: "Street number and name",
  }),
  city: Schema.String.annotations({
    title: "City",
    description: "City name",
  }),
  zipCode: Schema.String.annotations({
    title: "ZIP Code",
    description: "Postal code",
  }),
}).annotations({
  identifier: "Address",
  title: "Address",
  description: "A physical mailing address",
  semanticType: "location",
  role: "data_model",
});

// Organization schema with nested schemas
const OrganizationSchema = Schema.Struct({
  name: Schema.String.annotations({
    title: "Organization Name",
    description: "Legal name of the organization",
  }),
  industry: Schema.String.annotations({
    title: "Industry",
    description: "Primary business sector",
  }),
  founded: Schema.Number.annotations({
    title: "Founded Year",
    description: "Year the organization was established",
  }),
  ceo: PersonSchema.annotations({
    role: "ceo_reference",
    description: "Chief Executive Officer of the organization",
  }),
  headquarters: AddressSchema.annotations({
    role: "headquarters_reference",
    description: "Primary business address",
  }),
  employees: Schema.Array(PersonSchema).annotations({
    role: "employee_list",
    description: "List of all employees",
  }),
}).annotations({
  identifier: "Organization",
  title: "Organization",
  description: "A business organization with leadership, location, and staff",
  semanticType: "entity",
  role: "aggregate_root",
  examples: ["Acme Corp", "TechStart Inc"],
  constraints: [
    "Must have at least one employee",
    "Founded year must be valid",
  ],
});

// ============================================================================
// TEST FUNCTION
// ============================================================================

const testCorrectedASTTraversal = Effect.gen(function* (_) {
  yield* _(Console.log("=== Corrected AST Traversal Test ===\n"));

  // Build the AST tree using proper SchemaAST compiler
  const tree = yield* _(buildSchemaASTTree(OrganizationSchema));

  yield* _(Console.log("✓ Schema AST Tree built successfully"));
  yield* _(
    Console.log(
      `Root identifier: ${Option.getOrNull(tree.root.context.identifier)}`
    )
  );
  yield* _(
    Console.log(
      `Root semantic type: ${Option.getOrNull(tree.root.context.semanticType)}`
    )
  );
  yield* _(Console.log(`Root children count: ${tree.root.children.length}`));
  yield* _(Console.log(""));

  // Show the tree structure
  yield* _(Console.log("=== TREE STRUCTURE ==="));
  tree.root.children.forEach((child, index) => {
    const childId = Option.getOrNull(child.context.identifier);
    const childRole = Option.getOrNull(child.context.role);
    const childType = Option.getOrNull(child.context.semanticType);
    console.log(
      `${index + 1}. ${child.path.join(".")} - ${
        childId || "unnamed"
      } (${childType}) [${childRole}]`
    );

    // Show nested children
    child.children.forEach((grandchild, gIndex) => {
      const gcType = Option.getOrNull(grandchild.context.semanticType);
      const gcRole = Option.getOrNull(grandchild.context.role);
      console.log(
        `   ${gIndex + 1}. ${grandchild.path.join(".")} - ${gcType} [${gcRole}]`
      );
    });
  });
  yield* _(Console.log(""));

  // Test context extraction at specific paths
  yield* _(Console.log("=== CONTEXT EXTRACTION ==="));
  const ceoContext = extractContextAtPath(tree, ["ceo"]);
  Option.match(ceoContext, {
    onNone: () => console.log("CEO context not found"),
    onSome: (context) => {
      console.log("CEO Context:");
      console.log(`  Identifier: ${Option.getOrNull(context.identifier)}`);
      console.log(`  Role: ${Option.getOrNull(context.role)}`);
      console.log(`  Semantic Type: ${Option.getOrNull(context.semanticType)}`);
      console.log(`  Description: ${Option.getOrNull(context.description)}`);
    },
  });
  yield* _(Console.log(""));

  // Find nodes by semantic type
  yield* _(Console.log("=== NODES BY SEMANTIC TYPE ==="));
  const entityNodes = findNodesBySemanticType(tree, "entity");
  console.log(`Found ${entityNodes.length} entity nodes:`);
  entityNodes.forEach((node, index) => {
    const id = Option.getOrNull(node.context.identifier);
    console.log(`  ${index + 1}. ${node.path.join(".")} - ${id}`);
  });
  yield* _(Console.log(""));

  // Generate prompts for different parts of the schema
  yield* _(Console.log("=== PROMPT GENERATION ==="));

  // Full schema prompt
  const fullPrompt = generateSchemaPrompt(tree);
  yield* _(Console.log("Full Schema Prompt:"));
  yield* _(Console.log(fullPrompt));
  yield* _(Console.log(""));

  // CEO field prompt
  const ceoPrompt = generateSchemaPrompt(tree, ["ceo"]);
  yield* _(Console.log("CEO Field Prompt:"));
  yield* _(Console.log(ceoPrompt));
  yield* _(Console.log(""));

  yield* _(Console.log("=== Test completed successfully ==="));
});

// ============================================================================
// RUN THE TEST
// ============================================================================

Effect.runPromise(testCorrectedASTTraversal).catch(console.error);
