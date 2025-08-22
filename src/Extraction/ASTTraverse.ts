/**
 * AST Traverse - Schema AST traversal and context extraction
 *
 * This module provides utilities to traverse Effect Schema ASTs and extract
 * contextual information from annotations, enabling the creation of semantic
 * context trees for prompt generation and schema analysis.
 */

import type { Schema } from "effect";
import { SchemaAST, Effect, pipe, Chunk, HashMap, Option } from "effect";

// ============================================================================
// CORE TYPES FOR SCHEMA AST REPRESENTATION
// ============================================================================

/**
 * Represents a node in the schema AST tree with context
 */
export interface SchemaASTNode {
  readonly _tag: "SchemaASTNode";
  readonly path: ReadonlyArray<PropertyKey>;
  readonly ast: SchemaAST.AST;
  readonly annotations: SchemaAST.Annotations;
  readonly children: ReadonlyArray<SchemaASTNode>;
  readonly context: SchemaContext;
}

/**
 * Schema context extracted from annotations and usage
 */
export interface SchemaContext {
  readonly identifier: Option.Option<string>;
  readonly title: Option.Option<string>;
  readonly description: Option.Option<string>;
  readonly role: Option.Option<string>;
  readonly semanticType: Option.Option<string>;
  readonly examples: ReadonlyArray<string>;
  readonly constraints: ReadonlyArray<string>;
  readonly relationships: ReadonlyArray<SchemaRelationship>;
}

/**
 * Relationship between schemas
 */
export interface SchemaRelationship {
  readonly _tag: "SchemaRelationship";
  readonly targetPath: ReadonlyArray<PropertyKey>;
  readonly relationshipType: string;
  readonly context: string;
  readonly annotations: SchemaAST.Annotations;
}

/**
 * Schema AST Tree representation
 */
export interface SchemaASTTree {
  readonly _tag: "SchemaASTTree";
  readonly root: SchemaASTNode;
  readonly nodeMap: HashMap.HashMap<string, SchemaASTNode>;
  readonly pathMap: HashMap.HashMap<string, SchemaASTNode>;
}

// ============================================================================
// CONTEXT EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract context from schema annotations
 */
const extractContextFromAnnotations = (
  annotations: SchemaAST.Annotations,
  _path: ReadonlyArray<PropertyKey>
): SchemaContext => {
  const identifier = Option.fromNullable(annotations["identifier"] as string);
  const title = Option.fromNullable(annotations["title"] as string);
  const description = Option.fromNullable(annotations["description"] as string);
  const role = Option.fromNullable(annotations["role"] as string);
  const semanticType = Option.fromNullable(
    annotations["semanticType"] as string
  );

  const examples = Array.isArray(annotations["examples"])
    ? (annotations["examples"] as ReadonlyArray<string>)
    : [];

  const constraints = Array.isArray(annotations["constraints"])
    ? (annotations["constraints"] as ReadonlyArray<string>)
    : [];

  return {
    identifier,
    title,
    description,
    role,
    semanticType,
    examples,
    constraints,
    relationships: [],
  };
};

/**
 * Create a schema relationship
 */
const createSchemaRelationship = (
  targetPath: ReadonlyArray<PropertyKey>,
  relationshipType: string,
  context: string,
  annotations: SchemaAST.Annotations
): SchemaRelationship => ({
  _tag: "SchemaRelationship",
  targetPath,
  relationshipType,
  context,
  annotations,
});

// ============================================================================
// AST TRAVERSAL COMPILER
// ============================================================================

/**
 * AST traversal match patterns for different schema types
 */
const createASTTraversalMatch = (): SchemaAST.Match<SchemaASTNode> => ({
  // Handle TypeLiteral (struct-like schemas)
  TypeLiteral: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);

    // Process property signatures
    const children = pipe(
      ast.propertySignatures,
      Chunk.fromIterable,
      Chunk.map((property) => {
        const childPath = [...path, property.name];
        const childNode = compile(property.type, childPath);

        // Extract relationship context from property annotations
        const propertyContext = extractContextFromAnnotations(
          property.annotations || {},
          childPath
        );

        // Create relationship if this is a reference to another schema
        const relationship = Option.isSome(propertyContext.identifier)
          ? createSchemaRelationship(
              childPath,
              "property",
              `Field ${String(property.name)} in ${
                Option.getOrNull(context.identifier) || "schema"
              }`,
              property.annotations || {}
            )
          : null;

        return {
          ...childNode,
          context: {
            ...childNode.context,
            role: Option.some(`property:${String(property.name)}`),
            relationships: relationship ? [relationship] : [],
          },
        };
      }),
      Chunk.toArray
    );

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children,
      context,
    };
  },

  // Handle Union types
  Union: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);

    const children = pipe(
      ast.types,
      Chunk.fromIterable,
      Chunk.map((type, index) => {
        const childPath = [...path, `union_${index}`];
        return compile(type, childPath);
      }),
      Chunk.toArray
    );

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children,
      context: {
        ...context,
        semanticType: Option.some("union"),
      },
    };
  },

  // Handle Tuple types
  TupleType: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);

    const children = pipe(
      ast.elements,
      Chunk.fromIterable,
      Chunk.map((element, index) => {
        const childPath = [...path, `tuple_${index}`];
        return compile(element.type, childPath);
      }),
      Chunk.toArray
    );

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children,
      context: {
        ...context,
        semanticType: Option.some("tuple"),
      },
    };
  },

  // Handle Refinement types
  Refinement: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);
    const child = compile(ast.from, path);

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children: [child],
      context: {
        ...context,
        semanticType: Option.some("refinement"),
      },
    };
  },

  // Handle Transformation types
  Transformation: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);
    const child = compile(ast.from, path);

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children: [child],
      context: {
        ...context,
        semanticType: Option.some("transformation"),
      },
    };
  },

  // Handle Suspend (recursive) types
  Suspend: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children: [],
      context: {
        ...context,
        semanticType: Option.some("recursive"),
      },
    };
  },

  // Handle primitive types
  StringKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("string"),
    },
  }),

  NumberKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("number"),
    },
  }),

  BooleanKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("boolean"),
    },
  }),

  BigIntKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("bigint"),
    },
  }),

  SymbolKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("symbol"),
    },
  }),

  ObjectKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("object"),
    },
  }),

  // Handle literal types
  Literal: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("literal"),
      examples: [String(ast.literal)],
    },
  }),

  // Handle other primitive types
  UndefinedKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("undefined"),
    },
  }),

  VoidKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("void"),
    },
  }),

  NeverKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("never"),
    },
  }),

  UnknownKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("unknown"),
    },
  }),

  AnyKeyword: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("any"),
    },
  }),

  // Handle template literals
  TemplateLiteral: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("template_literal"),
    },
  }),

  // Handle enums
  Enums: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("enum"),
      examples: ast.enums.map(String),
    },
  }),

  // Handle unique symbols
  UniqueSymbol: (ast, compile, path) => ({
    _tag: "SchemaASTNode",
    path,
    ast,
    annotations: ast.annotations,
    children: [],
    context: {
      ...extractContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("unique_symbol"),
    },
  }),

  // Handle declarations
  Declaration: (ast, compile, path) => {
    const context = extractContextFromAnnotations(ast.annotations, path);

    return {
      _tag: "SchemaASTNode",
      path,
      ast,
      annotations: ast.annotations,
      children: [],
      context: {
        ...context,
        semanticType: Option.some("declaration"),
      },
    };
  },
});

// ============================================================================
// SCHEMA AST TREE BUILDER
// ============================================================================

/**
 * Build a complete schema AST tree from a schema
 */
export const buildSchemaASTTree = <A, I, R>(
  schema: Schema.Schema<A, I, R>
): Effect.Effect<SchemaASTTree, never, R> => {
  return Effect.sync(() => {
    const ast = schema.ast;
    const compiler = SchemaAST.getCompiler(createASTTraversalMatch());
    const root = compiler(ast, []);

    // Build node maps for efficient lookup
    let nodeMap = HashMap.empty<string, SchemaASTNode>();
    let pathMap = HashMap.empty<string, SchemaASTNode>();

    const addNodeToMaps = (node: SchemaASTNode): void => {
      const pathKey = node.path.join(".");
      const identifierKey =
        Option.getOrNull(node.context.identifier) || pathKey;

      nodeMap = HashMap.set(nodeMap, identifierKey, node);
      pathMap = HashMap.set(pathMap, pathKey, node);

      node.children.forEach(addNodeToMaps);
    };

    addNodeToMaps(root);

    return {
      _tag: "SchemaASTTree",
      root,
      nodeMap,
      pathMap,
    };
  });
};

// ============================================================================
// CONTEXT EXTRACTION AND ANALYSIS
// ============================================================================

/**
 * Extract context for a specific path in the schema tree
 */
export const extractContextAtPath = (
  tree: SchemaASTTree,
  path: ReadonlyArray<PropertyKey>
): Option.Option<SchemaContext> => {
  const pathKey = path.join(".");
  return pipe(
    HashMap.get(tree.pathMap, pathKey),
    Option.map((node) => node.context)
  );
};

/**
 * Find all nodes with a specific semantic type
 */
export const findNodesBySemanticType = (
  tree: SchemaASTTree,
  semanticType: string
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];

  const traverse = (node: SchemaASTNode): void => {
    if (Option.getOrNull(node.context.semanticType) === semanticType) {
      results.push(node);
    }
    node.children.forEach(traverse);
  };

  traverse(tree.root);
  return results;
};

/**
 * Get all relationships for a specific node
 */
export const getNodeRelationships = (
  tree: SchemaASTTree,
  nodePath: ReadonlyArray<PropertyKey>
): ReadonlyArray<SchemaRelationship> => {
  return pipe(
    HashMap.get(tree.pathMap, nodePath.join(".")),
    Option.map((node) => node.context.relationships),
    Option.getOrElse(() => [])
  );
};

// ============================================================================
// PROMPT GENERATION FROM SCHEMA CONTEXT
// ============================================================================

/**
 * Generate a prompt context from a schema node
 */
export const generatePromptContext = (node: SchemaASTNode): string => {
  const context = node.context;
  const path = node.path.join(".");

  const parts: Array<string> = [];

  // Add identifier/title
  const name =
    Option.getOrNull(context.title) ||
    Option.getOrNull(context.identifier) ||
    path;
  parts.push(`Schema: ${name}`);

  // Add description
  Option.match(context.description, {
    onNone: () => {},
    onSome: (desc) => parts.push(`Description: ${desc}`),
  });

  // Add role context
  Option.match(context.role, {
    onNone: () => {},
    onSome: (role) => parts.push(`Role: ${role}`),
  });

  // Add semantic type
  Option.match(context.semanticType, {
    onNone: () => {},
    onSome: (type) => parts.push(`Type: ${type}`),
  });

  // Add examples
  if (context.examples.length > 0) {
    parts.push(`Examples: ${context.examples.join(", ")}`);
  }

  // Add constraints
  if (context.constraints.length > 0) {
    parts.push(`Constraints: ${context.constraints.join(", ")}`);
  }

  // Add relationships
  if (context.relationships.length > 0) {
    const rels = context.relationships.map(
      (rel) => `${rel.relationshipType}: ${rel.context}`
    );
    parts.push(`Relationships: ${rels.join(", ")}`);
  }

  return parts.join("\n");
};

/**
 * Generate a comprehensive prompt for a schema subtree
 */
export const generateSchemaPrompt = (
  tree: SchemaASTTree,
  rootPath: ReadonlyArray<PropertyKey> = []
): string => {
  const rootNode = pipe(
    HashMap.get(tree.pathMap, rootPath.join(".")),
    Option.getOrElse(() => tree.root)
  );

  const parts: Array<string> = [];
  parts.push("=== SCHEMA CONTEXT ===");
  parts.push(generatePromptContext(rootNode));

  if (rootNode.children.length > 0) {
    parts.push("\n=== CHILD SCHEMAS ===");
    rootNode.children.forEach((child, index) => {
      parts.push(`\n${index + 1}. ${generatePromptContext(child)}`);
    });
  }

  return parts.join("\n");
};
