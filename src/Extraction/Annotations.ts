import { Function, Option, Schema, SchemaAST, pipe } from "effect";

/**
 * Namespace providing typed annotations and utilities for entity schemas.
 */
export namespace Annotations {
  const ConstraintsAnnotationId = Symbol.for(
    "effect-nlp/annotation/constraints"
  );
  const RoleAnnotationId = Symbol.for("effect-nlp/annotation/role");
  const SemanticAnnotationId = Symbol.for("effect-nlp/annotation/semantic");
  const ProvenanceAnnotationId = Symbol.for(
    "effect-nlp/annotation/provenance"
  );

  const ConstraintsSchema = Schema.Array(Schema.String);

  export const Core = Schema.Struct({
    title: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    examples: Schema.optional(Schema.Array(Schema.Unknown)),
    constraints: Schema.optional(ConstraintsSchema),
    documentation: Schema.optional(Schema.String),
  });
  export type Core = Schema.Schema.Type<typeof Core>;

  export const Role = Schema.Struct({ role: Schema.String });
  export type Role = Schema.Schema.Type<typeof Role>;

  export const Semantic = Schema.Struct({ semanticType: Schema.String });
  export type Semantic = Schema.Schema.Type<typeof Semantic>;

  export const Provenance = Schema.Struct({
    source: Schema.optional(Schema.String),
    comment: Schema.optional(Schema.String),
  });
  export type Provenance = Schema.Schema.Type<typeof Provenance>;

  export interface Metadata {
    readonly core?: Core;
    readonly role?: Role;
    readonly semantic?: Semantic;
    readonly provenance?: Provenance;
  }

  const encodeCore = (core: Core): Record<PropertyKey, unknown> => {
    const encoded = Schema.encodeSync(Core)(core);
    const annotations: Record<PropertyKey, unknown> = {};

    if (encoded.title !== undefined) {
      annotations.title = encoded.title;
    }
    if (encoded.description !== undefined) {
      annotations.description = encoded.description;
    }
    if (encoded.examples !== undefined) {
      annotations.examples = encoded.examples;
    }
    if (encoded.documentation !== undefined) {
      annotations.documentation = encoded.documentation;
    }
    if (encoded.constraints !== undefined) {
      annotations[ConstraintsAnnotationId] = encoded.constraints;
    }

    return annotations;
  };

  const encodeRole = (role: Role): Record<PropertyKey, unknown> => ({
    [RoleAnnotationId]: Schema.encodeSync(Role)(role),
  });

  const encodeSemantic = (semantic: Semantic): Record<PropertyKey, unknown> => ({
    [SemanticAnnotationId]: Schema.encodeSync(Semantic)(semantic),
  });

  const encodeProvenance = (
    provenance: Provenance
  ): Record<PropertyKey, unknown> => ({
    [ProvenanceAnnotationId]: Schema.encodeSync(Provenance)(provenance),
  });

  const mergeAnnotations = (
    annotations: ReadonlyArray<Record<PropertyKey, unknown>>
  ): Record<PropertyKey, unknown> =>
    annotations.reduce<Record<PropertyKey, unknown>>(
      (acc, current) => ({ ...acc, ...current }),
      {}
    );

  export const withCore = Function.dual(
    2,
    <A, I, R>(schema: Schema.Schema<A, I, R>, core: Core) =>
      schema.annotations(encodeCore(core))
  );

  export const withRole = Function.dual(
    2,
    <A, I, R>(schema: Schema.Schema<A, I, R>, role: Role) =>
      schema.annotations(encodeRole(role))
  );

  export const withSemantic = Function.dual(
    2,
    <A, I, R>(schema: Schema.Schema<A, I, R>, semantic: Semantic) =>
      schema.annotations(encodeSemantic(semantic))
  );

  export const withProvenance = Function.dual(
    2,
    <A, I, R>(schema: Schema.Schema<A, I, R>, provenance: Provenance) =>
      schema.annotations(encodeProvenance(provenance))
  );

  export const withMetadata = Function.dual(
    2,
    <A, I, R>(schema: Schema.Schema<A, I, R>, metadata: Metadata) =>
      schema.annotations(
        mergeAnnotations([
          metadata.core ? encodeCore(metadata.core) : {},
          metadata.role ? encodeRole(metadata.role) : {},
          metadata.semantic ? encodeSemantic(metadata.semantic) : {},
          metadata.provenance ? encodeProvenance(metadata.provenance) : {},
        ])
      )
  );

  const decodeUsing = <A>(
    decoder: (input: unknown) => Option.Option<A>
  ): ((value: unknown) => Option.Option<A>) => decoder;

  const decodeConstraints = decodeUsing(
    Schema.decodeUnknownOption(ConstraintsSchema)
  );
  const decodeRole = decodeUsing(Schema.decodeUnknownOption(Role));
  const decodeSemantic = decodeUsing(Schema.decodeUnknownOption(Semantic));
  const decodeProvenance = decodeUsing(
    Schema.decodeUnknownOption(Provenance)
  );

  export const getCore = (
    annotations: SchemaAST.Annotations
  ): Option.Option<Core> => {
    const title = Option.fromNullable<SchemaAST.TitleAnnotation>(
      annotations[SchemaAST.TitleAnnotationId] as
        | SchemaAST.TitleAnnotation
        | undefined
    );
    const description = Option.fromNullable<SchemaAST.DescriptionAnnotation>(
      annotations[SchemaAST.DescriptionAnnotationId] as
        | SchemaAST.DescriptionAnnotation
        | undefined
    );
    const examples = Option.fromNullable<
      SchemaAST.ExamplesAnnotation<unknown>
    >(
      annotations[SchemaAST.ExamplesAnnotationId] as
        | SchemaAST.ExamplesAnnotation<unknown>
        | undefined
    );
    const documentation = Option.fromNullable<
      SchemaAST.DocumentationAnnotation
    >(
      annotations[SchemaAST.DocumentationAnnotationId] as
        | SchemaAST.DocumentationAnnotation
        | undefined
    );
    const constraints = pipe(
      Option.fromNullable(annotations[ConstraintsAnnotationId]),
      Option.flatMap(decodeConstraints)
    );

    if (
      Option.isNone(title) &&
      Option.isNone(description) &&
      Option.isNone(examples) &&
      Option.isNone(documentation) &&
      Option.isNone(constraints)
    ) {
      return Option.none();
    }

    const builder: Record<string, unknown> = {};

    if (Option.isSome(title)) {
      builder.title = title.value;
    }
    if (Option.isSome(description)) {
      builder.description = description.value;
    }
    if (Option.isSome(examples)) {
      builder.examples = examples.value;
    }
    if (Option.isSome(documentation)) {
      builder.documentation = documentation.value;
    }
    if (Option.isSome(constraints)) {
      builder.constraints = constraints.value;
    }

    return pipe(builder, Schema.decodeUnknownOption(Core));
  };

  export const getRole = (
    annotations: SchemaAST.Annotations
  ): Option.Option<Role> =>
    pipe(
      Option.fromNullable(annotations[RoleAnnotationId]),
      Option.flatMap(decodeRole)
    );

  export const getSemantic = (
    annotations: SchemaAST.Annotations
  ): Option.Option<Semantic> =>
    pipe(
      Option.fromNullable(annotations[SemanticAnnotationId]),
      Option.flatMap(decodeSemantic)
    );

  export const getProvenance = (
    annotations: SchemaAST.Annotations
  ): Option.Option<Provenance> =>
    pipe(
      Option.fromNullable(annotations[ProvenanceAnnotationId]),
      Option.flatMap(decodeProvenance)
    );

  export interface Context {
    readonly core: Option.Option<Core>;
    readonly role: Option.Option<Role>;
    readonly semantic: Option.Option<Semantic>;
    readonly provenance: Option.Option<Provenance>;
  }

  export const getContext = (
    annotations: SchemaAST.Annotations
  ): Context => ({
    core: getCore(annotations),
    role: getRole(annotations),
    semantic: getSemantic(annotations),
    provenance: getProvenance(annotations),
  });
}
