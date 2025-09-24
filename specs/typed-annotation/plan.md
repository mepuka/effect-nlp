# Implementation Plan — Typed Annotation Spec

## 1. Module Implementation
1. Create `src/Extraction/Annotations.ts`.
   - Define annotation symbols (`RoleAnnotationId`, `SemanticAnnotationId`, `ProvenanceAnnotationId`).
   - Implement annotation schemas and inferred types.
   - Provide encode/decode helpers for each schema.
   - Implement helper functions (`withCore`, `withRole`, `withSemantic`, `withProvenance`, `withMetadata`).
   - Implement typed getters (`getCore`, `getRole`, `getSemantic`, `getProvenance`, `getContext`).
   - Add inline documentation for each helper.

2. Update `src/Extraction/AnnotationParser.ts` to use typed getters.
   - Replace manual extraction of built-in annotations with `Annotations.getCore`, etc.
   - Adjust metadata collection to skip keys handled by typed helpers.

3. Update `src/Extraction/ASTTraverse.ts`.
   - Import `Annotations` and leverage `getContext` when building node context.
   - Ensure tree nodes expose typed context fields (core/role/semantic/provenance).

4. Update representative example schemas (e.g., `src/examples/annotation-parser-test.ts`, `src/examples/ast-traversal-corrected-test.ts`).
   - Replace manual annotations with helper functions.
   - Ensure examples compile and remain illustrative.

## 2. Testing
1. Create `test/unit/Annotations.test.ts` covering:
   - Encoding/decoding (apply helper, inspect AST, retrieve via getter).
   - Round-trip tests (input record -> attach -> retrieve -> deepEqual).
   - Absence handling (ensure getters return `Option.none`).

2. Update existing tests impacted by annotation changes (e.g., annotation parser tests) to expect typed structures.

## 3. Documentation
1. Add documentation snippet (README or module JSDoc) demonstrating annotation helpers and explaining how semantic metadata surfaces during extraction/prompt generation.

## 4. Validation & QA
1. Run `pnpm lint --fix` on updated files (Annotations module, modified extraction files, tests, docs).
2. Run `pnpm tsc` to ensure type safety.
3. Execute relevant tests (`pnpm test` targeting new/updated suites).

## 5. Post-Implementation
1. Review final API exports to ensure `Annotations` is exposed appropriately (and mark as part of public or internal API per decision).
2. Ensure branch up-to-date and ready for PR (no loose TODOs, check formatting).
