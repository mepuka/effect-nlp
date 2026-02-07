/**
 * Schema AST traversal utilities for entity extraction.
 *
 * Provides typed, immutable schema AST trees with entity-aware context
 * derived from annotations. The traversal APIs are stack-safe and integrate
 * with the typed annotation helpers defined in `Annotations.ts`.
 */

import { Effect, HashMap, Option, SchemaAST, pipe } from "effect";
import type { Entity, EntityFieldId, EntityId } from "./Entity.js";
import {
  EntityFieldIdAnnotationId,
  EntityIdAnnotationId,
  ParentEntityIdAnnotationId,
} from "./Entity.js";
import { Annotations } from "./Annotations.js";
import {
  buildSchemaAstTree as buildGenericSchemaAstTree,
  type BuildContext,
  type SchemaAstNode as GenericSchemaAstNode,
} from "./SchemaAstTree.js";

export type SchemaASTNode = GenericSchemaAstNode<SchemaContext>;

export interface SchemaASTTree {
  readonly root: SchemaASTNode;
  readonly nodeMap: HashMap.HashMap<string, SchemaASTNode>;
  readonly pathMap: HashMap.HashMap<string, SchemaASTNode>;
}

export interface SchemaContext {
  readonly entityId: Option.Option<EntityId>;
  readonly entityFieldId: Option.Option<EntityFieldId>;
  readonly parentEntityId: Option.Option<EntityId>;
  readonly identifier: Option.Option<SchemaAST.IdentifierAnnotation>;
  readonly title: Option.Option<string>;
  readonly description: Option.Option<string>;
  readonly semanticType: Option.Option<string>;
  readonly annotations: Annotations.Context;
}

export const buildSchemaASTTree = <
  A extends Readonly<Record<string, unknown>>,
  I extends Readonly<Record<string, unknown>> = A,
>(
  entity: Entity<A, I>
): Effect.Effect<SchemaASTTree> =>
  Effect.sync(() => {
    const genericTree = buildGenericSchemaAstTree<SchemaContext>(entity, {
      context: createSchemaContext,
    });

    let nodeMap = HashMap.empty<string, SchemaASTNode>();
    let pathMap = HashMap.empty<string, SchemaASTNode>();

    const addNode = (node: SchemaASTNode): void => {
      const pathKey = formatPath(node.path);
      const entityKey = Option.getOrElse(node.context.entityId, () => pathKey);
      nodeMap = HashMap.set(nodeMap, entityKey, node);
      pathMap = HashMap.set(pathMap, pathKey, node);
      node.children.forEach(addNode);
    };

    addNode(genericTree.root);

    return {
      root: genericTree.root,
      nodeMap,
      pathMap,
    };
  });

export const extractContextAtPath = (
  tree: SchemaASTTree,
  path: ReadonlyArray<PropertyKey>
): Option.Option<SchemaContext> =>
  pipe(HashMap.get(tree.pathMap, formatPath(path)), Option.map((node) => node.context));

export const findNodesBySemanticType = (
  tree: SchemaASTTree,
  semanticType: string
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];
  const stack: Array<SchemaASTNode> = [tree.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (
      Option.getOrElse(node.context.semanticType, () => deriveSemanticFromAst(node.ast)) ===
      semanticType
    ) {
      results.push(node);
    }
    for (let i = 0; i < node.children.length; i += 1) {
      stack.push(node.children[i]);
    }
  }

  return results;
};

export const findEntityNodes = (
  tree: SchemaASTTree
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];
  const stack: Array<SchemaASTNode> = [tree.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (Option.isSome(node.context.entityId)) {
      results.push(node);
    }
    for (let i = 0; i < node.children.length; i += 1) {
      stack.push(node.children[i]);
    }
  }

  return results;
};

export const findEntityFieldNodes = (
  tree: SchemaASTTree
): ReadonlyArray<SchemaASTNode> => {
  const results: Array<SchemaASTNode> = [];
  const stack: Array<SchemaASTNode> = [tree.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (Option.isSome(node.context.entityFieldId)) {
      results.push(node);
    }
    for (let i = 0; i < node.children.length; i += 1) {
      stack.push(node.children[i]);
    }
  }

  return results;
};

export const generatePromptContext = (node: SchemaASTNode): string => {
  const context = node.context;
  const path = formatPath(node.path);
  const parts: Array<string> = [];

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

  parts.push(`Path: ${path}`);

  Option.match(context.title, {
    onNone: () => {},
    onSome: (title) => parts.push(`Title: ${title}`),
  });

  Option.match(context.description, {
    onNone: () => {},
    onSome: (desc) => parts.push(`Description: ${desc}`),
  });

  Option.match(context.semanticType, {
    onNone: () => {},
    onSome: (type) => parts.push(`Type: ${type}`),
  });

  Option.match(context.annotations.role, {
    onNone: () => {},
    onSome: (role) => parts.push(`Role: ${role.role}`),
  });

  Option.match(context.annotations.provenance, {
    onNone: () => {},
    onSome: (prov) => {
      if (prov.source !== undefined) {
        parts.push(`Source: ${prov.source}`);
      }
      if (prov.comment !== undefined) {
        parts.push(`Comment: ${prov.comment}`);
      }
    },
  });

  return parts.join("\n");
};

export const generateSchemaPrompt = (
  tree: SchemaASTTree,
  rootPath: ReadonlyArray<PropertyKey> = []
): string => {
  const rootNode = pipe(
    HashMap.get(tree.pathMap, formatPath(rootPath)),
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

const createSchemaContext = (
  info: BuildContext<SchemaContext>
): SchemaContext => {
  const annotationsContext = Annotations.getContext(info.annotations);
  const entityId = Option.fromNullable(
    info.annotations[EntityIdAnnotationId] as EntityId | undefined
  );
  const entityFieldId = Option.fromNullable(
    info.annotations[EntityFieldIdAnnotationId] as EntityFieldId | undefined
  );
  const parentEntityId = Option.fromNullable(
    info.annotations[ParentEntityIdAnnotationId] as EntityId | undefined
  );
  const identifier = Option.fromNullable(
    info.annotations[
      SchemaAST.IdentifierAnnotationId
    ] as SchemaAST.IdentifierAnnotation | undefined
  );
  const title = pipe(
    annotationsContext.core,
    Option.flatMap((core) => Option.fromNullable(core.title)),
    Option.orElse(() =>
      Option.fromNullable(
        info.annotations[SchemaAST.TitleAnnotationId] as string | undefined
      )
    )
  );
  const description = pipe(
    annotationsContext.core,
    Option.flatMap((core) => Option.fromNullable(core.description)),
    Option.orElse(() =>
      Option.fromNullable(
        info.annotations[SchemaAST.DescriptionAnnotationId] as string | undefined
      )
    )
  );
  const semanticFromAnnotations = pipe(
    annotationsContext.semantic,
    Option.map((semantic) => semantic.semanticType)
  );
  const semanticType = Option.orElse(semanticFromAnnotations, () =>
    Option.some(deriveSemanticFromAst(info.ast))
  );

  return {
    entityId,
    entityFieldId,
    parentEntityId,
    identifier,
    title,
    description,
    semanticType,
    annotations: annotationsContext,
  };
};

const deriveSemanticFromAst = (ast: SchemaAST.AST): string => {
  switch (ast._tag) {
    case "TypeLiteral":
      return "struct";
    case "Union":
      return "union";
    case "TupleType":
      return "tuple";
    case "Refinement":
      return "refinement";
    case "Transformation":
      return "transformation";
    case "Suspend":
      return "recursive";
    case "StringKeyword":
      return "string";
    case "NumberKeyword":
      return "number";
    case "BooleanKeyword":
      return "boolean";
    case "BigIntKeyword":
      return "bigint";
    case "SymbolKeyword":
      return "symbol";
    case "ObjectKeyword":
      return "object";
    case "Literal":
      return "literal";
    case "UndefinedKeyword":
      return "undefined";
    case "VoidKeyword":
      return "void";
    case "NeverKeyword":
      return "never";
    case "UnknownKeyword":
      return "unknown";
    case "AnyKeyword":
      return "any";
    case "TemplateLiteral":
      return "template_literal";
    case "Enums":
      return "enum";
    case "UniqueSymbol":
      return "unique_symbol";
    case "Declaration":
      return "declaration";
    default:
      return "unknown";
  }
};

const formatPath = (path: ReadonlyArray<PropertyKey>): string =>
  path.map((segment) => (typeof segment === "symbol" ? segment.description ?? segment.toString() : String(segment))).join(".");
