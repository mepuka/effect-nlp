# Requirements — Schema AST MVP

## 1. Functional Requirements

### 1.1 Immutable Schema AST Tree
- Provide a new typed representation `SchemaAstTree` with nodes containing:
  - `path: ReadonlyArray<PropertyKey>`
  - `ast: SchemaAST.AST`
  - `annotations: SchemaAST.Annotations`
  - `context: Annotations.Context`
  - `children: ReadonlyArray<SchemaAstNode>`
- Tree construction MUST be pure and avoid mutating existing AST structures.

### 1.2 Stack-Safe Traversal Utilities
- Implement `buildSchemaAstTree(schema)` returning a fully materialized tree.
- Implement `foldSchemaAst(node, algebra)` or equivalent to traverse nodes using a user-supplied algebra.
- Implement `extractLeaves(tree)` (or similar) returning typed leaf information (path, context, AST fragment).
- Traversal utilities MUST be stack-safe (e.g., iterative loops, tail-recursive Effect, or stream-based approach). Large schemas must not overflow the call stack.

### 1.3 Annotation Integration
- Integrate `Annotations` module so that every node context includes typed annotation data (core/role/semantic/provenance).
- Replace direct string-based annotation lookups with typed helper usage.
- Remove residual `as any` casts in AST traversal and related modules.

### 1.4 Optional Utility Injection
- Where sandbox utilities (e.g., `wink-nlp-utils`) are used in touched modules, ensure they are accessed via layers/providers rather than top-level requires, maintaining compatibility with existing infrastructure.

### 1.5 Public API & Compatibility
- Expose the new traversal helpers through the appropriate public surface (e.g., `src/Extraction/index.ts` or central barrel) as decided during implementation.
- Ensure existing consumers of `ASTTraverse` continue to function (update call sites accordingly).

### 1.6 Testing
- Unit tests shall cover:
  - Tree construction correctness (node paths, contexts, children counts) with sample schemas.
  - Stack-safety by traversing a deep schema (e.g., nested structs) and ensuring no overflow.
  - Fold/extract helpers returning expected results (e.g., collecting titles, semantic roles).
- Regression tests on existing functionality (annotation parsing, example traversals) to ensure behaviour remains consistent.

## 2. Non-Functional Requirements
- Maintain strict TypeScript type safety; no unchecked casts.
- Ensure all touched files pass linting (`pnpm lint --fix <file>`).
- Preserve existing performance characteristics; tree construction should be efficient.
- Follow repository coding standards (Effect-first patterns, immutability, pipe-friendly functions).

## 3. Constraints & Assumptions
- Assume Effect Schema/Schema AST APIs remain stable for this feature.
- No new external dependencies.
- Annotations have already been refactored (dependency on typed annotations feature).
- Some existing example/demo code may remain verbose; only update what’s necessary to validate traversal.

## 4. Acceptance Validation
- Feature deemed complete when:
  - `SchemaAstTree` and traversal utilities exist and are tested.
  - Touched modules no longer use `Function.dual(1, ...)` or `as any` in core logic.
  - Optional utilities are injectable (where relevant in modified code).
  - Tests (unit + regression) and lint/type checks pass.
  - Documentation reflects the new traversal API.
