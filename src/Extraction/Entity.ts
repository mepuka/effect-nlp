import { Array, Schema, SchemaAST, HashSet, Hash } from "effect";
import { randomUUID } from "node:crypto";

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
  EntityId
);

export const MakeEntityId = () => EntityId.make(`entity##${randomUUID()}`);
export const MakeSchemaId = (name: string) =>
  SchemaId.make(`schema-${name}-${Date.now()}`);

// Create a unique symbol for Entity identification
const EntityTypeAnnotationId = Symbol.for("Entity/Type");

const EntityFieldAnnotationId = Symbol.for("Entity/Field");

// Type-safe annotation interface
export interface EntityAnnotations {
  // Custom Entity annotation
  readonly [EntityTypeAnnotationId]: EntityId;
  readonly [SchemaAST.IdentifierAnnotationId]: EntityId;
  readonly [EntityFieldAnnotationId]: EntityFieldId;
}

const isEntityId = (id: string): id is EntityId => {
  return id.startsWith("entity##");
};

// EntitySchemaError removed as it's not currently used

/**
 * Entity interface
 */
export type Entity<
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
> = Schema.Schema<A, I, R>;

const stampASTRecursively = (
  ast: SchemaAST.AST,
  entityId: EntityId
): SchemaAST.AST => {
  if (ast._tag !== "TypeLiteral") return ast;

  const signatures = SchemaAST.getPropertySignatures(ast);
  const stampedSignatures = signatures.map((sig) => {
    // Recursively stamp if the type is also a TypeLiteral
    const stampedType =
      sig.type._tag === "TypeLiteral"
        ? stampASTRecursively(sig.type, entityId)
        : sig.type;

    return new SchemaAST.PropertySignature(
      sig.name,
      stampedType,
      sig.isOptional,
      sig.isReadonly,
      {
        ...sig.annotations,
        [EntityFieldAnnotationId]: Schema.decodeSync(EntityFieldId)(
          `field##${entityId}`
        ),
      }
    );
  });

  return new SchemaAST.TypeLiteral(stampedSignatures, ast.indexSignatures, {
    ...ast.annotations,
    [EntityTypeAnnotationId]: entityId,
    [SchemaAST.IdentifierAnnotationId]: entityId,
  });
};

/**
 * Create an Entity from fields
 */
export const MakeEntitySchema = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(options: {
  schema: Schema.Schema<A, I, R>;
  name: string;
  entityId?: EntityId;
}): Entity<A, I, R> => {
  const entityId = options.entityId ?? MakeEntityId();

  const stampedAST = stampASTRecursively(options.schema.ast, entityId);

  return Schema.make(stampedAST).pipe(
    Schema.annotations({
      identifier: entityId,
      schemaId: MakeSchemaId(options.name),
    })
  ) as Entity<A, I, R>;
};

export const isEntitySchema = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(
  schema: Schema.Schema.Any
): schema is Entity<A, I, R> => {
  return (
    isEntityId(schema.ast.annotations[EntityTypeAnnotationId] as string) &&
    isEntityId(
      schema.ast.annotations[SchemaAST.IdentifierAnnotationId] as string
    )
  );
};

/**
 * Type guard to check if an AST node is an entity field
 * Note: This checks AST node annotations, but entity field annotations are typically on property signatures
 */
const isEntityField = (ast: SchemaAST.AST): boolean => {
  const entityFieldAnnotation = ast.annotations[EntityFieldAnnotationId];
  return (
    entityFieldAnnotation !== undefined &&
    typeof entityFieldAnnotation === "string" &&
    entityFieldAnnotation.startsWith("field##")
  );
};

/**
 * Type guard to check if a property signature has entity field annotation
 */
const isEntityPropertySignature = (
  property: SchemaAST.PropertySignature
): boolean => {
  const entityFieldAnnotation = property.annotations[EntityFieldAnnotationId];
  return (
    entityFieldAnnotation !== undefined &&
    typeof entityFieldAnnotation === "string" &&
    entityFieldAnnotation.startsWith("field##")
  );
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
      const fieldId = ast.annotations[EntityFieldAnnotationId] as string;
      const pathStr = path.length > 0 ? path.join(".") : "root";
      signatures = Array.append(
        signatures,
        `${pathStr}:${ast._tag}:${fieldId}`
      );
    }

    // Process property signatures - check their annotations for entity fields
    ast.propertySignatures.forEach((property) => {
      // Check if this property signature has entity field annotation
      if (isEntityPropertySignature(property)) {
        const entityFieldAnnotation = property.annotations[
          EntityFieldAnnotationId
        ] as string;
        const pathStr = path.length > 0 ? path.join(".") : "root";
        signatures = Array.append(
          signatures,
          `${pathStr}.${String(
            property.name
          )}:PropertySignature:${entityFieldAnnotation}`
        );
      }

      const childPath = Array.append(path, property.name);
      const childSignatures = compile(property.type, childPath);
      signatures = Array.appendAll(signatures, childSignatures);
    });

    return signatures;
  },

  // Handle Union types
  Union: () => [],

  // Handle Tuple types
  TupleType: () => [],

  // Handle Refinement types
  Refinement: () => [],

  // Handle Transformation types

  Transformation: () => [],

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
  Declaration: () => {
    return [];
  },
});

export const EntityPropHashSet = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(
  entity: Entity<A, I, R>
): HashSet.HashSet<string> => {
  const compiler = SchemaAST.getCompiler(createEntityFieldMatch());
  const fieldSignatures = compiler(entity.ast, []);
  return HashSet.fromIterable(fieldSignatures);
};

export const EntityHash = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(
  entity: Entity<A, I, R>
): number => {
  const entityPropHashSet = EntityPropHashSet(entity);
  return Hash.hash(entityPropHashSet);
};

/**
 * Helper functions to extract entity metadata from schema
 */
export const getEntityId = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(
  entity: Entity<A, I, R>
): EntityId => {
  return entity.ast.annotations[EntityTypeAnnotationId] as EntityId;
};

export const getSchemaId = <
  A extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  I extends Readonly<Record<string, unknown>> | ReadonlyArray<unknown>,
  R = never
>(
  entity: Entity<A, I, R>
): SchemaId => {
  return entity.ast.annotations[SchemaAST.SchemaIdAnnotationId] as SchemaId;
};
