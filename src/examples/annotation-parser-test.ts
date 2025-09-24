/**
 * Functional Annotation Parser Test - Using Effect's built-in types and Doc interface
 */

import { Schema, Effect, pipe, Console, SchemaAST, HashMap, Option } from "effect";
import { Doc } from "@effect/printer";
import {
  extractSchemaContext,
  contextToDoc,
  schemaToDoc,
  minimalFormatOptions,
  annotationsToDoc,
  annotationsToDocumentation,
  hasBuiltInAnnotation,
  getBuiltInAnnotation,
  filterAnnotations,
  createAnnotatedSchema,
} from "../Extraction/AnnotationParser.js";
import { Annotations } from "../Extraction/Annotations.js";

// ============================================================================
// CREATE TEST SCHEMA WITH ANNOTATIONS
// ============================================================================

// Deep nested schema for testing
const AddressSchema = pipe(
  Schema.Struct({
    street: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Street",
      }),
      Schema.annotations({ identifier: "street" })
    ),
    city: pipe(
      Schema.String,
      Annotations.withCore({
        title: "City",
      }),
      Schema.annotations({ identifier: "city" })
    ),
    country: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Country",
      }),
      Schema.annotations({ identifier: "country" })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Address",
    },
    semantic: { semanticType: "address" },
  }),
  Schema.annotations({ identifier: "AddressSchema" })
);

const ContactSchema = pipe(
  Schema.Struct({
    phone: pipe(
      Schema.String,
      Annotations.withCore({ title: "Phone" }),
      Schema.annotations({ identifier: "phone" })
    ),
    email: pipe(
      Schema.String,
      Annotations.withCore({ title: "Email" }),
      Schema.annotations({ identifier: "email" })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Contact",
    },
    semantic: { semanticType: "contact" },
  }),
  Schema.annotations({ identifier: "ContactSchema" })
);

const PersonSchema = pipe(
  Schema.Struct({
    name: pipe(
      Schema.String,
      Annotations.withCore({ title: "Name" }),
      Schema.annotations({ identifier: "name" })
    ),
    age: pipe(
      Schema.Number,
      Annotations.withCore({ title: "Age" }),
      Schema.annotations({ identifier: "age" })
    ),
    address: pipe(
      AddressSchema,
      Annotations.withMetadata({
        core: { title: "Address" },
      }),
      Schema.annotations({ identifier: "address" })
    ),
    contacts: pipe(
      Schema.Array(ContactSchema),
      Annotations.withMetadata({
        core: { title: "Contacts" },
      }),
      Schema.annotations({ identifier: "contacts" })
    ),
    tags: pipe(
      Schema.Array(Schema.String),
      Annotations.withMetadata({
        core: { title: "Tags" },
      }),
      Schema.annotations({ identifier: "tags" })
    ),
    metadata: pipe(
      Schema.Record({ key: Schema.String, value: Schema.String }),
      Annotations.withMetadata({
        core: { title: "Metadata" },
      }),
      Schema.annotations({ identifier: "metadata" })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Person",
    },
    semantic: { semanticType: "person" },
  }),
  Schema.annotations({ identifier: "PersonSchema" })
);

const OrganizationSchema = pipe(
  Schema.Struct({
    name: pipe(
      Schema.String,
      Annotations.withCore({ title: "Organization" }),
      Schema.annotations({ identifier: "name" })
    ),
    address: pipe(
      Schema.String,
      Annotations.withCore({ title: "Address" }),
      Schema.annotations({ identifier: "address" })
    ),
    ceo: pipe(
      PersonSchema,
      Annotations.withMetadata({
        core: { title: "CEO" },
      }),
      Schema.annotations({ identifier: "ceo" })
    ),
    departments: pipe(
      Schema.Array(PersonSchema),
      Annotations.withMetadata({
        core: { title: "Departments" },
      }),
      Schema.annotations({ identifier: "departments" })
    ),
  }),
  Annotations.withMetadata({
    core: {
      title: "Organization",
    },
    semantic: { semanticType: "organization" },
  }),
  Schema.annotations({ identifier: "OrganizationSchema" })
);

// ============================================================================
// TEST FUNCTION
// ============================================================================

const testFunctionalAnnotationParser = Effect.gen(function* () {
  yield* Console.log("=== Functional Annotation Parser Test ===\n");

  // Get the schema's annotations
  const annotations = OrganizationSchema.ast.annotations;

  // Test 1: Extract schema context
  yield* Console.log("1. Schema Context Extraction:");
  const context = extractSchemaContext(annotations);
  const format = <A>(option: Option.Option<A>, toString: (value: A) => string = String) =>
    Option.match(option, {
      onNone: () => "None",
      onSome: (value) => toString(value),
    });

  yield* Effect.all([
    Console.log("Context:"),
    Console.log(`  Identifier: ${format(context.identifier)}`),
    Console.log(`  Title: ${format(context.title)}`),
    Console.log(`  Description: ${format(context.description)}`),
    Console.log(`  Documentation: ${format(context.documentation)}`),
    Console.log(
      `  Semantic Type: ${format(
        context.semantic,
        (semantic) => semantic.semanticType
      )}`
    ),
    Console.log(`  Role: ${format(context.role, (role) => role.role)}`),
    Console.log(
      `  Examples: ${format(context.examples, (examples) => JSON.stringify(examples))}`
    ),
    Console.log(
      `  Default: ${format(context.default, (value) => JSON.stringify(value))}`
    ),
    Console.log(`  Metadata size: ${HashMap.size(context.metadata)}`),
  ]);
  yield* Console.log("");

  // Test 2: Create Doc from context
  yield* Console.log("2. Doc Generation from Context:");
  const contextDoc = contextToDoc(context);
  const contextString = Doc.render(contextDoc, { style: "pretty" });
  yield* Console.log("Context Doc:");
  yield* Console.log(contextString);
  yield* Console.log("");

  // Test 2.5: Generate Doc from actual schema structure
  yield* Console.log("2.5. Schema Structure with Relationships:");
  const schemaDoc = schemaToDoc(OrganizationSchema);
  const schemaString = Doc.render(schemaDoc, { style: "pretty" });
  yield* Console.log("Schema Tree:");
  yield* Console.log(schemaString);
  yield* Console.log("");

  // Test 2.6: Generate minimal Doc from schema structure
  yield* Console.log("2.6. Minimal Schema Structure:");
  const minimalSchemaDoc = schemaToDoc(
    OrganizationSchema,
    minimalFormatOptions
  );
  const minimalSchemaString = Doc.render(minimalSchemaDoc, { style: "pretty" });
  yield* Console.log("Minimal Schema Tree:");
  yield* Console.log(minimalSchemaString);
  yield* Console.log("");

  // Test 3: Create Doc from raw annotations
  yield* Console.log("3. Doc Generation from Raw Annotations:");
  const annotationsDoc = annotationsToDoc(annotations);
  const annotationsString = Doc.render(annotationsDoc, { style: "pretty" });
  yield* Console.log("Annotations Doc:");
  yield* Console.log(annotationsString);
  yield* Console.log("");

  // Test 4: Pipeable transform - annotations to documentation
  yield* Console.log("4. Pipeable Transform - Annotations to Documentation:");
  const documentation = annotationsToDocumentation(annotations);
  const docString = Doc.render(documentation, { style: "pretty" });
  yield* Console.log("Documentation:");
  yield* Console.log(docString);
  yield* Console.log("");

  // Test 5: Built-in annotation utilities
  yield* Console.log("5. Built-in Annotation Utilities:");

  // Check if built-in annotations exist
  const hasTitle = hasBuiltInAnnotation(
    annotations,
    SchemaAST.TitleAnnotationId
  );
  const hasIdentifier = hasBuiltInAnnotation(
    annotations,
    SchemaAST.IdentifierAnnotationId
  );
  console.log(`Has title: ${hasTitle}`);
  console.log(`Has identifier: ${hasIdentifier}`);

  // Get built-in annotation values
  const title = getBuiltInAnnotation<SchemaAST.TitleAnnotation>(
    annotations,
    SchemaAST.TitleAnnotationId
  );
  const identifier = getBuiltInAnnotation<SchemaAST.IdentifierAnnotation>(
    annotations,
    SchemaAST.IdentifierAnnotationId
  );
  console.log(`Title: ${title}`);
  console.log(`Identifier: ${identifier}`);
  yield* Console.log("");

  // Test 6: Filter annotations
  yield* Console.log("6. Filter Annotations:");
  const stringAnnotations = filterAnnotations(
    annotations,
    (key, value) => typeof value === "string"
  );
  console.log("String annotations:", Object.keys(stringAnnotations));
  yield* Console.log("");

  // Test 7: Complex pipeable example
  yield* Console.log("7. Complex Pipeable Example:");
  const complexResult = pipe(
    annotations,
    (ann) => extractSchemaContext(ann),
    (ctx) => contextToDoc(ctx),
    (doc) => Doc.render(doc, { style: "pretty" })
  );
  yield* Console.log("Complex pipeline result:");
  yield* Console.log(complexResult);
  yield* Console.log("");

  // Test 8: Create annotated schema
  yield* Console.log("8. Create Annotated Schema:");
  const annotatedSchema = createAnnotatedSchema(Schema.String, {
    identifier: "AnnotatedString",
    title: "Annotated String",
    description: "A string with annotations",
    examples: ["example1", "example2"],
  });
  console.log("Created annotated schema:", annotatedSchema.ast.annotations);
  yield* Console.log("");

  yield* Console.log("=== Test completed successfully ===");
});

// ============================================================================
// RUN THE TEST
// ============================================================================

Effect.runPromise(testFunctionalAnnotationParser).catch(console.error);
