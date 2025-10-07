# Prompt Builder and Traversal Strategies — Instructions (Phase 1)

## Feature Overview
We will design a schema-driven prompt builder that converts annotated Effect Schemas (and their SchemaAstTree representations) into deterministic, richly-contextual prompts for both extraction and generation tasks. The builder must:

- Respect typed annotations (Core/Role/Semantic/Provenance and future extensions) and traversal strategies.
- Support bidirectional composition metaphors: Out→In and In→Out, for both extraction and generation.
- Produce stable, testable prompt artifacts (prompt parts tree + final rendered text), enabling snapshot testing and reproducibility.

This document focuses on ideation and exploration. We intentionally cast a wide net to avoid locking into a weak paradigm.

## Motivating Example: Person(name, age, gender)
Below are 10 permutations of annotation sets and what they imply semantically and for prompt generation. Each permutation assumes fields: `name`, `age`, `gender`.

1) Legal identity focus
- name: title "Full legal name", role: "primary_identifier", semanticType: "person.name.legal"
- age: title "Age (years)", constraints: ["integer", ">= 0", "<= 130"], semanticType: "person.age.biological"
- gender: title "Biological sex", semanticType: "person.gender.biological"
- Effect: prompts push for strictly legal identity capture; minimal ambiguity, numeric `age`.

2) Alias-centric profile
- name: title "Preferred or Stage Name", role: "alias", semanticType: "person.name.alias"
- age: optional, role: "supplementary", constraints: ["approx_ok"], semanticType: "person.age.estimated"
- gender: role: "self_identified", semanticType: "person.gender.self_identified"
- Effect: prompts invite softer language; accept ʻ~30ʼ; emphasize self-identification.

3) Demographic segmentation
- name: role: "non_identifier", semanticType: "token.ignore"
- age: title "Age bracket", semanticType: "demographic.ageBracket", constraints: ["enum:[18-24,25-34,35-44,45-54,55+]"],
- gender: semanticType: "demographic.gender_segment"
- Effect: prompts pivot to buckets; no PII collection; privacy-preserving extraction.

4) Linguistic analysis
- name: title "Named entity (proper noun)", semanticType: "ner.person.name"
- age: title "Temporal expression (age)", semanticType: "temporal.age.expression"
- gender: title "Grammatical gender", semanticType: "grammatical.gender"
- Effect: treat fields as linguistic phenomena; prompts mention tokens/spans, grammatical cues.

5) Metaphorical semantics
- age: semanticType: "metaphor.age_of_concept" (e.g., "age of wonder"), role: "conceptual"
- name: semanticType: "work.title" (e.g., name of a book under a Person context)
- gender: semanticType: "linguistic.gender_of_noun"
- Effect: prompts explicitly disambiguate literal vs figurative readings; ask for sense selection.

6) Event-inferred age
- age: constraints: ["derive_from_events"], semanticType: "person.age.inferred"
- name: role: "subject_of_verb" (bias toward subject mentions)
- gender: role: "inferred_from_context"
- Effect: prompts instruct to infer age via birth-year mentions or time deltas; heavy reasoning cues.

7) Cross-entity linking
- name: role: "crossref", semanticType: "person.name.crossref"
- age: role: "coalesced_from_multiple_mentions"
- gender: role: "coalesced_from_multiple_mentions"
- Effect: prompts stress co-reference resolution, deduping across spans.

8) Normalization-first
- name: constraints: ["normalize_to: First Last"], semanticType: "person.name.normalized"
- age: constraints: ["round_to_integer", "reject_ranges"], semanticType: "person.age.strict"
- gender: constraints: ["enum:[female,male,nonbinary]"], semanticType: "person.gender.enumerated"
- Effect: prompts specify target canonical space; penalize ambiguous outputs.

9) Safety-aware extraction
- name: role: "sensitive", constraints: ["omit_if_minor"], provenance: { source: "policy" }
- age: role: "sensitive_when_minor", constraints: ["mask_if<18"], provenance: { source: "policy" }
- gender: role: "sensitive", constraints: ["omit_if_sensitive_context"]
- Effect: prompts include policy gates; instruct redaction or omission under conditions.

10) Multi-source adjudication
- name: role: "adjudicated", constraints: ["choose_highest_confidence"], provenance: { source: "ensemble" }
- age: role: "adjudicated"
- gender: role: "adjudicated"
- Effect: prompts explicitly request multi-candidate list then a final adjudicated value.

These permutations show how small annotation changes reshape prompt content, disambiguation rules, validation, and safety constraints.

## Two-Dimensional Model

Axis A (Conceptual pipeline): Generation ← Context ← Traversal ← Entity Model
- Entity model defines potential meaning.
- Traversal selects/arranges facets of the model, yielding Context.
- Context feeds generation (prompting or structured rendering).

Axis B (Extraction pipeline): Entity Model → Traversal → Context + Unstructured → Entity Model
- Model guides how to read unstructured input.
- Traversal emits Context and instructions used in a prompt.
- Model is re-instantiated from the structured output.

## Traversal Strategies (In↔Out × Extraction/Generation)

We define two orthogonal decisions:
- Direction: Out→In (top-down), In→Out (bottom-up)
- Mode: Extraction (reading input), Generation (synthesizing output)

Below are 8 example recipes applying both axes.

1) Out→In Extraction (Person identity)
- Start with Person high-level semantics (legal identity) → descend to leaves.
- Prompt: begin with legal PII guidelines, then query name/age/gender with strict constraints.

2) In→Out Extraction (Entity spotting first)
- Detect leaf signals (proper nouns, numbers, gendered terms) → aggregate to Person.
- Prompt: ask model to highlight spans and then compose a Person object from detected leaves.

3) Out→In Generation (Profile synthesis)
- Start with persona context (job role, culture) → generate consistent leaf values.
- Prompt: present top-level persona and constraints; instruct generation of name/age/gender consistent with persona.

4) In→Out Generation (Attributes-first synthesis)
- Generate realistic leaf values independently → synthesize coherent Person profile.
- Prompt: request plausible name/age/gender first, then a summary profile that unifies them.

5) Out→In Extraction (Car system diagnostics)
- Start at car-level semantics → zoom into subsystems (electrical, drivetrain).
- Prompt: contextualize the full system, then extract subsystem issues and parts.

6) In→Out Extraction (Part-first scanning)
- Detect leaf-level part mentions/errors → propagate upward to car-level diagnoses.
- Prompt: scan for concrete part terms and symptoms, then infer subsystem state and overall diagnosis.

7) Out→In Generation (Contract doc template)
- Begin with a contract’s section semantics → generate clauses and fields.
- Prompt: present top-level structure; recursively expand to leaf clauses with constraints and examples.

8) In→Out Generation (Clause-first drafting)
- Generate concrete clauses first → aggregate into a well-formed contract.
- Prompt: request clauses/templates; afterward, assemble them into consistent sections.

## Annotated Traversal as an Algebra
To capture these behaviors systematically, we can declare traversal semantics in annotations:
- `TraversalDirection`: inToOut | outToIn
- `Granularity`: coarse | fine | auto (or a numeric depth)
- `Scope`: local | global | subtree(path)
- `Salience`: relative weight among fields during prompt assembly
- `Sense`: disambiguation hints (e.g., biological vs grammatical gender)
- `ProvenanceRules`: redaction/masking, policy sources, adjudication strategies

These directives inform the prompt builder on how to fold the APG:
- A fold on leaves (In→Out) vs a fold on structural elements first (Out→In)
- Context lenses (zoom-in hypercontext) by subtree selection
- Composition rules for ordering, grouping, and conflict resolution

## Context Lenses and Hypercontext
A `ContextLens` selects a focus:
- `zoomIn(path)`: restricts traversal to a subtree; increase `Granularity`
- `zoomOut()`: expand to parent with summarized `Context`
- `slice(predicate)`: include only nodes whose annotations match (e.g., semanticType starts with `electrical.`)

This lets us implement "hypercontext": quickly zooming from general → fine-grained views for generation or extraction.

## Multi-Schema Overlays
We can layer multiple schemas simultaneously:
- Example: Person + Sentiment + DiscourseRole overlays where Person.name is annotated with `discourse.role = subject` and `sentiment.scope = window(2)`
- During traversal, overlays add/modify Context and therefore prompt parts.
- Deterministic merging rules (priority, salience) keep results stable.

## Proposed Artifacts & APIs
- `PromptPart = { label?, description?, path, examples?, constraints?, role?, semanticType?, provenance?, children: PromptPart[] }`
- `schemaToPromptParts(tree, strategy, lens?) -> PromptPart`
- `renderPromptText(parts, options) -> string` (stable ordering, verbosity levels)
- `PromptStrategy = { direction: inToOut|outToIn, mode: extraction|generation, granularity?: …, salienceRules?: … }`
- `ContextLens = { zoomIn(path) | zoomOut() | slice(predicate) }`

## Snapshot Testing
- Snapshot `PromptPart` trees and rendered prompt text to guarantee stability across changes.
- Property tests for ordering (e.g., stable sort by path or salience), and idempotence of repeated traversal.

## Risks and Mitigations
- Ambiguity: enforce strict JSON output format for extraction; disambiguate with `Sense` annotations.
- Prompt size: use lenses and granularity to constrain output; provide compact render mode.
- Complexity: provide defaults for strategies (simple out→in extraction as baseline) and layer features incrementally.

## Acceptance to Move to Phase 2
- If these directions align, we’ll proceed to formalize requirements (APIs, defaults, tests) in `requirements.md`, then design specific data structures and fold algebras, and only then implement `schemaToPromptParts` and renderers.
