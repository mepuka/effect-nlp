import { Schema } from "effect";

/**
 * Canonical provenance schema definitions for extracted entities.
 *
 * Provides structured metadata used to trace how entity values were produced.
 */
export const ProvenanceSpan = Schema.Struct({
  path: Schema.Array(Schema.String),
  start: Schema.Number,
  end: Schema.Number,
  confidence: Schema.optional(Schema.Number),
});
export type ProvenanceSpan = Schema.Schema.Type<typeof ProvenanceSpan>;

export const ProvenanceModelInfo = Schema.Struct({
  provider: Schema.String,
  model: Schema.String,
  temperature: Schema.optional(Schema.Number),
  maxOutputTokens: Schema.optional(Schema.Number),
});
export type ProvenanceModelInfo = Schema.Schema.Type<
  typeof ProvenanceModelInfo
>;

export const Provenance = Schema.Struct({
  documentId: Schema.String,
  spans: Schema.Array(ProvenanceSpan),
  extractedAt: Schema.DateFromSelf,
  modelInfo: ProvenanceModelInfo,
  comment: Schema.optional(Schema.String),
});
export type Provenance = Schema.Schema.Type<typeof Provenance>;

export const ProvenanceHistory = Schema.Array(Provenance).pipe(
  Schema.propertySignature,
  Schema.withConstructorDefault(() => [])
);
export type ProvenanceHistory = Schema.Schema.Type<typeof ProvenanceHistory>;
