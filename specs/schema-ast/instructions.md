# Schema AST MVP Instructions

## Feature Overview
Implement the Schema AST infrastructure required for the Effect-NLP entity extraction MVP. The feature will refactor our AST traversal to produce an immutable, typed tree structure, provide stack-safe folds and leaf extraction utilities, and lay the groundwork for @effect/ai prompt generation. This includes eliminating unsafe patterns (invalid `Function.dual` arities, `as any` casts), wiring typed annotation helpers, and ensuring the schema traversal can be consumed reliably by downstream extraction logic.

## User Stories
- **Library users** need assurance that schema-driven extraction operates over mathematically sound, immutable AST representations, enabling precise graph operations.
- **Developers extending extraction** want a typed AST API with folds and leaf extractors to build additional transformations or prompt builders safely.
- **Prompt / AI tooling** requires deterministic schema traversal results with typed annotation context to generate stable, verifiable prompts for entity extraction.

## Acceptance Criteria
- A new or refactored `SchemaAstTree` implementation delivers typed nodes (`path`, `ast`, `context`, `children`) built without mutation.
- Provide stack-safe traversal helpers: `buildSchemaAstTree`, `foldSchemaAst`, `extractLeaves` (or equivalent) with effect-friendly recursion strategies.
- Replace invalid `Function.dual(1, ...)` occurrences in affected modules, keeping only valid arities or plain functions.
- Remove `as any` casts in core modules touched by the feature (`ASTTraverse`, `AnnotationParser`, `PatternBuilders`, `WinkUtils` as applicable) in favor of typed helpers.
- Optional utilities like `wink-nlp-utils` are injectable services, not hard requirements, within modules modified during this feature.
- Existing annotation usage integrates typed helpers from `Annotations.ts`, ensuring context is strongly typed across traversal outputs.
- Tests cover new traversal logic (including large/deep schemas to demonstrate stack safety) and confirm API expectations.

## Constraints
- Maintain compatibility with Effect Schema and Schema AST public APIs.
- Ensure recursion utilities are stack-safe (iterative, Effect-based, or stream-based) and avoid global mutation.
- Keep TypeScript strictness: no `as any` or unchecked casting in new code.
- Avoid introducing new third-party dependencies.

## Dependencies
- Depends on the typed annotation helpers implemented in the previous feature (`Annotations.ts`).
- Relies on existing tokenizer adjustments (offsets, branding) and the extraction infrastructure planned in the MVP roadmap.

## Out of Scope
- Implementing the actual prompt builder or @effect/ai integration (handled in later features).
- Refactoring every existing schema/example unless necessary to validate the new traversal.
- Storage layer redesign (covered separately).
