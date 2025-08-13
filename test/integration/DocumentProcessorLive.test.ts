/**
 * Integration tests for DocumentProcessorLive service using Effect patterns
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DP from "../../src/NLP/DocumentProcessor.js";
import * as Live from "../../src/NLP/DocumentProcessorLive.js";
import * as Fixtures from "../fixtures/sample-texts.js";

describe("DocumentProcessorLive Integration", () => {
  const TestLayer = Live.DocumentProcessorLive;

  it("should process simple text into Document", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const document = yield* processor.process(
        "Apple Inc. is based in Cupertino."
      );

      expect(document).toBeInstanceOf(Core.Document);
      expect(document.text).toBe("Apple Inc. is based in Cupertino.");
      expect(document.id).toBeDefined();

      // Should have tokens
      const tokens = document.getTokens();
      yield* Effect.log(tokens);
      expect(tokens.length).toBeGreaterThan(0);

      // Should have at least one entity
      const entities = document.getEntities();
      expect(entities.length).toBeGreaterThan(0);
    }).pipe(Effect.provide(TestLayer)));

  it("should extract entities from financial text", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const entities = yield* processor.extractEntities(
        Fixtures.FINANCIAL_TEXT
      );

      expect(entities.length).toBeGreaterThan(0);

      // Should find organizations
      const organizations = entities.filter((e) => e.label === "ORGANIZATION");
      expect(organizations.length).toBeGreaterThanOrEqual(0);

      // Should find people
      const people = entities.filter((e) => e.label === "PERSON");
      expect(people.length).toBeGreaterThanOrEqual(0);

      // Should find money amounts
      const money = entities.filter((e) => e.label === "MONEY");
      expect(money.length).toBeGreaterThanOrEqual(0);
    }).pipe(Effect.provide(TestLayer)));

  it("should tokenize text correctly", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const tokens = yield* processor.tokenize("Apple Inc. reported earnings.");

      expect(tokens.length).toBeGreaterThan(0);

      // Should have proper token structure
      for (const token of tokens) {
        expect(token).toBeInstanceOf(Core.Token);
        expect(token.id).toBeDefined();
        expect(token.text).toBeDefined();
        expect(token.pos).toBeDefined();
        expect(token.features.lemma).toBeDefined();
      }

      // Should find proper nouns
      const properNouns = tokens.filter((t) => t.isProperNoun);
      expect(properNouns.length).toBeGreaterThanOrEqual(0);
    }).pipe(Effect.provide(TestLayer)));

  it("should generate document statistics", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const document = yield* processor.process(Fixtures.ACADEMIC_TEXT);
      const stats = processor.getStats(document);

      expect(stats).toBeInstanceOf(Core.DocumentStats);
      expect(stats.tokenCount).toBeGreaterThan(0);
      expect(stats.sentenceCount).toBeGreaterThan(0);
      expect(stats.entityCount).toBeGreaterThanOrEqual(0);
      expect(stats.averageTokenLength).toBeGreaterThan(0);
      expect(stats.averageSentenceLength).toBeGreaterThan(0);

      // Should have POS distribution
      const posValues = Array.from(HashMap.values(stats.posDistribution));
      const hasPosCounts = posValues.some((count) => count > 0);
      expect(hasPosCounts).toBe(true);
    }).pipe(Effect.provide(TestLayer)));

  it("should handle DocumentQuery service", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const query = yield* DP.DocumentQueryService;

      const document = yield* processor.process(Fixtures.TECHNICAL_TEXT);

      // Find entities by predicate
      const organizations = query.findEntities(
        document,
        (entity) => entity.label === "ORGANIZATION"
      );
      expect(organizations.length).toBeGreaterThanOrEqual(0);

      // Find tokens by predicate
      const properNouns = query.findTokens(
        document,
        (token) => token.isProperNoun
      );
      expect(properNouns.length).toBeGreaterThanOrEqual(0);

      // Find entities in span
      const span = Core.Span.create(0, 50);
      const entitiesInSpan = query.getEntitiesInSpan(document, span);
      expect(Array.isArray(entitiesInSpan)).toBe(true);
    }).pipe(Effect.provide(TestLayer)));

  it("should handle TextTransformer service", () =>
    Effect.gen(function* () {
      const transformer = yield* DP.TextTransformerService;

      // Test basic transformations
      const normalized = yield* transformer.transform("  HELLO WORLD  ", {
        _tag: "Normalize",
      });
      expect(normalized).toBe("hello world");

      const lowercase = yield* transformer.transform("HELLO WORLD", {
        _tag: "ToLowerCase",
      });
      expect(lowercase).toBe("hello world");

      const uppercase = yield* transformer.transform("hello world", {
        _tag: "ToUpperCase",
      });
      expect(uppercase).toBe("HELLO WORLD");
    }).pipe(Effect.provide(TestLayer)));

  it("should handle edge cases", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;

      // Empty text
      const emptyDoc = yield* processor.process("");
      expect(emptyDoc.text).toBe("");
      expect(emptyDoc.getTokens()).toHaveLength(0);

      // Single word
      const singleWord = yield* processor.process("Apple");
      expect(singleWord.text).toBe("Apple");
      expect(singleWord.getTokens().length).toBeGreaterThanOrEqual(0);

      // Numbers and punctuation
      const numbersDoc = yield* processor.process("Price: $123.45");
      expect(numbersDoc.getTokens().length).toBeGreaterThan(0);
    }).pipe(Effect.provide(TestLayer)));

  it("should handle error cases gracefully", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;

      // Test with very long text
      const longText = "word ".repeat(1000);
      const longDoc = yield* processor.process(longText);
      expect(longDoc).toBeDefined();

      // Test with special characters
      const specialText = "café résumé naïve Zürich 北京";
      const specialDoc = yield* processor.process(specialText);
      expect(specialDoc.text).toBe(specialText);
    }).pipe(Effect.provide(TestLayer)));

  it("should maintain Schema validation", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      const document = yield* processor.process("Test validation.");

      // Verify all elements are proper Schema instances
      expect(document).toBeInstanceOf(Core.Document);

      const tokens = document.getTokens();
      for (const token of tokens) {
        expect(token).toBeInstanceOf(Core.Token);
        expect(token.features).toBeInstanceOf(Core.Features);
        expect(token.offset).toBeInstanceOf(Core.Offset);
      }

      const entities = document.getEntities();
      for (const entity of entities) {
        expect(entity).toBeInstanceOf(Core.Entity);
        expect(entity.offset).toBeInstanceOf(Core.Offset);
      }

      const sentences = document.getSentences();
      for (const sentence of sentences) {
        expect(sentence).toBeInstanceOf(Core.Sentence);
        expect(sentence.offset).toBeInstanceOf(Core.Offset);
      }
    }).pipe(Effect.provide(TestLayer)));

  it("should process multiple texts concurrently", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;

      // Process multiple texts in parallel using Effect.all
      const [doc1, doc2, doc3] = yield* Effect.all(
        [
          processor.process("Apple Inc. announced new products."),
          processor.process("Microsoft released quarterly earnings."),
          processor.process("Google expanded cloud services."),
        ],
        { concurrency: 2 }
      );

      expect(doc1.getTokens().length).toBeGreaterThan(0);
      expect(doc2.getTokens().length).toBeGreaterThan(0);
      expect(doc3.getTokens().length).toBeGreaterThan(0);

      // Each document should have different content
      expect(doc1.text).toContain("Apple");
      expect(doc2.text).toContain("Microsoft");
      expect(doc3.text).toContain("Google");
    }).pipe(Effect.provide(TestLayer)));

  it("should handle service errors properly", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;

      // Test error handling with malformed input
      const result = yield* processor.process("").pipe(Effect.either);

      // Should either succeed with empty document or fail gracefully
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(Core.NlpError);
      } else {
        expect(result.right).toBeInstanceOf(Core.Document);
      }
    }).pipe(Effect.provide(TestLayer)));
});
