/**
 * Tests to ensure compliance with wink-nlp custom entity API
 * @see https://winkjs.org/wink-nlp/learn-custom-entities.html
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";
import * as Core from "../../src/NLP/Core.js";

describe("Wink-NLP Compliance", () => {
  describe("Pattern Creation", () => {
    it("should create shorthand patterns correctly", () =>
      Effect.sync(() => {
        // Test wink-nlp shorthand pattern syntax
        const nounPhrasePattern = Core.EntityPattern.forShorthand(
          "noun_phrases",
          "Noun Phrases",
          "MISC",
          "[|DET] [|ADJ] [NOUN|PROPN]",
          ["the big house", "beautiful garden", "President"]
        );

        expect(nounPhrasePattern.id).toBe("noun_phrases");
        expect(nounPhrasePattern.patterns).toHaveLength(1);
        expect(nounPhrasePattern.patterns[0]).toBe(
          "[|DET] [|ADJ] [NOUN|PROPN]"
        );
        expect(nounPhrasePattern.examples).toContain("the big house");
      }));

    it("should create term patterns with wink shorthand syntax", () =>
      Effect.sync(() => {
        const techCompanies = Core.EntityPattern.forTerms(
          "tech_companies",
          "Technology Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google"]
        );

        // Should use wink-nlp shorthand pattern syntax
        expect(techCompanies.patterns).toHaveLength(1);
        expect(techCompanies.patterns[0]).toBe("[Apple|Microsoft|Google]");
        expect(techCompanies.examples).toContain("Apple");
      }));

    it("should create POS sequence patterns correctly", () =>
      Effect.sync(() => {
        const adjNoun = Core.EntityPattern.forPosSequence(
          "adj_noun",
          "Adjective Noun Pairs",
          "MISC",
          ["ADJ", "NOUN"]
        );

        // Should use space-separated POS tags as per wink-nlp
        expect(adjNoun.patterns).toHaveLength(1);
        expect(adjNoun.patterns[0]).toBe("ADJ NOUN");
      }));

    it("should support mark parameter", () =>
      Effect.sync(() => {
        const markedPattern = Core.EntityPattern.forShorthand(
          "marked_test",
          "Marked Pattern",
          "MISC",
          "ADJ [cats|dogs]",
          ["fluffy cats", "playful dogs"],
          5,
          [0, 0] // Mark first element only
        );

        expect(markedPattern.hasMark).toBe(true);
        expect(markedPattern.mark).toEqual([0, 0]);
      }));

    it("should create noun phrase patterns using convenience method", () =>
      Effect.sync(() => {
        const nounPhrases = Core.EntityPattern.forNounPhrase(
          "noun_phrases",
          "Custom Noun Phrases",
          "MISC",
          7
        );

        expect(nounPhrases.patterns[0]).toBe("[|DET] [|ADJ] [NOUN|PROPN]");
        expect(nounPhrases.priority).toBe(7);
        expect(nounPhrases.examples).toContain("the big house");
      }));
  });

  describe("Configuration Compliance", () => {
    it("should use wink-nlp default configuration", () =>
      Effect.sync(() => {
        const defaultConfig = Core.CustomEntityConfig.default;

        // Verify wink-nlp defaults: matchValue: false, useEntity: true, usePOS: true
        expect(defaultConfig.matchValue).toBe(false);
        expect(defaultConfig.useEntity).toBe(true);
        expect(defaultConfig.usePOS).toBe(true);
      }));

    it("should allow custom configuration matching wink-nlp options", () =>
      Effect.sync(() => {
        const customConfig = Core.CustomEntityConfig.create({
          matchValue: true,
          useEntity: false,
          usePOS: true,
        });

        expect(customConfig.matchValue).toBe(true);
        expect(customConfig.useEntity).toBe(false);
        expect(customConfig.usePOS).toBe(true);
      }));
  });

  describe("Wink Format Conversion", () => {
    it("should convert patterns to wink-compatible format", () =>
      Effect.sync(() => {
        const pattern1 = Core.EntityPattern.forTerms(
          "companies",
          "Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft"]
        );

        const pattern2 = Core.EntityPattern.forShorthand(
          "marked_pattern",
          "Marked Pattern",
          "MISC",
          "ADJ [cats|dogs]",
          [],
          5,
          [0, 0]
        );

        const definition = Core.CustomEntityDefinition.create(
          "test_def",
          "test",
          "1.0.0",
          [pattern1, pattern2]
        );

        const winkFormat = definition.toWinkFormat();

        expect(winkFormat).toHaveLength(2);

        // First pattern (no mark)
        expect(winkFormat[0]).toEqual({
          name: "Companies",
          patterns: ["[Apple|Microsoft]"],
        });

        // Second pattern (with mark)
        expect(winkFormat[1]).toEqual({
          name: "Marked Pattern",
          patterns: ["ADJ [cats|dogs]"],
          mark: [0, 0],
        });
      }));

    it("should handle complex shorthand patterns", () =>
      Effect.sync(() => {
        // Test complex wink-nlp pattern from documentation
        const pizzaPattern = Core.EntityPattern.forShorthand(
          "pizza_order",
          "Pizza Orders",
          "MISC",
          "CARDINAL [small|medium|large] [classic|supreme]",
          ["1 small classic", "2 large supreme"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "pizza_def",
          "food",
          "1.0.0",
          [pizzaPattern]
        );

        const winkFormat = definition.toWinkFormat();

        expect(winkFormat[0]).toEqual({
          name: "Pizza Orders",
          patterns: ["CARDINAL [small|medium|large] [classic|supreme]"],
        });
      }));
  });

  describe("Pattern Examples from Documentation", () => {
    it("should handle pizza ordering patterns from wink-nlp docs", () =>
      Effect.sync(() => {
        // Examples from https://winkjs.org/wink-nlp/learn-custom-entities.html
        const pizzaPatterns = [
          Core.EntityPattern.forShorthand(
            "category",
            "Category",
            "MISC",
            "[Classic|Supreme|Extravaganza|Favorite]"
          ),
          Core.EntityPattern.forShorthand("qty", "Qty", "MISC", "CARDINAL"),
          Core.EntityPattern.forShorthand(
            "topping",
            "Topping",
            "MISC",
            "[Corn|Capsicum|Onion|Peppers|Cheese|Jalapenos|Olives]"
          ),
          Core.EntityPattern.forShorthand(
            "size",
            "Size",
            "MISC",
            "[Small|Medium|Large|Chairman|Wedge]"
          ),
        ];

        const definition = Core.CustomEntityDefinition.create(
          "pizza_domain",
          "food",
          "1.0.0",
          pizzaPatterns,
          {
            config: Core.CustomEntityConfig.create({
              matchValue: false,
              usePOS: true,
              useEntity: true,
            }),
          }
        );

        const winkFormat = definition.toWinkFormat();

        expect(winkFormat).toHaveLength(4);
        expect(winkFormat[0].patterns[0]).toBe(
          "[Classic|Supreme|Extravaganza|Favorite]"
        );
        expect(winkFormat[1].patterns[0]).toBe("CARDINAL");
        expect(winkFormat[2].patterns[0]).toBe(
          "[Corn|Capsicum|Onion|Peppers|Cheese|Jalapenos|Olives]"
        );
        expect(winkFormat[3].patterns[0]).toBe(
          "[Small|Medium|Large|Chairman|Wedge]"
        );
      }));

    it("should handle noun phrase patterns from documentation", () =>
      Effect.sync(() => {
        // Example from wink-nlp documentation
        const nounPhrasePattern =
          Core.EntityPattern.forNounPhrase("noun_phrases");

        expect(nounPhrasePattern.patterns[0]).toBe(
          "[|DET] [|ADJ] [NOUN|PROPN]"
        );
        expect(nounPhrasePattern.name).toBe("Noun Phrases");
        expect(nounPhrasePattern.label).toBe("MISC");
      }));

    it("should handle marked patterns for extraction", () =>
      Effect.sync(() => {
        // Example: extract only adjectives from "ADJ [cats|dogs]" pattern
        const adjectiveExtraction = Core.EntityPattern.forShorthand(
          "adjective_animals",
          "Adjective Animal Pairs",
          "MISC",
          "ADJ [cats|dogs]",
          ["fluffy cats", "playful dogs"],
          5,
          [0, 0] // Extract only the adjective (first element)
        );

        expect(adjectiveExtraction.mark).toEqual([0, 0]);
        expect(adjectiveExtraction.hasMark).toBe(true);

        // Example: extract last two elements using negative indices
        const lastTwoElements = Core.EntityPattern.forShorthand(
          "last_two",
          "Last Two Elements",
          "MISC",
          "DET ADJ NOUN",
          ["a fluffy cat"],
          5,
          [-2, -1] // Extract "fluffy cat"
        );

        expect(lastTwoElements.mark).toEqual([-2, -1]);
      }));
  });

  describe("Escaping Support", () => {
    it("should support literal matching with caret escaping", () =>
      Effect.sync(() => {
        // Test escaping as documented in wink-nlp
        const literalJanuary = Core.EntityPattern.forShorthand(
          "literal_january",
          "Literal January",
          "DATE",
          "^January", // Literal "January", not DATE entity
          ["January"]
        );

        expect(literalJanuary.patterns[0]).toBe("^January");

        // Test escaping POS tags
        const literalNoun = Core.EntityPattern.forShorthand(
          "literal_noun",
          "Literal NOUN",
          "MISC",
          "^NOUN", // Literal "NOUN" word, not POS tag
          ["NOUN"]
        );

        expect(literalNoun.patterns[0]).toBe("^NOUN");

        // Test escaping caret itself
        const literalCaret = Core.EntityPattern.forShorthand(
          "literal_caret",
          "Literal Caret",
          "MISC",
          "^^", // Literal "^" character
          ["^"]
        );

        expect(literalCaret.patterns[0]).toBe("^^");
      }));
  });

  describe("Priority and Metadata", () => {
    it("should handle priority correctly", () =>
      Effect.sync(() => {
        const highPriorityPattern = Core.EntityPattern.forTerms(
          "high_priority",
          "High Priority",
          "MISC",
          ["important"],
          ["very important"],
          9
        );

        expect(highPriorityPattern.priority).toBe(9);
        expect(highPriorityPattern.isHighPriority).toBe(true);

        const lowPriorityPattern = Core.EntityPattern.forTerms(
          "low_priority",
          "Low Priority",
          "MISC",
          ["optional"],
          [],
          3
        );

        expect(lowPriorityPattern.priority).toBe(3);
        expect(lowPriorityPattern.isHighPriority).toBe(false);
      }));

    it("should handle metadata correctly", () =>
      Effect.sync(() => {
        const patternWithMetadata = Core.EntityPattern.create(
          "meta_pattern",
          "Pattern with Metadata",
          "MISC",
          ["test"],
          {
            metadata: {
              domain: "testing",
              version: "1.0",
              author: "test-suite",
            },
          }
        );

        expect(patternWithMetadata.metadata.size).toBe(3);
        // Note: HashMap access would need proper Effect operations in real usage
      }));
  });
});
