# Typed Annotation Spec

## Feature Overview
Implement a strongly typed annotation layer on top of Effect Schema so that domain schemas in this repository can rely on first-class, reusable annotation definitions. The feature should introduce a canonical `Annotations` module that defines structured annotation schemas (title, semantic type, roles, provenance, etc.) and helper APIs that make it simple to attach and retrieve these annotations from Effect schemas and AST nodes. The goal is to guarantee consistent metadata for prompt generation, entity extraction, and storage while remaining fully compatible with Effect's native annotation mechanisms.

## User Stories
- **Schema authors** want to attach rich semantic metadata to schemas using a safe, discoverable API so that downstream tooling can rely on consistent annotation shapes.
- **Extraction engine developers** need typed helpers to read annotations from the Schema AST without manual casting, enabling deterministic prompt construction and entity provenance.
- **Library consumers** expect annotations to be validated and documented so they can extend schemas confidently without breaking tooling.

## Acceptance Criteria
- A new module `src/Extraction/Annotations.ts` exports typed annotation schemas (`CoreAnnotations`, `RoleAnnotation`, `SemanticAnnotation`, `IdentifierAnnotation`, optional `ProvenanceAnnotation`) and derived helper types.
- Helper functions exist for applying annotations to schemas (`annotate`, `annotateField`, etc.) and for retrieving annotations from Schema AST nodes using typed getters.
- Existing code that currently applies ad-hoc annotation objects is refactored to use the new helpers where applicable (minimum: AnnotationParser, AST traversal utilities, example schemas).
- Tests cover encoding/decoding of annotations and validate that the helpers round-trip (attach -> retrieve) without type assertions.
- Documentation is updated (README or module docs) showing how to use the annotation helpers for defining schemas.

## Constraints
- Must remain compatible with Effect Schema's native annotation system and not introduce breaking changes to schema construction.
- Avoid mutation of existing AST structures; helpers should operate using pure transformations or Effect Schema APIs.
- No introduction of external dependencies beyond existing Effect packages.
- Ensure TypeScript type safety: no `as any` or unchecked casts in the new module.

## Dependencies
- Relies on current Effect Schema and Schema AST APIs (`Schema.annotations`, `SchemaAST.getAnnotation`, etc.).
- Builds on the tokenizer and extraction components that will consume annotations for prompt generation.

## Out of Scope
- Implementing the prompt builder or LLM extraction pipeline (covered by separate features).
- Persisting annotation metadata into the entity store beyond what already exists.
- Refactoring every existing schema in the repository; focus on core modules and representative examples to validate the approach.
