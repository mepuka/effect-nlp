/**
 * AST Traversal Corrected Test - Proper usage of SchemaAST.getCompiler and Match API
 */

import { Schema, Effect, pipe, Console, Option } from "effect";
import { Annotations } from "../Extraction/Annotations.js";
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
const PersonSchema = pipe(
  Schema.Struct({
    name: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Full Name",
        description: "The person's full name",
        examples: ["John Smith", "Jane Doe"],
      })
    ),
    age: pipe(
      Schema.Number,
      Annotations.withCore({
        title: "Age",
        description: "Age in years",
        constraints: ["Must be positive", "Must be less than 150"],
      })
    ),
    email: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Email Address",
        description: "Primary email contact",
        examples: ["john@example.com", "jane@example.com"],
      })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Person",
      description: "A person with basic contact information",
      examples: ["John Smith", "Jane Doe"],
    },
    semantic: { semanticType: "entity" },
    role: { role: "data_model" },
  }),
  Schema.annotations({ identifier: "Person" })
);

// Address schema with annotations
const AddressSchema = pipe(
  Schema.Struct({
    street: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Street Address",
        description: "Street number and name",
      })
    ),
    city: pipe(
      Schema.String,
      Annotations.withCore({
        title: "City",
        description: "City name",
      })
    ),
    zipCode: pipe(
      Schema.String,
      Annotations.withCore({
        title: "ZIP Code",
        description: "Postal code",
      })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Address",
      description: "A physical mailing address",
    },
    semantic: { semanticType: "location" },
    role: { role: "data_model" },
  }),
  Schema.annotations({ identifier: "Address" })
);

// Organization schema with nested schemas
const OrganizationSchema = pipe(
  Schema.Struct({
    name: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Organization Name",
        description: "Legal name of the organization",
      })
    ),
    industry: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Industry",
        description: "Primary business sector",
      })
    ),
    founded: pipe(
      Schema.Number,
      Annotations.withCore({
        title: "Founded Year",
        description: "Year the organization was established",
      })
    ),
    ceo: pipe(
      PersonSchema,
      Annotations.withMetadata({
        core: {
          description: "Chief Executive Officer of the organization",
        },
        role: { role: "ceo_reference" },
      })
    ),
    headquarters: pipe(
      AddressSchema,
      Annotations.withMetadata({
        core: { description: "Primary business address" },
        role: { role: "headquarters_reference" },
      })
    ),
    employees: pipe(
      Schema.Array(PersonSchema),
      Annotations.withMetadata({
        core: { description: "List of all employees" },
        role: { role: "employee_list" },
      })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Organization",
      description:
        "A business organization with leadership, location, and staff",
      examples: ["Acme Corp", "TechStart Inc"],
      constraints: [
        "Must have at least one employee",
        "Founded year must be valid",
      ],
    },
    semantic: { semanticType: "entity" },
    role: { role: "aggregate_root" },
  }),
  Schema.annotations({ identifier: "Organization" })
);

// ============================================================================
// TEST FUNCTION
// ============================================================================

const testCorrectedASTTraversal = Effect.gen(function* () {
  yield* (Console.log("=== Corrected AST Traversal Test ===\n"));

  // Build the AST tree using proper SchemaAST compiler
  const tree = yield* (buildSchemaASTTree(OrganizationSchema));

  yield* (Console.log("✓ Schema AST Tree built successfully"));
  yield* (
    Console.log(
      `Root identifier: ${Option.getOrNull(tree.root.context.identifier)}`
    )
  );
  yield* (
    Console.log(
      `Root semantic type: ${
        Option.getOrElse(tree.root.context.semanticType, () => "unknown")
      }`
    )
  );
  yield* (Console.log(`Root children count: ${tree.root.children.length}`));
  yield* (Console.log(""));

  // Show the tree structure
  yield* (Console.log("=== TREE STRUCTURE ==="));
  tree.root.children.forEach((child, index) => {
    const childId = Option.getOrNull(child.context.identifier);
    const childRole = Option.getOrNull(child.context.annotations.role);
    const childType = Option.getOrElse(child.context.semanticType, () => "unknown");
    console.log(
      `${index + 1}. ${child.path.join(".")} - ${
        childId || "unnamed"
      } (${childType}) [${childRole}]`
    );

    // Show nested children
    child.children.forEach((grandchild, gIndex) => {
      const gcType = Option.getOrElse(grandchild.context.semanticType, () => "unknown");
      const gcRole = Option.getOrNull(grandchild.context.annotations.role);
      console.log(
        `   ${gIndex + 1}. ${grandchild.path.join(".")} - ${gcType} [${gcRole}]`
      );
    });
  });
  yield* (Console.log(""));

  // Test context extraction at specific paths
  yield* (Console.log("=== CONTEXT EXTRACTION ==="));
  const ceoContext = extractContextAtPath(tree, ["ceo"]);
  Option.match(ceoContext, {
    onNone: () => console.log("CEO context not found"),
    onSome: (context) => {
      console.log("CEO Context:");
      console.log(
        `  Identifier: ${Option.getOrNull(context.identifier) ?? ""}`
      );
      console.log(
        `  Role: ${
          Option.getOrNull(context.annotations.role)?.role ?? ""
        }`
      );
      console.log(
        `  Semantic Type: ${Option.getOrElse(context.semanticType, () => "")}`
      );
      console.log(`  Description: ${Option.getOrNull(context.description)}`);
    },
  });
  yield* (Console.log(""));

  // Find nodes by semantic type
  yield* (Console.log("=== NODES BY SEMANTIC TYPE ==="));
  const entityNodes = findNodesBySemanticType(tree, "entity");
  console.log(`Found ${entityNodes.length} entity nodes:`);
  entityNodes.forEach((node, index) => {
    const id = Option.getOrNull(node.context.identifier);
    console.log(`  ${index + 1}. ${node.path.join(".")} - ${id}`);
  });
  yield* (Console.log(""));

  // Generate prompts for different parts of the schema
  yield* (Console.log("=== PROMPT GENERATION ==="));

  // Full schema prompt
  const fullPrompt = generateSchemaPrompt(tree);
  yield* (Console.log("Full Schema Prompt:"));
  yield* (Console.log(fullPrompt));
  yield* (Console.log(""));

  // CEO field prompt
  const ceoPrompt = generateSchemaPrompt(tree, ["ceo"]);
  yield* (Console.log("CEO Field Prompt:"));
  yield* (Console.log(ceoPrompt));
  yield* (Console.log(""));

  yield* (Console.log("=== Test completed successfully ==="));
});

// ============================================================================
// RUN THE TEST
// ============================================================================

Effect.runPromise(testCorrectedASTTraversal).catch(console.error);
