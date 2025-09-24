# Design — Schema AST MVP

## 1. Module Layout

```
src/
  Extraction/
    Annotations.ts          # existing typed annotation helpers
    ASTTraverse.ts          # will be refactored to use SchemaAstTree
    SchemaAstTree.ts        # new module: tree types, builders, folds, utilities
    index.ts (if present)   # export new traversal API as needed
```

The core work happens in the new `SchemaAstTree.ts` module; `ASTTraverse.ts` will delegate to it.

## 2. SchemaAstTree Module

### 2.1 Types
- `SchemaAstNode = { path, ast, annotations, context, children }`
  - `path: ReadonlyArray<PropertyKey>`
  - `ast: SchemaAST.AST`
  - `annotations: SchemaAST.Annotations`
  - `context: Annotations.Context`
  - `children: ReadonlyArray<SchemaAstNode>`
- `SchemaAstTree = { root: SchemaAstNode }` (optional `nodeMap`, `pathMap` caches can live here or be built on demand).

### 2.2 Builder `buildSchemaAstTree` (stack safe)
- Accepts `Schema.Schema.Any`
- Uses iterative traversal (explicit stack queue) to avoid recursion:
  1. Initialize stack with root AST node (`schema.ast`) and empty path.
  2. For each popped item, build its context via `Annotations.getContext(ast.annotations)` and compute children depending on `_tag`.
  3. Add constructed node to parent’s `children` array.
  4. Maintain arrays/maps as needed (e.g., for path lookup).
- Return immutable `SchemaAstTree` with fully materialized children arrays.

### 2.3 Child Extraction Logic
- Switch on `ast._tag` (TypeLiteral, Union, TupleType, Refinement, Transformation, Suspend, Declaration, Literal, keywords, etc.).
- For TypeLiteral, iterate property signatures; push `property.type` with updated path.
- For container types (tuple, union), push each element member.
- For leaf keywords (string, number, etc.) produce no children.
- Ensure we capture refined/transformed nodes consistent with existing semantics.

### 2.4 Fold Utility
- Signature: `foldSchemaAst<T>(node: SchemaAstNode, algebras: Algebra<T>): T`
- Provide algebras as a discriminated object with callbacks per `_tag` or generic `onNode` handler.
- Implementation: iterative or tail-recursive using explicit stack, accumulate results in map keyed by node reference or path.
- Expose simple default fold (e.g., `foldPreOrder(tree, initialState, visit)`).

### 2.5 Leaf Extraction
- Utility `extractLeaves(tree)` performing pre-order traversal collecting nodes with `children.length === 0`.
- Should return array of `{ path, context, ast }` or allow custom projection via callback.
- Implementation reuses stack-based traversal.

### 2.6 Additional Helpers (optional)
- `findNodes(tree, predicate)` returning nodes matching predicate (e.g., semantic type).
- `pathToString(path)` helper for consistent formatting.

## 3. Refactor ASTTraverse
- Replace current implementation with simple wrappers exposing tree utilities from `SchemaAstTree` (e.g., aliasing or re-exporting).
- Ensure existing exports (`buildSchemaASTTree`, `findNodes`, `generatePromptContext`, etc.) call into new module or adapt to new node structure.
- Update context usage to rely on `node.context.annotations` and other typed fields.

## 4. Handling Optional Utilities
- If touched modules (e.g., Wink utilities) still `require` optional deps, refactor to access via lazily-injected layer or provided service. Only adjust modules we change in this feature (likely none beyond AST traversal).

## 5. Stack Safety Strategy
- All traversal implemented with explicit stacks / queues; avoid direct recursion.
- For folds, expose both simple recursion (for shallow use) and stack-safe variant (default). Use `while (stack.length > 0)` loops to traverse.
- Consider using `Chunk` or `Array` for stacks due to ergonomic APIs; ensure immutability by creating new arrays for `children` when building nodes.

## 6. Testing Approach
- Add `test/unit/SchemaAstTree.test.ts` verifying:
  - Tree structure for complex nested schema (includes TypeLiteral, arrays, unions).
  - Stack safety: create deep chain (e.g., 5k nested structs) and ensure traversal completes.
  - Fold results (e.g., collect titles, count nodes).
  - Leaf extraction returns expected nodes.
- Update existing tests (Annotation parser, example smoke tests) to reference new API where necessary.

## 7. Docs/Examples
- Update README (or module doc) to introduce new traversal API.
- Optionally add script or example showing how to fold tree to produce prompt instructions.

## 8. Migration Considerations
- Ensure consumers of previous `SchemaASTTree` shape have minimal disruption (provide adapters or rename carefully).
- Keep existing helper exports (e.g., `findNodesBySemanticType`) via new utility functions.

