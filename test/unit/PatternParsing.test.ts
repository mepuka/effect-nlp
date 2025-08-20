/**
 * Unit tests for Pattern Parsing - Transform Schema
 * Tests POSPatternOptionFromString transform schema
 */

import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import { POSPatternOptionFromString } from "../../src/NLP/Core/Pattern.js";

describe("Pattern Parsing - Transform Schema", () => {
  describe("POSPatternOptionFromString", () => {
    it("should decode array of POS tags to bracket string", () => {
      const input = ["NOUN", "VERB", "ADJ"];
      const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toBe("[NOUN|VERB|ADJ]");
    });

    it("should decode array with empty string for optional", () => {
      const input = ["", "DET"];
      const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toBe("[|DET]");
    });

    it("should decode single POS tag", () => {
      const input = ["NOUN"];
      const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toBe("[NOUN]");
    });

    it("should error on empty string only", () => {
      const input = [""];
      const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);

      expect(() => Effect.runSync(result)).toThrow(
        "POS pattern must contain at least one valid POS tag"
      );
    });

    it("should encode bracket string to array of POS tags", () => {
      const input = "[NOUN|VERB|ADJ]";
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toEqual(["NOUN", "VERB", "ADJ"]);
    });

    it("should encode optional bracket string", () => {
      const input = "[|DET]";
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toEqual(["", "DET"]);
    });

    it("should encode single tag bracket string", () => {
      const input = "[NOUN]";
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(Effect.runSync(result)).toEqual(["NOUN"]);
    });

    it("should error on empty option group", () => {
      const input = "[|]";
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should handle all Universal POS tags", () => {
      const posTags = [
        "ADJ",
        "ADP",
        "ADV",
        "AUX",
        "CCONJ",
        "DET",
        "INTJ",
        "NOUN",
        "NUM",
        "PART",
        "PRON",
        "PROPN",
        "PUNCT",
        "SCONJ",
        "SYM",
        "VERB",
        "X",
        "SPACE",
      ];

      posTags.forEach((tag) => {
        const input = [tag];
        const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);
        expect(Effect.runSync(result)).toBe(`[${tag}]`);
      });
    });

    it("should reject invalid POS tags in decode", () => {
      const input = ["INVALID"];
      const result = Schema.decodeUnknown(POSPatternOptionFromString)(input);

      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should reject malformed bracket strings in encode", () => {
      const input = "NOUN|VERB"; // Missing brackets
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should reject invalid POS tags in bracket strings", () => {
      const input = "[INVALID|NOUN]";
      const result = Schema.encodeUnknown(POSPatternOptionFromString)(input);

      expect(() => Effect.runSync(result)).toThrow();
    });

    it("should handle round-trip conversion", () => {
      const original = ["NOUN", "VERB", "ADJ"];

      // Decode to string
      const decoded = Schema.decodeUnknown(POSPatternOptionFromString)(
        original
      );
      const stringResult = Effect.runSync(decoded);

      // Encode back to array
      const encoded = Schema.encodeUnknown(POSPatternOptionFromString)(
        stringResult
      );
      const arrayResult = Effect.runSync(encoded);

      expect(arrayResult).toEqual(original);
    });

    it("should handle round-trip with optional elements", () => {
      const original = ["", "DET", "ADJ"];

      // Decode to string
      const decoded = Schema.decodeUnknown(POSPatternOptionFromString)(
        original
      );
      const stringResult = Effect.runSync(decoded);

      // Encode back to array
      const encoded = Schema.encodeUnknown(POSPatternOptionFromString)(
        stringResult
      );
      const arrayResult = Effect.runSync(encoded);

      expect(arrayResult).toEqual(original);
    });
  });
});
