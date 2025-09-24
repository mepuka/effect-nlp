import { describe, expect, it } from "vitest";
import { Option, Schema, pipe } from "effect";
import { Annotations } from "../../src/Extraction/Annotations.js";
import {
  buildSchemaAstTree,
  extractLeaves,
  foldSchemaAst,
} from "../../src/Extraction/SchemaAstTree.js";

describe("SchemaAstTree", () => {
  it("builds immutable tree with annotation context", () => {
    const schema = pipe(
      Schema.Struct({
        person: pipe(
          Schema.Struct({
            name: Schema.String,
            age: Schema.Number,
          }),
          Annotations.withSemantic({ semanticType: "person" })
        ),
        tags: Schema.Array(Schema.String),
      }),
      Annotations.withSemantic({ semanticType: "root" })
    );

    const tree = buildSchemaAstTree(schema);
    expect(tree.root.path).toEqual([]);

    const rootSemantic = pipe(
      tree.root.context.semantic,
      Option.map((semantic) => semantic.semanticType)
    );
    expect(Option.getOrUndefined(rootSemantic)).toBe("root");

    expect(tree.root.children.length).toBe(2);
    const childPaths = tree.root.children.map((child) => child.path.join("."));
    expect(childPaths).toContain("person");
    expect(childPaths).toContain("tags");

    const personNode = tree.root.children.find(
      (child) => child.path[0] === "person"
    )!;
    const personSemantic = pipe(
      personNode.context.semantic,
      Option.map((semantic) => semantic.semanticType)
    );
    expect(Option.getOrUndefined(personSemantic)).toBe("person");
  });

  it("folds large schemas without stack overflow", () => {
    let schema: Schema.Schema.Any = Schema.String;
    for (let i = 0; i < 2000; i += 1) {
      schema = Schema.Struct({ [`level_${i}`]: schema });
    }

    const tree = buildSchemaAstTree(schema);

    const nodeCount = foldSchemaAst(
      tree.root,
      (_node, childCounts) =>
        // @ts-expect-error - childCounts is an array of numbers
        1 + childCounts.reduce((sum, count) => sum + count, 0)
    );

    expect(nodeCount).toBeGreaterThan(2000);

    const leaves = extractLeaves(tree);
    expect(leaves.length).toBe(1);
    expect(leaves[0].children.length).toBe(0);
  });
});
