/**
 * Functional Annotation Parser - Using Effect's built-in types and combinators
 *
 * Clean, pipeable functional code for parsing schema annotations
 * using Effect's native annotation types and Doc interface.
 */

import {
  pipe,
  Option,
  HashMap,
  Chunk,
  Record,
  SchemaAST,
  Schema,
  String,
} from "effect";
import { Doc } from "@effect/printer";

// ============================================================================
// ANNOTATION TYPES (using Effect's built-in types)
// ============================================================================

/**
 * Schema context extracted from annotations
 */
export interface SchemaContext {
  readonly identifier: Option.Option<SchemaAST.IdentifierAnnotation>;
  readonly title: Option.Option<SchemaAST.TitleAnnotation>;
  readonly description: Option.Option<SchemaAST.DescriptionAnnotation>;
  readonly documentation: Option.Option<SchemaAST.DocumentationAnnotation>;
  readonly examples: Option.Option<SchemaAST.ExamplesAnnotation<unknown>>;
  readonly default: Option.Option<SchemaAST.DefaultAnnotation<unknown>>;
  readonly semanticType: Option.Option<string>;
  readonly role: Option.Option<string>;
  readonly metadata: HashMap.HashMap<string, unknown>;
}

// ============================================================================
// ANNOTATION EXTRACTION
// ============================================================================

/**
 * Extract built-in annotation using Option combinators
 */
const extractBuiltInAnnotation = <T>(
  annotations: SchemaAST.Annotations,
  annotationId: symbol
): Option.Option<T> => {
  return Option.fromNullable(annotations[annotationId] as T | undefined);
};

/**
 * Extract custom string annotation
 */
const extractCustomStringAnnotation = (
  annotations: SchemaAST.Annotations,
  key: string
): Option.Option<string> => {
  return Option.fromNullable(annotations[key] as string | undefined);
};

/**
 * Extract schema context from annotations using Effect's built-in functions
 */
export const extractSchemaContext = (
  annotations: SchemaAST.Annotations
): SchemaContext => {
  // Extract built-in annotations using Option combinators
  const builtInAnnotations = {
    identifier: extractBuiltInAnnotation<SchemaAST.IdentifierAnnotation>(
      annotations,
      SchemaAST.IdentifierAnnotationId
    ),
    title: extractBuiltInAnnotation<SchemaAST.TitleAnnotation>(
      annotations,
      SchemaAST.TitleAnnotationId
    ),
    description: extractBuiltInAnnotation<SchemaAST.DescriptionAnnotation>(
      annotations,
      SchemaAST.DescriptionAnnotationId
    ),
    documentation: extractBuiltInAnnotation<SchemaAST.DocumentationAnnotation>(
      annotations,
      SchemaAST.DocumentationAnnotationId
    ),
    examples: extractBuiltInAnnotation<SchemaAST.ExamplesAnnotation<unknown>>(
      annotations,
      SchemaAST.ExamplesAnnotationId
    ),
    default: extractBuiltInAnnotation<SchemaAST.DefaultAnnotation<unknown>>(
      annotations,
      SchemaAST.DefaultAnnotationId
    ),
    semanticType: extractCustomStringAnnotation(annotations, "semanticType"),
    role: extractCustomStringAnnotation(annotations, "role"),
  };

  // Extract metadata using Record combinators
  const metadata = pipe(
    annotations,
    Record.filter(
      (_, key) =>
        typeof key === "string" &&
        !Object.values(SchemaAST).includes(key as any)
    ),
    Record.map((value) => value),
    Object.entries,
    Chunk.fromIterable,
    Chunk.reduce(HashMap.empty<string, unknown>(), (acc, [key, value]) =>
      HashMap.set(acc, key, value)
    )
  );

  return {
    ...builtInAnnotations,
    metadata,
  };
};

// ============================================================================
// FUNCTIONAL DOCUMENTATION PRINTER
// ============================================================================

/**
 * Formatting options for schema visualization
 */
export interface SchemaFormatOptions {
  readonly showDescriptions: boolean;
  readonly showTypes: boolean;
  readonly showTitles: boolean;
  readonly maxDepth: number;
  readonly compact: boolean;
}

/**
 * Default formatting options
 */
export const defaultFormatOptions: SchemaFormatOptions = {
  showDescriptions: true,
  showTypes: true,
  showTitles: true,
  maxDepth: 10,
  compact: false,
};

/**
 * Minimal formatting options
 */
export const minimalFormatOptions: SchemaFormatOptions = {
  showDescriptions: false,
  showTypes: true,
  showTitles: false,
  maxDepth: 5,
  compact: true,
};

/**
 * Create a beautiful hierarchical schema tree with consistent design language
 */
export const schemaToDoc = (
  schema: Schema.Schema.Any,
  options: SchemaFormatOptions = defaultFormatOptions
): Doc.Doc<never> => {
  // Design constants for consistent aesthetics
  const TREE_BRANCH = "├─";
  const TREE_LAST = "└─";
  const TYPE_SEPARATOR = options.compact ? ":" : " :: ";
  const COMMENT_PREFIX = "-- ";

  // Create a compiler that generates beautiful Doc representations
  const createDocMatch = (): SchemaAST.Match<Doc.Doc<never>> => ({
    TypeLiteral: (ast, compile, path) => {
      // Check depth limit
      if (path.length >= options.maxDepth) {
        return Doc.text("... (max depth)");
      }

      const context = extractSchemaContext(ast.annotations);

      // Schema header with elegant formatting
      const schemaHeader = pipe(
        [
          pipe(
            Option.orElse(context.title, () => context.identifier),
            Option.match({
              onNone: () => "Schema",
              onSome: (name) => name,
            })
          ),
          pipe(
            context.semanticType,
            Option.match({
              onNone: () => "Schema",
              onSome: (type) => type,
            })
          ),
        ],
        ([name, type]) => {
          if (options.compact) {
            return Doc.text(`${name}${TYPE_SEPARATOR}${type}`);
          }
          return Doc.hsep([
            Doc.text(pipe(name, String.padEnd(20))),
            Doc.text(TYPE_SEPARATOR),
            Doc.text(type),
          ]);
        }
      );

      // Description with consistent comment styling
      const description = pipe(
        context.description,
        Option.match({
          onNone: () => Doc.empty,
          onSome: (desc) =>
            options.showDescriptions
              ? Doc.hsep([Doc.text(COMMENT_PREFIX), Doc.text(desc)])
              : Doc.empty,
        })
      );

      // Process property signatures with beautiful tree structure
      const propertyDocs = ast.propertySignatures.map((prop, index) => {
        const isLast = index === ast.propertySignatures.length - 1;
        const connector = isLast ? TREE_LAST : TREE_BRANCH;
        const propName = prop.name.toString();

        // Get property context for annotations
        const propContext = extractSchemaContext(prop.annotations || {});
        const propTitle = pipe(
          propContext.title,
          Option.match({
            onNone: () => "",
            onSome: (title) => (options.showTitles ? ` (${title})` : ""),
          })
        );

        // Get elegant type display
        const typeName = options.showTypes ? getTypeDisplayName(prop.type) : "";

        // Create property line with consistent spacing
        const propertyLine = options.compact
          ? Doc.text(
              `${connector}${propName}${TYPE_SEPARATOR}${typeName}${propTitle}`
            )
          : Doc.hsep([
              Doc.text(connector),
              Doc.text(pipe(propName, String.padEnd(12))),
              Doc.text(TYPE_SEPARATOR),
              Doc.text(typeName),
              Doc.text(propTitle),
            ]);

        // Recursively compile nested schemas with proper alignment
        const nestedDoc = compile(prop.type, [...path, prop.name]);

        return nestedDoc === Doc.empty
          ? propertyLine
          : Doc.vsep([propertyLine, pipe(nestedDoc, Doc.nest(2), Doc.align)]);
      });

      // Compose the complete schema representation
      const structure =
        propertyDocs.length > 0 ? Doc.vsep(propertyDocs) : Doc.empty;

      return pipe(
        [schemaHeader, description, structure],
        Chunk.fromIterable,
        Chunk.filter((doc) => doc !== Doc.empty),
        Chunk.toArray,
        Doc.vsep
      );
    },

    // Handle primitive types elegantly - return empty for leaves
    StringKeyword: () => Doc.empty,
    NumberKeyword: () => Doc.empty,
    BooleanKeyword: () => Doc.empty,
    BigIntKeyword: () => Doc.empty,
    SymbolKeyword: () => Doc.empty,
    ObjectKeyword: () => Doc.empty,
    UndefinedKeyword: () => Doc.empty,
    VoidKeyword: () => Doc.empty,
    NeverKeyword: () => Doc.empty,
    UnknownKeyword: () => Doc.empty,
    AnyKeyword: () => Doc.empty,
    Literal: () => Doc.empty,
    UniqueSymbol: () => Doc.empty,
    TemplateLiteral: () => Doc.empty,
    Enums: () => Doc.empty,

    // Handle complex types with consistent styling
    Union: (ast, compile, path) => {
      return ast.types.length > 0 ? compile(ast.types[0], path) : Doc.empty;
    },
    TupleType: () => Doc.empty,
    Refinement: (ast, compile, path) => compile(ast.from, path),
    Transformation: (ast, compile, path) => compile(ast.from, path),
    Suspend: () => Doc.empty,
    Declaration: (ast, _compile, _path) => {
      const context = extractSchemaContext(ast.annotations);
      const name = pipe(
        Option.orElse(context.title, () => context.identifier),
        Option.match({
          onNone: () => "Declaration",
          onSome: (name) => name,
        })
      );
      return Doc.hsep([
        Doc.text(TREE_LAST),
        Doc.text(pipe(name, String.padEnd(12))),
        Doc.text(TYPE_SEPARATOR),
        Doc.text("Declaration"),
      ]);
    },
  });

  // Helper for consistent type display names
  const getTypeDisplayName = (ast: SchemaAST.AST): string => {
    switch (ast._tag) {
      case "StringKeyword":
        return "String";
      case "NumberKeyword":
        return "Number";
      case "BooleanKeyword":
        return "Boolean";
      case "BigIntKeyword":
        return "BigInt";
      case "SymbolKeyword":
        return "Symbol";
      case "ObjectKeyword":
        return "Object";
      case "TypeLiteral": {
        const annotations = ast.annotations;
        const title = annotations[SchemaAST.TitleAnnotationId] as
          | string
          | undefined;
        const identifier = annotations[SchemaAST.IdentifierAnnotationId] as
          | string
          | undefined;
        return title || identifier || "Object";
      }
      case "Declaration": {
        const annotations = ast.annotations;
        const title = annotations[SchemaAST.TitleAnnotationId] as
          | string
          | undefined;
        const identifier = annotations[SchemaAST.IdentifierAnnotationId] as
          | string
          | undefined;
        return title || identifier || "Declaration";
      }
      case "Union":
        return "Union";
      case "Literal":
        return `"${ast.literal}"`;
      case "Refinement": {
        // Handle Array types
        if (
          ast.from._tag === "TypeLiteral" &&
          ast.from.propertySignatures.length === 0
        ) {
          return "Array";
        }
        return getTypeDisplayName(ast.from);
      }
      case "Transformation": {
        // Handle more complex transformations
        return getTypeDisplayName(ast.from);
      }
      default:
        return "Unknown";
    }
  };

  // Compile with beautiful rendering
  const compiler = SchemaAST.getCompiler(createDocMatch());
  return compiler(schema.ast, []);
};

/**
 * Create a beautiful hierarchical schema context representation
 */
export const contextToDoc = (context: SchemaContext): Doc.Doc<never> => {
  // Design constants matching schemaToDoc
  const TREE_BRANCH = "├─";
  const TREE_LAST = "└─";
  const TYPE_SEPARATOR = " :: ";
  const COMMENT_PREFIX = "-- ";

  // Schema header with elegant formatting
  const schemaHeader = pipe(
    [
      pipe(
        Option.orElse(context.title, () => context.identifier),
        Option.match({
          onNone: () => "Schema",
          onSome: (name) => name,
        })
      ),
      pipe(
        context.semanticType,
        Option.match({
          onNone: () => "Schema",
          onSome: (type) => type,
        })
      ),
    ],
    ([name, type]) =>
      Doc.hsep([
        Doc.text(pipe(name, String.padEnd(20))),
        Doc.text(TYPE_SEPARATOR),
        Doc.text(type),
      ])
  );

  // Role annotation with consistent styling
  const roleAnnotation = pipe(
    context.role,
    Option.match({
      onNone: () => Doc.empty,
      onSome: (role) =>
        Doc.hsep([
          Doc.text(pipe("role", String.padEnd(20))),
          Doc.text(TYPE_SEPARATOR),
          Doc.text(role),
        ]),
    })
  );

  // Description with beautiful comment formatting
  const description = pipe(
    context.description,
    Option.match({
      onNone: () => Doc.empty,
      onSome: (desc) => Doc.hsep([Doc.text(COMMENT_PREFIX), Doc.text(desc)]),
    })
  );

  // Metadata properties with elegant tree structure
  const metadataProperties = pipe(
    [
      pipe(
        context.default,
        Option.map(() => "default")
      ),
      pipe(
        context.documentation,
        Option.map(() => "docs")
      ),
      pipe(context.metadata, (metadata) =>
        HashMap.size(metadata) > 0 ? Option.some("meta") : Option.none()
      ),
    ],
    Chunk.fromIterable,
    Chunk.compact,
    Chunk.toArray,
    (props) => {
      if (props.length === 0) return Doc.empty;

      const propertyDocs = props.map((label, index) => {
        const isLast = index === props.length - 1;
        const connector = isLast ? TREE_LAST : TREE_BRANCH;

        return Doc.hsep([
          Doc.text(connector),
          Doc.text(pipe(label, String.padEnd(12))),
          Doc.text(TYPE_SEPARATOR),
          Doc.text("{...}"),
        ]);
      });

      return Doc.vsep(propertyDocs);
    }
  );

  // Beautiful composition with consistent spacing
  return pipe(
    [schemaHeader, roleAnnotation, description, metadataProperties],
    Chunk.fromIterable,
    Chunk.filter((doc) => doc !== Doc.empty),
    Chunk.toArray,
    Doc.vsep
  );
};

/**
 * Create a Doc for raw annotations with algebraic interpretation
 */
export const annotationsToDoc = (
  annotations: SchemaAST.Annotations
): Doc.Doc<never> => {
  return pipe(annotations, extractSchemaContext, contextToDoc);
};

// ============================================================================
// PIPEABLE TRANSFORMS
// ============================================================================

/**
 * Transform annotations to context
 */
export const toContext = (
  annotations: SchemaAST.Annotations
): SchemaContext => {
  return extractSchemaContext(annotations);
};

/**
 * Transform context to documentation
 */
export const toDoc = (context: SchemaContext): Doc.Doc<never> => {
  return contextToDoc(context);
};

/**
 * Transform annotations to documentation
 */
export const annotationsToDocumentation = (
  annotations: SchemaAST.Annotations
): Doc.Doc<never> => {
  return pipe(annotations, toContext, toDoc);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if annotations contain a specific built-in annotation
 */
export const hasBuiltInAnnotation = (
  annotations: SchemaAST.Annotations,
  annotationId: symbol
): boolean => {
  return pipe(
    annotations[annotationId] as unknown | undefined,
    Option.fromNullable,
    Option.isSome
  );
};

/**
 * Get built-in annotation value
 */
export const getBuiltInAnnotation = <A>(
  annotations: SchemaAST.Annotations,
  annotationId: symbol
): Option.Option<A> => {
  return pipe(annotations[annotationId] as A | undefined, Option.fromNullable);
};

/**
 * Filter annotations by predicate using Record combinators
 */
export const filterAnnotations = (
  annotations: SchemaAST.Annotations,
  predicate: (key: string | symbol, value: unknown) => boolean
): SchemaAST.Annotations => {
  return pipe(
    annotations,
    Record.filter((value, key) => {
      const keyValue = key.startsWith("Symbol(")
        ? Object.getOwnPropertySymbols(annotations).find(
            (s) => s.toString() === key
          ) || key
        : key;
      return predicate(keyValue, value);
    })
  );
};

/**
 * Create a schema with annotations
 */
export const createAnnotatedSchema = <A>(
  schema: Schema.Schema<A>,
  annotations: Schema.Annotations.GenericSchema<A>
): Schema.Schema<A> => {
  return Schema.annotations(schema, annotations);
};
