import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import { EntityPatternOptionFromString } from "../../src/NLP/Core/Pattern.js";

describe("EntityPatternOptionFromString", () => {
  describe("decode", () => {
    it("should decode multiple entity types", () => {
      const input = ["CARDINAL", "TIME"];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toBe("[CARDINAL|TIME]");
    });

    it("should decode optional entity type", () => {
      const input = ["CARDINAL", ""];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toBe("[CARDINAL|]");
    });

    it("should decode single entity type", () => {
      const input = ["DATE"];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toBe("[DATE]");
    });

    it("should decode multiple with optional", () => {
      const input = ["MONEY", "PERCENT", ""];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toBe("[MONEY|PERCENT|]");
    });

    it("should error on empty string only", () => {
      const input = [""];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(() => Effect.runSync(result)).toThrow(
        "Entity pattern must contain at least one valid entity type"
      );
    });

    it("should error on invalid entity type", () => {
      const input = ["INVALID"];
      const result = Schema.decodeUnknown(EntityPatternOptionFromString)(input);
      expect(() => Effect.runSync(result)).toThrow();
    });
  });

  describe("encode", () => {
    it("should encode multiple entity types", () => {
      const input = "[CARDINAL|TIME]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toEqual(["CARDINAL", "TIME"]);
    });

    it("should encode optional entity type", () => {
      const input = "[CARDINAL|]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toEqual(["CARDINAL", ""]);
    });

    it("should encode single entity type", () => {
      const input = "[DATE]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toEqual(["DATE"]);
    });

    it("should encode multiple with optional", () => {
      const input = "[MONEY|PERCENT|]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(Effect.runSync(result)).toEqual(["MONEY", "PERCENT", ""]);
    });

    it("should error on empty option group", () => {
      const input = "[|]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should error on invalid bracket format", () => {
      const input = "[CARDINAL";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should error on invalid entity in string", () => {
      const input = "[INVALID|TIME]";
      const result = Schema.encodeUnknown(EntityPatternOptionFromString)(input);
      expect(() => Effect.runSync(result)).toThrow();
    });
  });

  describe("round-trip", () => {
    it("should round-trip multiple entity types", () => {
      const original = ["CARDINAL", "TIME"];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(EntityPatternOptionFromString)(original)
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(EntityPatternOptionFromString)(decoded)
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip optional entity type", () => {
      const original = ["CARDINAL", ""];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(EntityPatternOptionFromString)(original)
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(EntityPatternOptionFromString)(decoded)
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip single entity type", () => {
      const original = ["DATE"];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(EntityPatternOptionFromString)(original)
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(EntityPatternOptionFromString)(decoded)
      );
      expect(encoded).toEqual(original);
    });
  });

  describe("all entity types", () => {
    it("should handle all entity types", () => {
      const entityTypes = [
        "DATE",
        "ORDINAL",
        "CARDINAL",
        "MONEY",
        "PERCENT",
        "TIME",
        "DURATION",
        "HASHTAG",
        "EMOJI",
        "EMOTICON",
        "EMAIL",
        "URL",
        "MENTION",
      ];

      for (const type of entityTypes) {
        const input = [type];
        const result = Schema.decodeUnknown(EntityPatternOptionFromString)(
          input
        );
        expect(Effect.runSync(result)).toBe(`[${type}]`);
      }
    });
  });
});
