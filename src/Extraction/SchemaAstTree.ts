import type { Schema, SchemaAST } from "effect";
import { Data } from "effect";
import { Annotations } from "./Annotations.js";

export interface SchemaAstNode<Context> {
  readonly path: ReadonlyArray<PropertyKey>;
  readonly ast: SchemaAST.AST;
  readonly annotations: SchemaAST.Annotations;
  readonly context: Context;
  readonly children: ReadonlyArray<SchemaAstNode<Context>>;
}

export interface SchemaAstTree<Context> {
  readonly root: SchemaAstNode<Context>;
}

export interface BuildContext<Context> {
  readonly ast: SchemaAST.AST;
  readonly annotations: SchemaAST.Annotations;
  readonly path: ReadonlyArray<PropertyKey>;
  readonly parent: SchemaAstNode<Context> | undefined;
}

export interface BuildSchemaAstTreeOptions<Context> {
  readonly context: (info: BuildContext<Context>) => Context;
}

type BuildInput = Schema.Schema.Any | SchemaAST.AST;

type Pending<Context> = {
  readonly ast: SchemaAST.AST;
  readonly path: ReadonlyArray<PropertyKey>;
  readonly assign: (node: SchemaAstNode<Context>) => void;
  readonly parent: SchemaAstNode<Context> | undefined;
  readonly overrideAnnotations: SchemaAST.Annotations | undefined;
};

interface ChildDescriptor {
  readonly ast: SchemaAST.AST;
  readonly path: ReadonlyArray<PropertyKey>;
  readonly overrideAnnotations?: SchemaAST.Annotations;
}

export function buildSchemaAstTree(
  input: BuildInput
): SchemaAstTree<Annotations.Context>;
export function buildSchemaAstTree<Context>(
  input: BuildInput,
  options: BuildSchemaAstTreeOptions<Context>
): SchemaAstTree<Context>;
export function buildSchemaAstTree<Context>(
  input: BuildInput,
  options?: BuildSchemaAstTreeOptions<Context>
): SchemaAstTree<Context | Annotations.Context> {
  const ast = isSchema(input) ? input.ast : input;
  if (options?.context) {
    return buildInternal(ast, options.context);
  }
  return buildInternal(ast, (info) => Annotations.getContext(info.annotations));
}

function buildInternal<Context>(
  ast: SchemaAST.AST,
  contextFactory: (info: BuildContext<Context>) => Context
): SchemaAstTree<Context> {
  let rootNode: SchemaAstNode<Context> | undefined;
  const stack: Array<Pending<Context>> = [
    {
      ast,
      path: [],
      parent: undefined,
      overrideAnnotations: undefined,
      assign: (node) => {
        rootNode = node;
      },
    },
  ];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const baseAnnotations: SchemaAST.Annotations =
      current.ast.annotations ?? {};
    const annotations =
      current.overrideAnnotations !== undefined
        ? { ...baseAnnotations, ...current.overrideAnnotations }
        : baseAnnotations;

    const childDescriptors = collectChildren(current.ast, current.path);
    const children: Array<SchemaAstNode<Context>> = new Array(
      childDescriptors.length
    );

    const context = contextFactory({
      ast: current.ast,
      annotations,
      path: current.path,
      parent: current.parent,
    });

    const node: SchemaAstNode<Context> = {
      path: current.path,
      ast: current.ast,
      annotations,
      context,
      children,
    };

    current.assign(node);

    for (let index = childDescriptors.length - 1; index >= 0; index -= 1) {
      const descriptor = childDescriptors[index];
      stack.push({
        ast: descriptor.ast,
        path: descriptor.path,
        parent: node,
        overrideAnnotations: descriptor.overrideAnnotations,
        assign: (childNode) => {
          children[index] = childNode;
        },
      });
    }
  }

  if (rootNode === undefined) {
    throw SchemaAstTreeError.builderFailed();
  }

  return { root: rootNode };
}

export const foldSchemaAst = <Context, A>(
  root: SchemaAstNode<Context>,
  algebra: (node: SchemaAstNode<Context>, childResults: ReadonlyArray<A>) => A
): A => {
  const stack: Array<{ node: SchemaAstNode<Context>; processed: boolean }> = [
    { node: root, processed: false },
  ];
  const results = new Map<SchemaAstNode<Context>, A>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.processed) {
      const childResults = current.node.children.map((child) => {
        const result = results.get(child);
        if (result === undefined) {
          throw SchemaAstTreeError.missingFoldResult();
        }
        return result;
      });
      const value = algebra(current.node, childResults);
      results.set(current.node, value);
    } else {
      stack.push({ node: current.node, processed: true });
      for (
        let index = current.node.children.length - 1;
        index >= 0;
        index -= 1
      ) {
        stack.push({ node: current.node.children[index], processed: false });
      }
    }
  }

  const rootResult = results.get(root);
  if (rootResult === undefined) {
    throw SchemaAstTreeError.missingFoldResult();
  }
  return rootResult;
};

export const extractLeaves = <Context>(
  tree: SchemaAstTree<Context>
): ReadonlyArray<SchemaAstNode<Context>> => {
  const leaves: Array<SchemaAstNode<Context>> = [];
  const stack: Array<SchemaAstNode<Context>> = [tree.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      for (let index = 0; index < node.children.length; index += 1) {
        stack.push(node.children[index]);
      }
    }
  }

  return leaves;
};

function isSchema(input: BuildInput): input is Schema.Schema.Any {
  return (input as Schema.Schema.Any).ast !== undefined;
}

function collectChildren(
  ast: SchemaAST.AST,
  path: ReadonlyArray<PropertyKey>
): ReadonlyArray<ChildDescriptor> {
  switch (ast._tag) {
    case "TypeLiteral": {
      const descriptors: Array<ChildDescriptor> = [];
      for (const signature of ast.propertySignatures) {
        descriptors.push({
          ast: signature.type,
          path: [...path, signature.name],
          overrideAnnotations: signature.annotations ?? {},
        });
      }
      for (let index = 0; index < ast.indexSignatures.length; index += 1) {
        const signature = ast.indexSignatures[index];
        descriptors.push({
          ast: signature.type,
          path: [...path, `index_${index}`],
        });
      }
      return descriptors;
    }
    case "Union":
      return ast.types.map((child, index) => ({
        ast: child,
        path: [...path, `union_${index}`],
      }));
    case "TupleType": {
      const descriptors: Array<ChildDescriptor> = [];
      ast.elements.forEach((element, index) => {
        descriptors.push({
          ast: element.type,
          path: [...path, `tuple_${index}`],
          overrideAnnotations: element.annotations ?? {},
        });
      });
      ast.rest.forEach((restType, index) => {
        descriptors.push({
          ast: restType.type,
          path: [...path, `rest_${index}`],
          overrideAnnotations: restType.annotations ?? {},
        });
      });
      return descriptors;
    }
    case "Refinement":
      return [{ ast: ast.from, path }];
    case "Transformation":
      return [
        { ast: ast.from, path: [...path, "from"] },
        { ast: ast.to, path: [...path, "to"] },
      ];
    case "Suspend":
      return []; // avoid infinite recursion
    case "Declaration":
      return ast.typeParameters.map((typeParameter, index) => ({
        ast: typeParameter,
        path: [...path, `typeParameter_${index}`],
      }));
    case "TemplateLiteral":
    case "Literal":
    case "Enums":
    case "UniqueSymbol":
    case "UndefinedKeyword":
    case "VoidKeyword":
    case "NeverKeyword":
    case "UnknownKeyword":
    case "AnyKeyword":
    case "StringKeyword":
    case "NumberKeyword":
    case "BooleanKeyword":
    case "BigIntKeyword":
    case "SymbolKeyword":
    case "ObjectKeyword":
      return [];
    default:
      return assertNever(ast);
  }
}

function assertNever(value: never): never {
  throw SchemaAstTreeError.unexpectedTag(String((value as any)?._tag ?? value));
}

export class SchemaAstTreeError extends Data.TaggedError("SchemaAstTreeError")<{
  readonly message: string;
}> {
  static builderFailed(): SchemaAstTreeError {
    return new SchemaAstTreeError({
      message: "Schema AST builder failed to produce a root node",
    });
  }

  static missingFoldResult(): SchemaAstTreeError {
    return new SchemaAstTreeError({
      message: "Schema AST fold encountered an unexpected missing child result",
    });
  }

  static unexpectedTag(tag: string): SchemaAstTreeError {
    return new SchemaAstTreeError({
      message: `Unhandled Schema AST tag: ${tag}`,
    });
  }
}
