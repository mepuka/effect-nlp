/**
 * Functional Annotation Parser Test - Using Effect's built-in types and Doc interface
 */

import { Schema, Effect, pipe, Console, SchemaAST, HashMap } from "effect";
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

// ============================================================================
// CREATE TEST SCHEMA WITH ANNOTATIONS
// ============================================================================

// Deep nested schema for testing
const AddressSchema = Schema.Struct({
  street: Schema.String.pipe(
    Schema.annotations({
      identifier: "street",
      title: "Street",
    })
  ),
  city: Schema.String.pipe(
    Schema.annotations({
      identifier: "city",
      title: "City",
    })
  ),
  country: Schema.String.pipe(
    Schema.annotations({
      identifier: "country",
      title: "Country",
    })
  ),
}).annotations({
  identifier: "AddressSchema",
  title: "Address",
  semanticType: "address",
});

const ContactSchema = Schema.Struct({
  phone: Schema.String.pipe(
    Schema.annotations({
      identifier: "phone",
      title: "Phone",
    })
  ),
  email: Schema.String.pipe(
    Schema.annotations({
      identifier: "email",
      title: "Email",
    })
  ),
}).annotations({
  identifier: "ContactSchema",
  title: "Contact",
  semanticType: "contact",
});

const PersonSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.annotations({
      identifier: "name",
      title: "Name",
    })
  ),
  age: Schema.Number.pipe(
    Schema.annotations({
      identifier: "age",
      title: "Age",
    })
  ),
  address: AddressSchema.pipe(
    Schema.annotations({
      identifier: "address",
      title: "Address",
    })
  ),
  contacts: Schema.Array(ContactSchema).pipe(
    Schema.annotations({
      identifier: "contacts",
      title: "Contacts",
    })
  ),
  tags: Schema.Array(Schema.String).pipe(
    Schema.annotations({
      identifier: "tags",
      title: "Tags",
    })
  ),
  metadata: Schema.Record({ key: Schema.String, value: Schema.String }).pipe(
    Schema.annotations({
      identifier: "metadata",
      title: "Metadata",
    })
  ),
}).annotations({
  identifier: "PersonSchema",
  title: "Person",
  semanticType: "person",
});

const OrganizationSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.annotations({
      identifier: "name",
      title: "Organization",
    })
  ),
  address: Schema.String.pipe(
    Schema.annotations({
      identifier: "address",
      title: "Address",
    })
  ),
  ceo: PersonSchema.pipe(
    Schema.annotations({
      identifier: "ceo",
      title: "CEO",
    })
  ),
  departments: Schema.Array(PersonSchema).pipe(
    Schema.annotations({
      identifier: "departments",
      title: "Departments",
    })
  ),
}).annotations({
  identifier: "OrganizationSchema",
  title: "Organization",
  semanticType: "organization",
});

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
  yield* Effect.all([
    Console.log("Context:"),
    Console.log(`  Identifier: ${context.identifier}`),
    Console.log(`  Title: ${context.title}`),
    Console.log(`  Description: ${context.description}`),
    Console.log(`  Documentation: ${context.documentation}`),
    Console.log(`  Semantic Type: ${context.semanticType}`),
    Console.log(`  Role: ${context.role}`),
    Console.log(`  Examples: ${context.examples.toString()}`),
    Console.log(`  Default: ${context.default}`),
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
