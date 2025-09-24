# Implementation Plan — Schema AST MVP

## 1. Create SchemaAstTree module
1. Add `src/Extraction/SchemaAstTree.ts` with:
   - Type definitions for `SchemaAstNode`, `SchemaAstTree`.
   - `buildSchemaAstTree` (iterative stack-based construction).
   - `foldSchemaAst` (stack-safe fold) with simple callback signature.
   - `extractLeaves` / `findNodes` utilities.
   - Helper to compute children based on `SchemaAST.AST` tags.
   - Functions rely on `Annotations.getContext` for typed annotation context.

## 2. Refactor ASTTraverse
1. Update `src/Extraction/ASTTraverse.ts` to:
   - Re-export or wrap new functions from `SchemaAstTree.ts`.
   - Remove legacy mutation logic; ensure context/fields align with new structure.
   - Keep higher-level helpers (prompt context, selectors) by delegating to the new API.

## 3. Clean Up Unsafe Patterns
1. Search for and replace invalid `Function.dual(1, ...)` within touched modules; convert to simple functions.
2. Remove `as any` casts in affected files by using typed helpers.
3. Ensure optional utilities (if any touched) are layer-based; otherwise note for future work.

## 4. Update Examples/Consumers
1. Adjust example scripts (if needed) to work with new tree structure (path, context field names).
2. Update documentation snippets referencing traversal APIs.

## 5. Testing
1. Add `test/unit/SchemaAstTree.test.ts` with:
   - Tree construction assertions (paths, context fields).
   - Fold test aggregating node count/titles.
   - Deep schema stack-safety test.
   - Leaf extraction verification.
2. Update existing tests (if reliant on old context shape) to match new API.

## 6. Validation
1. Run `pnpm lint --fix` on touched files.
2. Run `pnpm tsc`.
3. Execute tests (`pnpm test` or targeted suites).

## 7. Documentation/Exports
1. Update README or module docs with short example of new API.
2. Ensure exports are added (barrel files) so public consumers can access the traversal utilities.
