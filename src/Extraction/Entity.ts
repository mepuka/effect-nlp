// ============================================================================
// IMPORTS
// ============================================================================
import { Array, Schema, SchemaAST, HashSet, Hash, Option } from "effect";
import { randomUUID } from "node:crypto";

// ============================================================================
// BRANDED TYPES
// ============================================================================

/**
 * Branded types for Entity identification
 */
export type EntityId = Schema.Schema.Type<typeof EntityId>;
export const EntityId = Schema.TemplateLiteral(
  Schema.Literal("entity##"),
  Schema.String
).pipe(Schema.brand("EntityId"));

export type SchemaId = Schema.Schema.Type<typeof SchemaId>;
export const SchemaId = Schema.String.pipe(Schema.brand("SchemaId"));

export type EntityFieldId = Schema.Schema.Type<typeof EntityFieldId>;
export const EntityFieldId = Schema.TemplateLiteral(
  Schema.Literal("field##"),
  Schema.String
).pipe(Schema.brand("EntityFieldId"));

// ============================================================================
// ANNOTATIONS
// ============================================================================

// Create unique symbols for Entity identification
export const EntityIdAnnotationId = Symbol.for("EntityIdAnnotation");
export const EntityFieldIdAnnotationId = Symbol.for("EntityFieldIdAnnotation");
export const ParentEntityIdAnnotationId = Symbol.for(
  "ParentEntityIdAnnotation"
);

/**
 * Key insight:
 * 1. Annotations allow for the semantic meta annotation of schemas representing
 * the layer between schema as an algebraic data type and the semantic meaning and relationships e.g.
 * I can define a Person schema, that schema may be re used in other contexts but from the AST
 * and store I can determine what it means *in that context* furthermore
 *
 * i can track modifications to the schema and store the history of the schema in semantic terms
 *
 * e.g. we added a field to the schema, we can track that in semantic terms like if we have a person schema
 *
 * wwe could add another field (extend) for say professional liscence this new schema would hold a reference
 * to the old schema thus prompt atoms could be created describing "professional lisccence schema is a person with a professional liscence"
 *
 *
 */

// Type-safe annotation interface
export interface EntityAnnotations {
  readonly [EntityIdAnnotationId]: EntityId;
  readonly [EntityFieldIdAnnotationId]: EntityFieldId;
  readonly [ParentEntityIdAnnotationId]: EntityId;
  readonly [SchemaAST.IdentifierAnnotationId]: EntityId;
  readonly [SchemaAST.DescriptionAnnotationId]: string;
}

// ============================================================================
// HELPER FUNCTIONS USING getAnnotation
// ============================================================================

/**
 * Get entity ID from an annotated schema using type-safe annotation access
 */
export const getEntityIdFromAnnotations = (
  annotated: SchemaAST.Annotated
): Option.Option<EntityId> =>
  SchemaAST.getAnnotation<EntityId>(EntityIdAnnotationId)(annotated);

/**
 * Get entity field ID from an annotated schema using type-safe annotation access
 */
export const getEntityFieldIdFromAnnotations = (
  annotated: SchemaAST.Annotated
): Option.Option<EntityFieldId> =>
  SchemaAST.getAnnotation<EntityFieldId>(EntityFieldIdAnnotationId)(annotated);

/**
 * Get parent entity ID from an annotated schema using type-safe annotation access
 */
export const getParentEntityIdFromAnnotations = (
  annotated: SchemaAST.Annotated
): Option.Option<EntityId> =>
  SchemaAST.getAnnotation<EntityId>(ParentEntityIdAnnotationId)(annotated);

// ============================================================================
// ID GENERATION FUNCTIONS
// ============================================================================

export const MakeEntityId = () => EntityId.make(`entity##${randomUUID()}`);
export const MakeSchemaId = (name: string) =>
  SchemaId.make(`schema-${name}-${Date.now()}`);

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isEntityId = (id: string): id is EntityId => {
  return id.startsWith("entity##");
};

/**
 * Type guard to check if an AST node is an entity field
 * Note: This checks AST node annotations, but entity field annotations are typically on property signatures
 */
export const isEntityField = (ast: SchemaAST.AST): boolean => {
  const entityFieldAnnotation = ast.annotations[EntityFieldIdAnnotationId];
  return (
    entityFieldAnnotation !== undefined &&
    typeof entityFieldAnnotation === "string" &&
    entityFieldAnnotation.startsWith("field##")
  );
};

/**
 * Type guard to check if a property signature has entity field annotation
 */
export const isEntityPropertySignature = (
  property: SchemaAST.PropertySignature
): boolean => {
  const entityFieldAnnotation = property.annotations[EntityFieldIdAnnotationId];
  return (
    entityFieldAnnotation !== undefined &&
    typeof entityFieldAnnotation === "string" &&
    entityFieldAnnotation.startsWith("field##")
  );
};

// ============================================================================
// AST MANIPULATION
// ============================================================================

const stampASTRecursively = (
  ast: SchemaAST.AST,
  entityId: EntityId,
  parentPath: ReadonlyArray<PropertyKey> = []
): SchemaAST.AST => {
  if (ast._tag !== "TypeLiteral") return ast;

  const signatures = SchemaAST.getPropertySignatures(ast);
  const stampedSignatures = signatures.map((sig) => {
    const currentPath = Array.append(parentPath, sig.name);

    // Recursively stamp if the type is also a TypeLiteral
    const stampedType =
      sig.type._tag === "TypeLiteral"
        ? stampASTRecursively(sig.type, entityId, currentPath)
        : sig.type;

    const fieldPath = currentPath.map((segment) => String(segment)).join(".");
    const fieldId = EntityFieldId.make(`field##${entityId}:${fieldPath}`);

    return new SchemaAST.PropertySignature(
      sig.name,
      stampedType,
      sig.isOptional,
      sig.isReadonly,
      {
        ...sig.annotations,
        [EntityFieldIdAnnotationId]: fieldId,
      }
    );
  });

  return new SchemaAST.TypeLiteral(stampedSignatures, ast.indexSignatures, {
    ...ast.annotations,
    [EntityIdAnnotationId]: entityId,
    [SchemaAST.IdentifierAnnotationId]: entityId,
  });
};

/**
 * Create a match pattern for extracting entity field signatures
 */
export const createEntityFieldMatch = (): SchemaAST.Match<Array<string>> => ({
  // Handle TypeLiteral (struct-like schemas)
  TypeLiteral: (ast, compile, path) => {
    let signatures: Array<string> = [];

    // Check if current AST node is an entity field
    if (isEntityField(ast)) {
      const fieldId = ast.annotations[EntityFieldIdAnnotationId];
      const pathStr = path.length > 0 ? path.join(".") : "root";
      if (typeof fieldId === "string") {
        signatures = Array.append(signatures, `${pathStr}:${ast._tag}:${fieldId}`);
      }
    }

    // Process property signatures - check their annotations for entity fields
    ast.propertySignatures.forEach((property) => {
      // Check if this property signature has entity field annotation
      if (isEntityPropertySignature(property)) {
        const entityFieldAnnotation = property.annotations[
          EntityFieldIdAnnotationId
        ];
        if (typeof entityFieldAnnotation === "string") {
          const pathStr = path.length > 0 ? path.join(".") : "root";
          signatures = Array.append(
            signatures,
            `${pathStr}.${String(
              property.name
            )}:PropertySignature:${entityFieldAnnotation}`
          );
        }
      }

      const childPath = Array.append(path, property.name);
      const childSignatures = compile(property.type, childPath);
      signatures = Array.appendAll(signatures, childSignatures);
    });

    return signatures;
  },

  Union: (ast, compile, path) => {
    let signatures: Array<string> = [];
    ast.types.forEach((type, index) => {
      const childPath = Array.append(path, `union_${index}`);
      signatures = Array.appendAll(signatures, compile(type, childPath));
    });
    return signatures;
  },

  TupleType: (ast, compile, path) => {
    let signatures: Array<string> = [];
    ast.elements.forEach((element, index) => {
      const childPath = Array.append(path, `tuple_${index}`);
      signatures = Array.appendAll(signatures, compile(element.type, childPath));
    });
    ast.rest.forEach((restType, index) => {
      const childPath = Array.append(path, `rest_${index}`);
      signatures = Array.appendAll(signatures, compile(restType.type, childPath));
    });
    return signatures;
  },

  Refinement: (ast, compile, path) => compile(ast.from, path),

  Transformation: (ast, compile, path) =>
    Array.appendAll(
      compile(ast.from, Array.append(path, "from")),
      compile(ast.to, Array.append(path, "to"))
    ),

  // Handle Suspend (recursive) types
  Suspend: () => [],

  // Handle primitive types
  StringKeyword: () => [],
  NumberKeyword: () => [],
  BooleanKeyword: () => [],
  BigIntKeyword: () => [],
  SymbolKeyword: () => [],
  ObjectKeyword: () => [],

  // Handle literal types
  Literal: () => {
    return [];
  },

  // Handle other primitive types
  UndefinedKeyword: () => [],
  VoidKeyword: () => [],
  NeverKeyword: () => [],
  UnknownKeyword: () => [],
  AnyKeyword: () => [],

  // Handle template literals
  TemplateLiteral: () => [],

  // Handle enums
  Enums: () => [],

  // Handle unique symbols
  UniqueSymbol: () => [],

  // Handle declarations
  Declaration: (ast, compile, path) => {
    let signatures: Array<string> = [];
    ast.typeParameters.forEach((typeParameter, index) => {
      signatures = Array.appendAll(
        signatures,
        compile(typeParameter, Array.append(path, `typeParameter_${index}`))
      );
    });
    return signatures;
  },
});

// ============================================================================
// ENTITY MODELS
// ============================================================================

/**
 * Entity interface - a schema with entity-specific annotations
 * This creates a type-safe DSL for entity schemas
 *
 * @template A - The decoded/type representation (must be a structured object)
 * @template I - The encoded/input representation (defaults to A)
 * @template R - The context/requirements type
 */
export type Entity<
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
> = Schema.Schema<A, I, R>;

/**
 * Entity for array-based schemas (tuples, arrays)
 *
 * @template A - The decoded/type representation (must be an array)
 * @template I - The encoded/input representation (defaults to A)
 * @template R - The context/requirements type
 */
export type EntityArray<
  A extends ReadonlyArray<unknown>,
  I extends ReadonlyArray<unknown> = A,
  R = never
> = Schema.Schema<A, I, R>;

/**
 * Union type for all valid Entity schemas
 */
export type EntitySchema =
  | Entity<Readonly<Record<string, unknown>>>
  | EntityArray<ReadonlyArray<unknown>>;
export type EntityWithMetadata<
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never,
> = Entity<A, I, R> & {
  readonly _tag: "Entity";
  readonly schema: Entity<A, I, R>;
  readonly entityId: EntityId;
  readonly schemaId: SchemaId;
};

/**
 * Type guard to ensure a schema has entity annotations
 * This validates that a schema is part of our entity universe
 */
export const hasEntityAnnotations = (
  schema: Schema.Schema.Any
): schema is EntitySchema => {
  const entityId = SchemaAST.getAnnotation<EntityId>(EntityIdAnnotationId)(
    schema.ast
  );
  const identifier = SchemaAST.getAnnotation<EntityId>(
    SchemaAST.IdentifierAnnotationId
  )(schema.ast);

  return Option.isSome(entityId) && Option.isSome(identifier);
};

/**
 * Validate that a schema has entity annotations and return the entity ID
 * This provides type-safe access to entity annotations
 */
export const validateEntitySchema = (
  schema: Schema.Schema.Any
): Option.Option<EntityId> => {
  if (hasEntityAnnotations(schema)) {
    return getEntityIdFromAnnotations(schema.ast);
  }
  return Option.none();
};

// ============================================================================
// ENTITY CREATION
// ============================================================================

/**
 * Create an Entity from fields with guaranteed entity annotations
 * This ensures the schema is part of our entity universe with type-safe annotations
 */
export const MakeEntitySchema = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(options: {
  schema: Schema.Schema<A, I, R>;
  name: string;
  entityId?: EntityId;
  schemaId?: SchemaId;
}): Entity<A, I, R> => {
  const entityId = options.entityId ?? MakeEntityId();
  const schemaId = options.schemaId ?? MakeSchemaId(options.name);

  const stampedAST = stampASTRecursively(options.schema.ast, entityId);

  return Schema.make(stampedAST).pipe(
    Schema.annotations({
      [EntityIdAnnotationId]: entityId,
      [SchemaAST.IdentifierAnnotationId]: entityId,
      [SchemaAST.DescriptionAnnotationId]: `Entity schema: ${options.name}`,
      [SchemaAST.SchemaIdAnnotationId]: schemaId,
    })
  ) as Entity<A, I, R>;
};

/**
 * Create an EntityArray from array-based schemas with guaranteed entity annotations
 */
export const MakeEntityArraySchema = <
  A extends ReadonlyArray<unknown>,
  I extends ReadonlyArray<unknown> = A,
  R = never
>(options: {
  schema: Schema.Schema<A, I, R>;
  name: string;
  entityId?: EntityId;
  schemaId?: SchemaId;
}): EntityArray<A, I, R> => {
  const entityId = options.entityId ?? MakeEntityId();
  const schemaId = options.schemaId ?? MakeSchemaId(options.name);

  const stampedAST = stampASTRecursively(options.schema.ast, entityId);

  return Schema.make(stampedAST).pipe(
    Schema.annotations({
      [EntityIdAnnotationId]: entityId,
      [SchemaAST.IdentifierAnnotationId]: entityId,
      [SchemaAST.DescriptionAnnotationId]: `Entity array schema: ${options.name}`,
      [SchemaAST.SchemaIdAnnotationId]: schemaId,
    })
  ) as EntityArray<A, I, R>;
};

export const MakeEntity = (
  schemaOrFields: Schema.Schema.Any | Schema.Struct.Fields,
  options: {
    readonly name: string;
    readonly entityId?: EntityId;
    readonly schemaId?: SchemaId;
  }
): EntityWithMetadata<Readonly<Record<string, unknown>>> => {
  const schema =
    Schema.isSchema(schemaOrFields)
      ? schemaOrFields
      : Schema.Struct(schemaOrFields);
  const makeOptions: {
    schema: Schema.Schema.Any;
    name: string;
    entityId?: EntityId;
    schemaId?: SchemaId;
  } = {
    schema,
    name: options.name,
  };

  if (options.entityId !== undefined) {
    makeOptions.entityId = options.entityId;
  }
  if (options.schemaId !== undefined) {
    makeOptions.schemaId = options.schemaId;
  }

  const entity = MakeEntitySchema(
    makeOptions
  ) as Entity<Readonly<Record<string, unknown>>>;

  return Object.assign(entity, {
    _tag: "Entity" as const,
    schema: entity,
    entityId: getEntityId(entity),
    schemaId: getSchemaId(entity),
  });
};

export const isEntitySchema = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  schema: Schema.Schema.Any
): schema is Entity<A, I, R> => {
  return hasEntityAnnotations(schema);
};

export const isEntityArraySchema = <
  A extends ReadonlyArray<unknown>,
  I extends ReadonlyArray<unknown> = A,
  R = never
>(
  schema: Schema.Schema.Any
): schema is EntityArray<A, I, R> => {
  return hasEntityAnnotations(schema);
};

export const AnnotateId = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  entity: Entity<A, I, R>,
  entityId: EntityId
): Entity<A, I, R> => {
  return entity.pipe(
    Schema.annotations({
      [EntityIdAnnotationId]: entityId,
      [SchemaAST.IdentifierAnnotationId]: entityId,
    })
  ) as Entity<A, I, R>;
};

// ============================================================================
// ENTITY OPERATIONS
// ============================================================================

export const EntityPropHashSet = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  entity: Entity<A, I, R>
): HashSet.HashSet<string> => {
  const compiler = SchemaAST.getCompiler(createEntityFieldMatch());
  const fieldSignatures = compiler(entity.ast, []);
  return HashSet.fromIterable(fieldSignatures);
};

export const EntityHash = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  entity: Entity<A, I, R>
): number => {
  const entityPropHashSet = EntityPropHashSet(entity);
  return Hash.hash(entityPropHashSet);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper functions to extract entity metadata from schema
 */
export const getEntityId = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  entity: Entity<A, I, R>
): EntityId => {
  return entity.ast.annotations[EntityIdAnnotationId] as EntityId;
};

export const getSchemaId = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
  R = never
>(
  entity: Entity<A, I, R>
): SchemaId => {
  return entity.ast.annotations[SchemaAST.SchemaIdAnnotationId] as SchemaId;
};
