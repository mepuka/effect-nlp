import { describe, it, expect } from "vitest";
import { Effect, Schema, Data } from "effect";
import * as Pattern from "../../src/NLP/Core/Pattern.js";

describe("EntityPatternOptionFromString", () => {
  describe("decode", () => {
    it("should decode multiple entity types", () => {
      const input = Data.array(["CARDINAL", "TIME"] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[CARDINAL|TIME]");
    });

    it("should decode optional entity type", () => {
      const input = Data.array(["CARDINAL", ""] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[CARDINAL|]");
    });

    it("should decode single entity type", () => {
      const input = Data.array(["DATE"] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[DATE]");
    });

    it("should decode multiple with optional", () => {
      const input = Data.array(["MONEY", "PERCENT", ""] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[MONEY|PERCENT|]");
    });

    it("should error on empty string only", () => {
      const input = Data.array([""] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow(
        "Entity pattern must contain at least one valid entity type"
      );
    });

    it("should error on invalid entity type", () => {
      const input = Data.array(["INVALID"] as const);
      const result = Schema.decodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });
  });

  describe("encode", () => {
    it("should encode multiple entity types", () => {
      const input = "[CARDINAL|TIME]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(Data.array(["CARDINAL", "TIME"] as const));
    });

    it("should encode optional entity type", () => {
      const input = "[CARDINAL|]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(Data.array(["CARDINAL", ""] as const));
    });

    it("should encode single entity type", () => {
      const input = "[DATE]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(Data.array(["DATE"] as const));
    });

    it("should encode multiple with optional", () => {
      const input = "[MONEY|PERCENT|]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(Data.array(["MONEY", "PERCENT", ""] as const));
    });

    it("should error on empty option group", () => {
      const input = "[|]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should error on invalid bracket format", () => {
      const input = "[CARDINAL";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should error on invalid entity in string", () => {
      const input = "[INVALID|TIME]";
      const result = Schema.encodeUnknown(
        Pattern.EntityPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });
  });

  describe("round-trip", () => {
    it("should round-trip multiple entity types", () => {
      const original = Data.array(["CARDINAL", "TIME"] as const);
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          decoded
        )
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip optional entity type", () => {
      const original = Data.array(["CARDINAL", ""] as const);
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          decoded
        )
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip single entity type", () => {
      const original = Data.array(["DATE"] as const);
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.EntityPatternOptionToBracketString)(
          decoded
        )
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
        const input = Data.array([type] as const);
        const result = Schema.decodeUnknown(
          Pattern.EntityPatternOptionToBracketString
        )(input);
        expect(Effect.runSync(result)).toBe(`[${type}]`);
      }
    });
  });
});
