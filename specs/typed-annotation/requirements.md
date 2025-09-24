# Requirements — Typed Annotation Spec

## 1. Functional Requirements

### 1.1 Annotation Schemas
- Provide reusable schema definitions for core annotation categories tailored to the entity/extraction workflow:
  - `CoreAnnotations`: optional `title`, `description`, `examples`, `constraints`, `documentation`.
  - `RoleAnnotation`: required `role` string.
  - `SemanticAnnotation`: required `semanticType` string.
  - `ProvenanceAnnotation`: optional `source` and `comment` strings.
- Export branded types and helper codecs for each annotation schema using Effect Schema primitives.

### 1.2 Entity-Focused Helper APIs
- Provide helper functions (e.g., `withCoreAnnotations`, `withSemanticType`, `withEntityRole`, `withProvenance`) that accept typed annotation records, encode them with the schema definitions, and delegate to `Schema.annotations`.
- Helpers MUST compose with `pipe` and preserve the original schema’s typing.
- Helpers SHALL never shadow or replace Effect’s native annotation functions; they only encode our typed structures before applying them.
- Where appropriate, provide variants specialized for entity schemas (e.g., convenience helpers combining role + semantic type).

### 1.3 Typed Accessors for Schema AST
- Implement accessor functions (`getCoreAnnotations`, `getSemanticAnnotation`, `getRoleAnnotation`, `getProvenanceAnnotation`) returning `Option`-wrapped typed values when reading from `SchemaAST.Annotated` nodes.
- Accessors MUST rely on Effect’s `SchemaAST.getAnnotation` with the proper symbol keys to stay compatible with upstream updates.
- Retrieval MUST be type-safe (no `as any`) and support defaulting when annotations are absent.

### 1.4 Integration with Existing Modules
- Refactor `AnnotationParser` and AST traversal utilities to consume the new typed helpers for both attaching and retrieving annotations.
- Update representative example schemas to demonstrate the helper functions.
- Confirm compatibility with existing annotations in the repository (Effect built-ins such as identifier/title/description remain usable alongside the new helpers).

### 1.5 Testing
- Unit tests SHALL validate:
  - Encoding/decoding of each annotation schema.
  - Helper functions apply annotations and produce AST nodes containing encoded metadata.
  - Accessor functions retrieve annotations accurately and return `Option.none` when missing.
  - Round-trip scenarios (apply -> retrieve -> deepEqual) for representative schemas.
- Tests MUST rely only on public Effect APIs.

### 1.6 Documentation
- Update README or module-level documentation to introduce the typed annotation helpers and show usage patterns during schema definition.
- Include at least one example explaining how semantic annotations can be surfaced during prompt construction or extraction logic.

## 2. Non-Functional Requirements
- Maintain strict TypeScript type safety (no unchecked casts) in new modules and refactored code.
- Ensure all touched files pass linting (`pnpm lint --fix <file>`).
- Favor immutable, pure operations; avoid mutating AST nodes directly.
- Keep compatibility with the project’s current Effect version and annotation APIs.

## 3. Constraints & Assumptions
- Assume Effect’s annotation symbols and APIs remain stable for this feature.
- No new third-party dependencies.
- Multiple annotations may coexist on a schema; helpers must merge with existing annotations without loss.
- Annotations may be optional; absence must not cause runtime failures.

## 4. Acceptance Validation
- Feature is complete when acceptance criteria in `instructions.md` are met, including module implementation, refactors, tests, and documentation.
- Reviewers can verify by inspecting `src/Extraction/Annotations.ts`, updated modules, and the associated test suite.
