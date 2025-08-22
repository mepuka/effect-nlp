# Effect-NLP Extraction System

## Overview

This system implements a mathematically rigorous, type-driven approach to NLP extraction using **Schema AST Traversal** and **Algebraic Property Graphs (APG)** with Effect-TS. The core innovation is treating Effect Schema ASTs as the foundational algebra for modeling extraction tasks.

## Core Mathematical Model: Schema AST as Extraction Algebra

### Schema AST Traversal Foundation

The system uses Effect Schema's AST (Abstract Syntax Tree) as the primary algebra for extraction modeling:

```typescript
// Schema AST as the base algebra
SchemaAST.AST = TypeLiteral | Declaration | Union | Refinement | Transformation | ...

// AST Traversal with Context Extraction
SchemaAST.getCompiler(Match<SchemaContext>) → SchemaContext
```

### Category APG (Algebraic Property Graph)

- **Objects**: `ExtractionTask` instances (well-formed extraction schemas)
- **Morphisms**: `SchemaPatch` transformations (composable schema evolution)
- **Identity**: Empty patch list
- **Composition**: Sequential patch application via `Effect.reduce`
- **Base Algebra**: Schema AST traversal with annotation extraction

### Category PAT (Pattern Space)

- **Objects**: `PatternContainer` instances (executable NLP patterns)
- **Morphisms**: `PatternPatch` transformations
- **Identity**: No-op pattern update
- **Composition**: Pattern patch sequencing

### The Functor F: SchemaAST → PAT

```typescript
F: SchemaAST.AST → PatternContainer
```

The functor `schemaASTToPatternContainer` preserves structure:

- `TypeLiteral` nodes generate pattern atoms
- `Declaration` nodes create named pattern containers
- `Refinement` nodes (arrays) generate collection patterns
- Schema composition maps to pattern composition

## Implementation Architecture: Schema AST-Driven

### Schema AST Traversal Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    Schema AST Traversal                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ TypeLiteral  │  │ Declaration  │  │  Refinement  │      │
│  │              │  │              │  │              │      │
│  │ Properties:  │  │ Named Schema │  │  Array/Union │      │
│  │ - name       │  │ - Person     │  │  - [Contact] │      │
│  │ - age        │  │ - Company    │  │  - String[]  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                 │              │
│         └──────────────────┼─────────────────┘              │
│                            │                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Annotation Extraction                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Identifier   │  │ Title        │  │ Description  │  │ │
│  │  │ - "ceo"      │  │ - "CEO"      │  │ - "Leader"   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ SchemaContext
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      ExtractionTask                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Concept    │  │   Concept    │  │  Predicate   │      │
│  │              │  │              │  │              │      │
│  │ Properties:  │  │ Properties:  │  │  Subject ────┼──┐   │
│  │ - name       │  │ - name       │  │  Object  ────┼──┼─┐ │
│  │ - age        │  │ - industry   │  │              │  │ │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │ │ │
│         ▲                  ▲                 │           │ │ │
│         └──────────────────┼─────────────────┘           │ │ │
│                            └─────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ SchemaPatch
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     PatternContainer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PatternAtom  │  │ PatternAtom  │  │ SemanticAtom │      │
│  │              │  │              │  │              │      │
│  │ sourcePath:  │  │ sourcePath:  │  │  content:    │      │
│  │ ["name"]     │  │ ["industry"] │  │  "Company"   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                                 │
│                            ▼                                 │
│                     WinkNLP Patterns                         │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Schema AST as Foundation Algebra

```typescript
// Schema AST traversal with context extraction
const schemaContext = SchemaAST.getCompiler(createASTMatch())(schema.ast, []);

// AST-driven pattern generation
SchemaAST.AST → extractContextFromAST → SchemaContext → PatternContainer
```

The Schema AST serves as the foundational algebra, with each node type mapping to specific extraction semantics.

### 2. Annotation-Driven Context Extraction

```typescript
export interface SchemaContext {
  readonly identifier: Option.Option<string>;
  readonly title: Option.Option<string>;
  readonly description: Option.Option<string>;
  readonly semanticType: Option.Option<string>;
  readonly role: Option.Option<string>;
  readonly metadata: HashMap.HashMap<string, unknown>;
}
```

Annotations provide semantic context that drives pattern generation and extraction logic.

### 3. Functional Schema Visualization

```typescript
// Beautiful hierarchical tree representation
export const schemaToDoc = (
  schema: Schema.Schema<any, any, any>,
  options: SchemaFormatOptions = defaultFormatOptions
): Doc.Doc<never>
```

Using Effect's Doc interface for consistent, aesthetic schema visualization with configurable formatting options.

### 4. Patch-Based Evolution

```typescript
SchemaPatch = AddConcept | AddPredicate | UpdateProperty | Remove*
```

Patches are:

- **Serializable**: Can be stored as JSON
- **Composable**: Form a monoid with identity
- **Reversible**: Some patches have inverses
- **Auditable**: Complete history preserved

### 5. AST-Driven Pattern Generation

```typescript
// AST traversal with pattern extraction
SchemaAST.AST → extractPatternsFromAST → PatternAtom[]
```

We leverage Effect Schema's AST to automatically generate pattern atoms from schema structure.

## Usage Examples

### Schema AST Traversal and Context Extraction

```typescript
// Define a schema with rich annotations
const PersonSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.annotations({
      identifier: "name",
      title: "Name",
      description: "The person's full name",
    })
  ),
  age: Schema.Number.pipe(
    Schema.annotations({
      identifier: "age",
      title: "Age",
      description: "The person's age in years",
    })
  ),
  address: AddressSchema.pipe(
    Schema.annotations({
      identifier: "address",
      title: "Address",
      description: "The person's address",
    })
  ),
}).annotations({
  identifier: "PersonSchema",
  title: "Person",
  semanticType: "person",
});

// Extract context from schema AST
const context = extractSchemaContext(PersonSchema.ast.annotations);

// Generate beautiful schema visualization
const schemaDoc = schemaToDoc(PersonSchema, minimalFormatOptions);
const schemaString = Doc.render(schemaDoc, { style: "pretty" });
console.log(schemaString);
// Output:
// Person:person
// ├─name:String
// ├─age:Number
// └─address:Address
```

### Schema Evolution via Patches

```typescript
const evolve = Effect.gen(function* () {
  const initial = new ExtractionTask({
    /* ... */
  });

  const patches = [
    SchemaPatch.AddConcept({ concept: personConcept }),
    SchemaPatch.AddConcept({ concept: companyConcept }),
    SchemaPatch.AddPredicate({
      predicate: worksAtPredicate,
    }),
  ];

  const final = yield* applyPatches(initial, patches);
  return final;
});
```

### AST-Driven Pattern Generation

```typescript
// Generate patterns directly from schema AST
const patterns = schemaToPatternContainer(
  PersonSchema,
  ConceptId.make("person-1")
);
// Automatically generates pattern atoms from schema AST traversal
```

### Deep Nested Schema Visualization

```typescript
// Complex schema with arrays and nested objects
const OrganizationSchema = Schema.Struct({
  name: Schema.String,
  ceo: PersonSchema,
  departments: Schema.Array(PersonSchema),
  metadata: Schema.Record(Schema.String, Schema.String),
}).annotations({
  identifier: "OrganizationSchema",
  title: "Organization",
  semanticType: "organization",
});

// Visualize with different formatting options
const fullDoc = schemaToDoc(OrganizationSchema, defaultFormatOptions);
const minimalDoc = schemaToDoc(OrganizationSchema, minimalFormatOptions);
```

## Mathematical Properties

### Schema AST Algebra Properties

1. **AST Traversal Identity**: `SchemaAST.getCompiler(id)(ast, []) = ast`
2. **Context Extraction Monoid**: `extractContext(a) ⊕ extractContext(b) = extractContext(a ⊕ b)`
3. **Functor Laws for Schema → Pattern**:
   - `F(id) = id`
   - `F(g ∘ f) = F(g) ∘ F(f)`

### Verified Properties

1. **Patch Identity**: `applyPatches(task, []) = task`
2. **Patch Associativity**: `(p1 ∘ p2) ∘ p3 = p1 ∘ (p2 ∘ p3)`
3. **Schema AST Composition**: Schema composition preserves AST structure

### Type Safety Guarantees

- Branded types prevent invalid ID references
- Schema validation at compile time
- Effect error channel preserves all error context
- AST traversal preserves type safety through SchemaAST.Match

## Integration Points

### Schema AST Traversal Service

```typescript
interface SchemaASTService {
  traverse(schema: Schema.Schema<any, any, any>): Effect<SchemaContext>;
  extractAnnotations(ast: SchemaAST.AST): Effect<SchemaAST.Annotations>;
  generateVisualization(
    schema: Schema.Schema<any, any, any>,
    options: SchemaFormatOptions
  ): Effect<string>;
}
```

### LLM Service

```typescript
interface LLMService {
  generatePatterns(description: string, examples: string[]): Effect<string[]>;
  generateSchemaPatches(
    task: ExtractionTask,
    goal: string
  ): Effect<SchemaPatch[]>;
  validateExtraction(
    extracted: ExtractedProperty,
    expected: string
  ): Effect<boolean>;
  enhanceSchemaAnnotations(
    schema: Schema.Schema<any, any, any>
  ): Effect<Schema.Schema<any, any, any>>;
}
```

### Pattern Executor

```typescript
interface PatternExecutor {
  compile(container: PatternContainer): Effect<CompiledPatternContainer>;
  execute(
    compiled: CompiledPatternContainer,
    doc: Document
  ): Effect<ExtractedProperty[]>;
  generateFromSchemaAST(
    schema: Schema.Schema<any, any, any>
  ): Effect<PatternContainer>;
}
```

## Next Steps

1. **Enhance Schema AST Traversal**:

   - Add support for more AST node types (Union, Tuple, etc.)
   - Implement recursive schema resolution
   - Add circular reference detection

2. **Advanced Schema Visualization**:

   - Interactive schema browser
   - Real-time annotation editing
   - Schema diff visualization

3. **Integrate with WinkNLP**: Replace mock pattern executor
4. **Connect to LLM**: Implement actual pattern generation
5. **Add Persistence**: Store patch history and patterns
6. **Implement Feedback Loop**: Refine patterns based on results
7. **Build UI**: Create interface for schema evolution

## Testing

Run the test suite:

```bash
npx tsx src/Extraction/tests.ts
npx tsx src/examples/annotation-parser-test.ts
```

This will verify:

- Schema AST traversal and context extraction
- Type construction and validation
- Patch application and composition
- Schema to pattern transformation
- Complex schema building with deep nesting
- Mathematical properties and functor laws
- Schema visualization with different formatting options

## Conclusion

This implementation provides:

- **Mathematical Rigor**: Category theory foundations with Schema AST as the base algebra
- **Type Safety**: Effect Schema throughout with AST traversal preserving type safety
- **Practical Usability**: Simple API, immediate iteration, beautiful schema visualization
- **Extensibility**: Clean integration points for LLM and pattern execution
- **Auditability**: Complete transformation history through patch-based evolution

The system maintains the elegance of categorical abstractions while remaining grounded in practical NLP engineering needs. The **Schema AST traversal approach** provides a mathematically sound foundation for modeling extraction tasks as algebraic property graphs, with rich annotation-driven context extraction enabling sophisticated pattern generation and schema manipulation.
