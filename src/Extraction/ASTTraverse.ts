/**
 * AST Traverse - Schema AST traversal and entity context extraction
 *
 * This module provides utilities to traverse Effect Schema ASTs and extract
 * entity contextual information from annotations, enabling the creation of
 * semantic context trees for prompt generation and schema analysis.
 */

import { SchemaAST, Effect, pipe, Chunk, HashMap, Option } from "effect";
import type { Entity, EntityId, EntityFieldId } from "./Entity.js";
import {
  EntityIdAnnotationId,
  EntityFieldIdAnnotationId,
  ParentEntityIdAnnotationId,
} from "./Entity.js";
import { Annotations } from "./Annotations.js";

// ============================================================================
// CORE TYPES FOR SCHEMA AST REPRESENTATION
// ============================================================================

/**
 * Represents a node in the schema AST tree with entity context
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
 * Simplified schema context focused on entity annotations and description
 */
export interface SchemaContext {
  readonly entityId: Option.Option<EntityId>;
  readonly entityFieldId: Option.Option<EntityFieldId>;
  readonly parentEntityId: Option.Option<EntityId>;
  readonly description: Option.Option<string>;
  readonly semanticType: Option.Option<string>;
  readonly annotations: Annotations.Context;
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
 * Extract entity context from schema annotations
 */
const extractEntityContextFromAnnotations = (
  annotations: SchemaAST.Annotations,
  _path: ReadonlyArray<PropertyKey>
): SchemaContext => {
  const entityId = Option.fromNullable(
    annotations[EntityIdAnnotationId] as EntityId
  );
  const entityFieldId = Option.fromNullable(
    annotations[EntityFieldIdAnnotationId] as EntityFieldId | undefined
  );
  const parentEntityId = Option.fromNullable(
    annotations[ParentEntityIdAnnotationId] as EntityId | undefined
  );
  const annotationContext = Annotations.getContext(annotations);
  const description = pipe(
    annotationContext.core,
    Option.flatMap((core) => Option.fromNullable(core.description)),
    Option.orElse(() =>
      Option.fromNullable(annotations["description"] as string | undefined)
    )
  );

  return {
    entityId,
    entityFieldId,
    parentEntityId,
    description,
    semanticType: Option.none(),
    annotations: annotationContext,
  };
};

// ============================================================================
// AST TRAVERSAL COMPILER
// ============================================================================

/**
 * AST traversal match patterns for different schema types
 */
const createASTTraversalMatch = (): SchemaAST.Match<SchemaASTNode> => ({
  // Handle TypeLiteral (struct-like schemas)
  TypeLiteral: (ast, compile, path) => {
    const context = extractEntityContextFromAnnotations(ast.annotations, path);

    // Process property signatures
    const children = pipe(
      ast.propertySignatures,
      Chunk.fromIterable,
      Chunk.map((property) => {
        const childPath = [...path, property.name];
        const childNode = compile(property.type, childPath);

        // Extract entity context from property annotations
        const propertyContext = extractEntityContextFromAnnotations(
          property.annotations || {},
          childPath
        );

        return {
          ...childNode,
          context: {
            ...childNode.context,
            // If this property has entity field annotation, use it
            entityFieldId: Option.isSome(propertyContext.entityFieldId)
              ? propertyContext.entityFieldId
              : childNode.context.entityFieldId,
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
      context: {
        ...context,
        semanticType: Option.some("struct"),
      },
    };
  },

  // Handle Union types
  Union: (ast, compile, path) => {
    const context = extractEntityContextFromAnnotations(ast.annotations, path);

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
    const context = extractEntityContextFromAnnotations(ast.annotations, path);

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
    const context = extractEntityContextFromAnnotations(ast.annotations, path);
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
    const context = extractEntityContextFromAnnotations(ast.annotations, path);
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
    const context = extractEntityContextFromAnnotations(ast.annotations, path);

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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("literal"),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("enum"),
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
      ...extractEntityContextFromAnnotations(ast.annotations, path),
      semanticType: Option.some("unique_symbol"),
    },
  }),

  // Handle declarations
  Declaration: (ast, compile, path) => {
    const context = extractEntityContextFromAnnotations(ast.annotations, path);

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
 * Build a complete schema AST tree from an Entity schema
 */
export const buildSchemaASTTree = <A, I, R>(
  entity: Entity<A, I, R>
): Effect.Effect<SchemaASTTree, never, R> => {
  return Effect.sync(() => {
    const ast = entity.ast;
    const compiler = SchemaAST.getCompiler(createASTTraversalMatch());
    const root = compiler(ast, []);

    // Build node maps for efficient lookup
    let nodeMap = HashMap.empty<string, SchemaASTNode>();
    let pathMap = HashMap.empty<string, SchemaASTNode>();

    const addNodeToMaps = (node: SchemaASTNode): void => {
      const pathKey = node.path.join(".");
      const entityIdKey = pipe(
        node.context.entityId,
        Option.map((id) => id),
        Option.getOrElse(() => pathKey)
      );

      nodeMap = HashMap.set(nodeMap, entityIdKey, node);
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
 * Find all entity nodes in the tree
 */
export const findEntityNodes = (
  tree: SchemaASTTree
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];

  const traverse = (node: SchemaASTNode): void => {
    if (Option.isSome(node.context.entityId)) {
      results.push(node);
    }
    node.children.forEach(traverse);
  };

  traverse(tree.root);
  return results;
};

/**
 * Find all entity field nodes in the tree
 */
export const findEntityFieldNodes = (
  tree: SchemaASTTree
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];

  const traverse = (node: SchemaASTNode): void => {
    if (Option.isSome(node.context.entityFieldId)) {
      results.push(node);
    }
    node.children.forEach(traverse);
  };

  traverse(tree.root);
  return results;
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

  // Add entity information
  Option.match(context.entityId, {
    onNone: () => {},
    onSome: (entityId) => parts.push(`Entity: ${entityId}`),
  });

  Option.match(context.entityFieldId, {
    onNone: () => {},
    onSome: (fieldId) => parts.push(`Field: ${fieldId}`),
  });

  Option.match(context.parentEntityId, {
    onNone: () => {},
    onSome: (parentId) => parts.push(`Parent: ${parentId}`),
  });

  // Add path
  parts.push(`Path: ${path}`);

  // Add description
  Option.match(context.description, {
    onNone: () => {},
    onSome: (desc) => parts.push(`Description: ${desc}`),
  });

  // Add semantic type
  Option.match(context.semanticType, {
    onNone: () => {},
    onSome: (type) => parts.push(`Type: ${type}`),
  });

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
