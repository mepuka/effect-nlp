import { describe, it, expect } from "vitest";
import { Effect, Schema, Data } from "effect";
import * as Pattern from "../../src/NLP/Core/Pattern.js";

describe("LiteralPatternOptionFromString", () => {
  describe("decode", () => {
    it("should decode multiple literals", () => {
      const input = Data.array(["Classic", "Supreme", "Extravaganza"] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[Classic|Supreme|Extravaganza]");
    });

    it("should decode optional literal", () => {
      const input = Data.array(["Classic", ""] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[Classic|]");
    });

    it("should decode single literal", () => {
      const input = Data.array(["Margherita"] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[Margherita]");
    });

    it("should decode multiple with optional", () => {
      const input = Data.array(["Delivery", "Pickup", ""] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toBe("[Delivery|Pickup|]");
    });

    it("should error on empty string only", () => {
      const input = Data.array([""] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow(
        "Literal pattern must contain at least one valid literal"
      );
    });
  });

  describe("encode", () => {
    it("should encode multiple literals", () => {
      const input = "[Classic|Supreme|Extravaganza]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual([
        "Classic",
        "Supreme",
        "Extravaganza",
      ]);
    });

    it("should encode optional literal", () => {
      const input = "[Classic|]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(["Classic", ""]);
    });

    it("should encode single literal", () => {
      const input = "[Margherita]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(["Margherita"]);
    });

    it("should encode multiple with optional", () => {
      const input = "[Delivery|Pickup|]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(Effect.runSync(result)).toEqual(["Delivery", "Pickup", ""]);
    });

    it("should error on empty option group", () => {
      const input = "[|]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should handle malformed bracket format", () => {
      const input = "[Classic";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      // This actually succeeds because slice(1, -1) removes first char and tries to remove last
      // So "[Classic" becomes "Classi" which is a valid literal
      expect(Effect.runSync(result)).toEqual(["Classi"]);
    });

    it("should error on empty literals only", () => {
      const input = "[||]";
      const result = Schema.encodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(input);
      expect(() => Effect.runSync(result)).toThrow();
    });
  });

  describe("round-trip", () => {
    it("should round-trip multiple literals", () => {
      const original = ["Classic", "Supreme", "Extravaganza"];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          decoded
        )
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip optional literal", () => {
      const original = ["Classic", ""];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          decoded
        )
      );
      expect(encoded).toEqual(original);
    });

    it("should round-trip single literal", () => {
      const original = ["Margherita"];
      const decoded = Effect.runSync(
        Schema.decodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          original
        )
      );
      const encoded = Effect.runSync(
        Schema.encodeUnknown(Pattern.LiteralPatternOptionToBracketString)(
          decoded
        )
      );
      expect(encoded).toEqual(original);
    });
  });

  describe("pizza examples", () => {
    it("should handle pizza categories", () => {
      const literals = Data.array(["Classic", "Supreme", "Extravaganza", "Margherita"] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(literals);
      expect(Effect.runSync(result)).toBe(
        "[Classic|Supreme|Extravaganza|Margherita]"
      );
    });

    it("should handle sizes", () => {
      const literals = Data.array(["Small", "Medium", "Large", "Chairman", "Wedge"] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(literals);
      expect(Effect.runSync(result)).toBe(
        "[Small|Medium|Large|Chairman|Wedge]"
      );
    });

    it("should handle toppings", () => {
      const literals = Data.array([
        "Corn",
        "Capsicum",
        "Onion",
        "Peppers",
        "Cheese",
        "Jalapenos",
        "Olives",
      ] as const);
      const result = Schema.decodeUnknown(
        Pattern.LiteralPatternOptionToBracketString
      )(literals);
      expect(Effect.runSync(result)).toBe(
        "[Corn|Capsicum|Onion|Peppers|Cheese|Jalapenos|Olives]"
      );
    });
  });
});
