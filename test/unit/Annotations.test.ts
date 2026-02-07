import { describe, expect, it } from "vitest";
import { Option, Schema } from "effect";
import { Annotations } from "../../src/Extraction/Annotations.js";

describe("Annotations", () => {
  it("attaches core annotations and round-trips", () => {
    const schema = Annotations.withCore(Schema.String, {
      title: "Title",
      description: "Description",
      documentation: "Doc",
      constraints: ["Must be present"],
    });

    const core = Annotations.getCore(schema.ast.annotations);
    expect(Option.isSome(core)).toBe(true);
    const value = Option.getOrUndefined(core)!;
    expect(value.title).toBe("Title");
    expect(value.description).toBe("Description");
    expect(value.constraints).toEqual(["Must be present"]);
    expect(value.documentation).toBe("Doc");
  });

  it("merges metadata helpers", () => {
    const schema = Annotations.withMetadata(Schema.String, {
      core: {
        title: "StringValue",
        description: "A string value",
      },
      role: { role: "field" },
      semantic: { semanticType: "scalar" },
      provenance: { source: "spec" },
    });

    const context = Annotations.getContext(schema.ast.annotations);
    expect(Option.isSome(context.core)).toBe(true);
    expect(Option.getOrUndefined(context.core)?.title).toBe("StringValue");
    expect(Option.getOrUndefined(context.role)?.role).toBe("field");
    expect(Option.getOrUndefined(context.semantic)?.semanticType).toBe(
      "scalar"
    );
    expect(Option.getOrUndefined(context.provenance)?.source).toBe("spec");
  });

  it("returns None when no annotations present", () => {
    const result = Annotations.getCore({});
    expect(Option.isNone(result)).toBe(true);
  });
});
