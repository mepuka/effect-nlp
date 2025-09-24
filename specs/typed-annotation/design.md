# Design — Typed Annotation Spec

## 1. Module Structure

```
src/
  Extraction/
    Annotations.ts        # typed annotation schemas + helpers + accessors
    AnnotationParser.ts   # updated to use typed annotations
    ASTTraverse.ts        # updated to rely on typed accessors
```

### 1.1 `src/Extraction/Annotations.ts`
- Export namespace `Annotations` with:
  - Schema definitions (`Core`, `Role`, `Semantic`, `Provenance`).
  - Types inferred via `Schema.Schema.Type<typeof ...>`.
  - Helper functions to apply annotations (`withCore`, `withRole`, `withSemantic`, `withProvenance`, `withMetadata` for combinations).
  - Typed getters (`getCore`, `getRole`, `getSemantic`, `getProvenance`).
- Implementation details:
  - Use `Schema.Struct` for definitions and `.pipe(Schema.brand(...))` where needed.
  - Encode helpers call `Schema.encodeSync` on the annotation schema, then spread onto `Schema.annotations` along with existing ones.
  - Maintain compatibility with Effect built-in annotations by reusing constants from `SchemaAST` (e.g., `SchemaAST.SemanticAnnotationId` if available) or define project-specific symbols via `Symbol.for("effect-nlp/annotations/..." )`.
  - Provide helper overloads for chaining with `pipe` (data-first / data-last pattern using `Function.dual` with arity ≥ 2).

### 1.2 Typed Getters
- Wrap `SchemaAST.getAnnotation` from Effect to return typed `Option` values using the annotation schemas' decoders.
- When decoding stored annotation objects, use `Schema.decodeUnknown` (effectful) producing `Effect` values; provide convenience wrappers that return `Option` with safe fallback (e.g., decode errors map to `Option.none`).
- Export a `Context` type bundling optional annotation types for convenience when building prompts.

### 1.3 Integration Updates
- `AnnotationParser.ts`:
  - Replace ad-hoc `Option.fromNullable(annotations[key])` with typed getters from `Annotations` module.
  - Ensure metadata HashMap only receives unknown keys not covered by typed annotations.
- `ASTTraverse.ts`:
  - Update context extraction to use typed getters, exposing strongly typed annotation context.
  - Provide helper for merging core, role, semantic, provenance into node context.
- Example schemas (`src/examples/...`):
  - Replace raw `.annotations({ ... })` with helper functions (e.g., `Schema.String.pipe(Annotations.withCore({ title: "Name" }))`).

## 2. Data Types & Symbols

### 2.1 Symbols
- Define constants for annotation keys to ensure consistent usage:
  - `const RoleAnnotationId = Symbol.for("effect-nlp/annotation/role");`
  - `const SemanticAnnotationId = Symbol.for("effect-nlp/annotation/semantic");`
  - `const ProvenanceAnnotationId = Symbol.for("effect-nlp/annotation/provenance");`
- For fields overlapping with Effect built-ins (`title`, `description`, etc.), rely on existing `SchemaAST` IDs rather than redefining.

### 2.2 Schema Definitions
- `Core`: `Schema.Struct({ title: Schema.optional(Schema.String), description: Schema.optional(Schema.String), examples: Schema.optional(Schema.Array(Schema.Unknown)), constraints: Schema.optional(Schema.Array(Schema.String)), documentation: Schema.optional(Schema.String) })`.
- `Role`: `Schema.Struct({ role: Schema.String })` (optionally brand Role string for future safety).
- `Semantic`: `Schema.Struct({ semanticType: Schema.String })`.
- `Provenance`: `Schema.Struct({ source: Schema.optional(Schema.String), comment: Schema.optional(Schema.String) })`.

## 3. Helper API Design

### 3.1 Application Helpers
- Example signature using `Function.dual` arity 2:
  ```ts
  const withSemantic = Function.dual<
    (semantic: Annotations.Semantic) => <A, I, R>(schema: Schema.Schema<A, I, R>) => Schema.Schema<A, I, R>,
    <A, I, R>(schema: Schema.Schema<A, I, R>, semantic: Annotations.Semantic) => Schema.Schema<A, I, R>
  >(2, (schema, semantic) => schema.annotations(Annotations.encodeSemantic(semantic)));
  ```
- `encodeSemantic` returns a record keyed by `SemanticAnnotationId` with a JSON-friendly value.
- Provide combined helper `withMetadata` that accepts partial structures and applies multiple annotation types in one call (useful for example schemas).

### 3.2 Retrieval Helpers
- Provide pure helpers returning `Option`:
  ```ts
  const getSemantic = (annotated: SchemaAST.Annotated): Option.Option<Annotations.Semantic> =>
    pipe(
      SchemaAST.getAnnotation<Record<string, unknown>>(SemanticAnnotationId)(annotated),
      Option.flatMap(Annotations.decodeSemanticOption)
    );
  ```
- `decodeSemanticOption` uses `Schema.decodeUnknownOption` (wrap decode in `Effect` then convert to `Option`).
- Aggregated context helper `getContext(annotated)` returns `{ core?: ..., role?: ..., semantic?: ..., provenance?: ... }` all inside `Option` for downstream use.

## 4. Refactor Plan

### 4.1 AnnotationParser Refactor
- Replace manual extraction logic with typed helpers.
- Ensure metadata HashMap excludes keys handled by typed annotations to avoid duplication.
- Update tests/examples to assert typed context contents.

### 4.2 AST Traversal Refactor
- Update context building to rely on `Annotations.getContext`.
- Provide strongly typed node context interface consumed by prompt/extraction pipeline.

### 4.3 Example Schema Updates
- Choose representative examples (Person, Organization) and refactor to use helper functions.
- Update documentation fragments to illustrate new API.

## 5. Testing Strategy

### 5.1 Unit Tests in `test/unit`
- New test file `Annotations.test.ts` covering:
  - Encoding/decoding for each annotation schema.
  - `with*` helper application and AST inspection (`schema.ast.annotations[Symbol]`).
  - Accessor functions returning expected `Option` values.
  - Round-trip (apply -> retrieve -> deepEqual input).

### 5.2 Regression Tests
- Update existing tests that inspect annotations to expect typed structures.
- Add test ensuring metadata HashMap in `AnnotationParser` excludes keys handled by typed helpers.

## 6. Risks & Mitigations
- **Symbol collisions**: mitigate by using unique `Symbol.for` keys namespaced with `effect-nlp`.
- **Decode failures**: ensure accessors handle decoding errors gracefully (log or treat as absence).
- **Compatibility with built-ins**: test combination of mixed annotations (Effect-provided + typed) on the same schema.

## 7. Documentation
- Update README section or add dedicated docs snippet describing annotation helpers and illustrating how semantic annotations influence extraction prompts.
- Inline doc comments in `Annotations.ts` referencing usage patterns for schema authors.
