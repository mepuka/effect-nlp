import { Schema } from "effect";
import { DocumentId } from "../NLP/Core/Document.js";
import { Pattern } from "../NLP/index.js";

/**
 * A branded type for uniquely identifying a SemanticConcept within an ExtractionTask.
 */
export type ConceptId = Schema.Schema.Type<typeof ConceptId>;
export const ConceptId = Schema.String.pipe(Schema.brand("ConceptId"));

/**
 * A branded type for uniquely identifying a SemanticPredicate within an ExtractionTask.
 */
export type PredicateId = Schema.Schema.Type<typeof PredicateId>;
export const PredicateId = Schema.String.pipe(Schema.brand("PredicateId"));

export type PatternId = Schema.Schema.Type<typeof PatternId>;
export const PatternId = Schema.String.pipe(Schema.brand("PatternId"));

export class PatternMatch extends Schema.TaggedClass<PatternMatch>(
  "PatternMatch"
)("PatternMatch", {
  id: PatternId,
  text: Schema.String,
  patternId: Pattern.fields.id,
  documentId: DocumentId,
}) {}

export class ExtractionTask extends Schema.TaggedClass<ExtractionTask>(
  "ExtractionTask"
)("Extractiontask", {}) {}

export type PropertyId = Schema.Schema.Type<typeof PropertyId>;
export const PropertyId = Schema.String.pipe(Schema.brand("PropertyId"));

const PatternPropertyAnnotation = Schema.TaggedStruct("PatternAnnotation", {
  propertyId: PropertyId,
  value: Schema.String, // the description of how the pattern should be constructed
  propertyContext: Schema.String, // a graphical + semantic representation of the pattern property as it relates to the full schema context
  examples: Schema.Array(Schema.String), // pattern examples in pattern string format
});

const SemanticPropertyAnnotation = Schema.TaggedStruct("SemanticAnnotation", {
  propertyId: PropertyId,
  value: Schema.String, // the description of how the semantic property, what it means how it embodies the element of the larget concept for which it is one property
  propertyContext: Schema.String, // a graphical + semantic representation of the pattern property as it relates to the full schema context (probably identical to the pattern property context)
  examples: Schema.Array(Schema.String), // semantic examples describing demonstrating the property in the context
});

export type PropertyAnnotation = Schema.Schema.Type<typeof PropertyAnnotation>;
export const PropertyAnnotation = Schema.Union(
  PatternPropertyAnnotation,
  SemanticPropertyAnnotation
);

export class Property extends Schema.TaggedClass<Property>("Property")(
  "Property",
  {
    id: PropertyId,
    name: Schema.NonEmptyString,
    description: Schema.String,
    annotations: Schema.Array(PropertyAnnotation),
  }
) {}

// Define the base fields for Concept
const conceptFields = {
  id: ConceptId,
  _tag: Schema.Literal("Concept"),
  name: Schema.String,
  description: Schema.String,
};

// Define the Concept interface extending the base fields
interface Concept extends Schema.Struct.Type<typeof conceptFields> {
  readonly properties: ReadonlyArray<Property | Concept>;
}

// Define the ConceptEncoded interface for the encoded type
interface ConceptEncoded extends Schema.Struct.Encoded<typeof conceptFields> {
  readonly properties: ReadonlyArray<typeof Property.Encoded | ConceptEncoded>;
}

// Define the Concept schema with recursive properties
const Concept = Schema.TaggedStruct("Concept", {
  ...conceptFields,
  properties: Schema.Array(
    Schema.suspend(
      (): Schema.Schema<
        Property | Concept,
        typeof Property.Encoded | ConceptEncoded
      > => Schema.Union(Property, Concept)
    )
  ),
});
