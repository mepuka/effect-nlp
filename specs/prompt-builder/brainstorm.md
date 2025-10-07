# Prompt Builder — Atom Taxonomy, Layering, and Traversal Algebra

## 1) Atom Taxonomy

- SchemaAtom
  - A minimal structural unit in the Schema AST (usually a leaf property or an atomic constructor like `StringKeyword`, `Literal`, etc.).
  - Carries a path, the raw AST node, and the Annotation Bundle at that path.
- SemanticAtom
  - A normalized semantic facet derived from annotations (e.g., `semanticType = person.age.inferred`, `role = primary_identifier`, `constraints = [integer, >=0]`).
  - Represents meaning independent of prompt phrasing.
- PromptAtom
  - The rendered, task-specific snippet derived from (SchemaAtom × SemanticAtom × Strategy × Lens).
  - Contains text fragments, formatting, and explicit instructions/constraints for the model.
- EvidenceAtom (extraction-time)
  - A (value, span, confidence, rationale) quadruple that records how an extracted value maps back to source text.
  - Enables provenance and later adjudication/repair.

Pipeline sketch:

SchemaAtom + AnnotationBundle -> SemanticAtom -> PromptAtom -> Model Output -> EvidenceAtom -> Entity

## 2) Annotation Bundle as a Layered Space

Terminology and math analogies:
- Base space = structural schema (structural equality defined here)
- Fiber over each node = the set of annotations at that node (Core/Role/Semantic/Provenance/Traversal hints, etc.)
- Annotation Bundle = product of annotation families at a node
- Structural equality: two schemas are equal if their AST shape is equal up to isomorphism; annotation equality can differ (different fibers).
- In property-graph terms: annotations are attribute maps on nodes/edges. Layering is overlaying multiple attribute sets with conflict resolution (priority/salience).

Good names for the “set of annotations”:
- Annotation Bundle (preferred): emphasizes a layered, extensible family at each node.
- Annotation Overlay: emphasizes a partial map that modifies prior bundles.
- Annotation Algebra: emphasizes available operations (merge, restrict, project, score).

Equalities:
- Structural equality: equality in the base (shape only).
- Bundle equivalence: equality of bundles under a projection (e.g., ignoring provenance; or modulo default values).

Operations:
- Overlay (⊕): merge two bundles with policy (priority, salience weights, or most-specific-wins).
- Restriction (|_subtree): limit to a subtree/path.
- Projection (π_fields): keep only selected facets (e.g., keep only `semanticType` & `role`).
- Distance/Similarity: define a metric over bundles to cluster or switch strategies.

## 3) Degrees of Freedom for an Entity in a Prompt

1. Selection: which SchemaAtoms are included.
2. Ordering: topological or annotation-weighted order.
3. Direction: Out→In vs In→Out.
4. Granularity: depth of expansion, field verbosity, examples.
5. Scope: local node, subtree, or whole tree.
6. Salience/Weighting: relative emphasis among fields.
7. Sense: disambiguation mode (biological vs grammatical, literal vs metaphorical).
8. Normalization: canonicalization rules (e.g., name format, numeric rounding).
9. Output modality: span extraction vs value synthesis vs both.
10. Adjudication: multi-candidate ranking and final selection.
11. Provenance policy: redaction/masking, policy-based omission.
12. Reasoning depth: chain-of-thought vs concise, step caps.
13. Windowing: chunk size, overlap, sliding strategy.
14. Evidence linking: whether to require quotes/spans as justification.
15. Corpus priors: inclusion of distributional facts (co-occurrence, POS patterns) as hints.

## 4) Traversal as Attribute Grammar

A powerful model: attribute grammars.
- Inherited attributes (top-down) ~ Out→In traversal: parent context enriches child prompts (e.g., legal identity implies stricter constraints for child fields).
- Synthesized attributes (bottom-up) ~ In→Out traversal: child results roll up into parent context (e.g., detected leaf spans combine to form a Person profile).

Mapping to our layers:
- Annotation Bundle defines available attributes.
- Traversal Strategy selects how to evaluate attributes (order, direction, salience).
- ContextLens selects focus and granularity.

Comonadic view (optional): treat traversal as extracting local views from a context-rich structure (cofree comonad over trees), giving principled parent-child mediation.

## 5) Algorithms (Extraction & Generation)

In→Out Extraction (bottom-up):
1. Select leaf nodes by bundle filters (e.g., `semanticType = ner.person.name | temporal.age.expression`).
2. Emit PromptAtoms asking for spans/values for each leaf (with constraints/examples from bundles).
3. Parse outputs into EvidenceAtoms; validate; synthesize parent entities using fold.
4. Adjudicate conflicts with annotation policies (e.g., choose_highest_confidence).

Out→In Extraction (top-down):
1. Emit PromptAtoms for high-level entity semantics (persona/role/policy) to frame the task.
2. Descend into children with inherited attributes; emit prompts in a stable order.
3. Collect leaf EvidenceAtoms; backfill parent placeholders; validate and adjudicate.

In→Out Generation:
1. Generate leaf values under constraints (from bundles) with controlled variety.
2. Fold upward to synthesize a coherent parent entity; run normalization/validation.

Out→In Generation:
1. Present top-level semantics/persona.
2. Recursively generate child PromptAtoms; render consistent leaf values; fold to parent.

## 6) Corpus-Informed Bundles

We can enrich bundles with corpus statistics:
- Co-occurrence, PMI, POS transition patterns, n-gram priors, topical embeddings.
- Encode as additional fields in the Annotation Bundle (e.g., `priors: { cooc: [...], pos: [...] }`).
- Prompt builder can surface these facts (e.g., “Age often follows ‘aged’ or a number + ‘years old’ in this domain”).

This turns annotations into a vehicle for amplifying correlations—precisely and locally in the graph—rather than just a single-dimensional label.

## 7) Atoms & APIs (proposed)

Types (conceptual):
- `PromptAtom = { path, text, role?, semanticType?, constraints?, examples?, policy? }`
- `PromptPart = { path, atoms: PromptAtom[], children: PromptPart[] }`
- `PromptStrategy = { direction, mode, granularity?, scope?, salience?, sense? }`
- `ContextLens = { zoomIn(path) | zoomOut() | slice(predicate) }`

Functions:
- `schemaToPromptParts(tree, strategy, lens?) -> PromptPart`
- `renderPromptText(parts, options) -> string`
- `partsToJSONSchema(parts) -> JSON template for LLM output`
- `collectEvidence(output, options) -> EvidenceAtoms[]`

## 8) Layering and Graph Operations (APG)

- Overlay: `bundle' = bundle ⊕ overlay` with conflict resolution.
- Join: combine multiple schemas side-by-side; traversal interleaves or alternates.
- Restrict/Project: `restrict(tree, path)`; `project(bundle, fields)`.
- Structural equality: compare trees; Annotation delta: report bundle differences.

## 9) Examples (In↔Out × Extraction/Generation)

A) Person — Out→In Extraction (legal focus): enforce constraints and redactions.
B) Person — In→Out Extraction (entity spotting): highlight spans, co-reference resolution.
C) Car — Out→In Extraction: system → subsystems → parts.
D) Car — In→Out Extraction: parts evidence → subsystem state → system.
E) Contract — Out→In Generation: section semantics → clauses.
F) Contract — In→Out Generation: clauses → sections.
G) Research paper — Out→In Extraction: metadata → sections → citations.
H) Research paper — In→Out Extraction: citation spans → sections’ summaries → metadata.

These provide enough variation to test the full algebra.

---
If this direction resonates, Phase 2 will capture requirements (APIs, defaults, test strategy) before we lock down data structures and implementations.
