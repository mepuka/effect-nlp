/**
 * Unit tests for Core Schema.Class implementation using Effect patterns
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";

describe("Core.Span", () => {
  it("should create valid span", () => {
    const span = Core.Span.create(0, 10);
    expect(span.start).toBe(0);
    expect(span.end).toBe(10);
    expect(span.length).toBe(10);
  });

  it("should throw error for invalid span", () =>
    Effect.gen(function* () {
      const result = yield* Effect.try(() => Core.Span.create(10, 5)).pipe(
        Effect.flip
      );
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toContain(
        "Invalid span: end (5) must be >= start (10)"
      );
    }));

  it("should calculate overlaps correctly", () =>
    Effect.sync(() => {
      const span1 = Core.Span.create(0, 10);
      const span2 = Core.Span.create(5, 15);
      const span3 = Core.Span.create(20, 30);

      expect(span1.overlaps(span2)).toBe(true);
      expect(span1.overlaps(span3)).toBe(false);
    }));

  it("should calculate containment correctly", () =>
    Effect.sync(() => {
      const outer = Core.Span.create(0, 20);
      const inner = Core.Span.create(5, 15);
      const partial = Core.Span.create(15, 25);

      expect(outer.contains(inner)).toBe(true);
      expect(outer.contains(partial)).toBe(false);
      expect(inner.contains(outer)).toBe(false);
    }));
});

describe("Core.Offset", () => {
  it("should create char-only offset", () =>
    Effect.sync(() => {
      const offset = Core.Offset.fromChar(10, 20);
      expect(offset.char.start).toBe(10);
      expect(offset.char.end).toBe(20);
      expect(offset.hasTokenSpan).toBe(false);
    }));

  it("should create offset with token span", () =>
    Effect.sync(() => {
      const offset = Core.Offset.fromCharAndToken(10, 20, 2, 4);
      expect(offset.char.start).toBe(10);
      expect(offset.char.end).toBe(20);
      expect(offset.hasTokenSpan).toBe(true);
      expect(offset.token?.start).toBe(2);
      expect(offset.token?.end).toBe(4);
    }));
});

describe("Core.Token", () => {
  it("should create valid token", () =>
    Effect.sync(() => {
      const token = Core.Token.create(
        "token_1",
        "cats",
        10,
        14,
        "NOUN",
        "cat",
        ["Noun", "Plural"],
        false
      );

      expect(token.id).toBe("token_1");
      expect(token.text).toBe("cats");
      expect(token.pos).toBe("NOUN");
      expect(token.features.lemma).toBe("cat");
      expect(token.features.tags).toEqual(["Noun", "Plural"]);
      expect(token.features.isNegated).toBe(false);
      expect(token.isProperNoun).toBe(false);
      expect(token.isPunctuation).toBe(false);
      expect(token.normalizedText).toBe("cat");
    }));

  it("should identify proper nouns", () =>
    Effect.sync(() => {
      const propn = Core.Token.create(
        "t1",
        "Apple",
        0,
        5,
        "PROPN",
        "Apple",
        [],
        false
      );
      expect(propn.isProperNoun).toBe(true);
    }));

  it("should identify punctuation", () =>
    Effect.sync(() => {
      const punct = Core.Token.create("t1", ".", 0, 1, "PUNCT", ".", [], false);
      expect(punct.isPunctuation).toBe(true);
    }));

  it("should validate text minLength", () =>
    Effect.sync(() => {
      const result = Effect.try(
        () =>
          new Core.Token({
            id: "test",
            text: "", // Should fail minLength(1)
            offset: Core.Offset.fromChar(0, 0),
            pos: "NOUN",
            features: new Core.Features({
              tags: [],
              lemma: "",
              isNegated: false,
            }),
          })
      ).pipe(Effect.flip);

      expect(result).toBeInstanceOf(Error);
    }));
});

describe("Core.Entity", () => {
  it("should create valid entity", () =>
    Effect.sync(() => {
      const entity = Core.Entity.create(
        "entity_1",
        "Apple Inc.",
        "ORGANIZATION",
        0,
        10,
        ["token_1", "token_2"]
      );

      expect(entity.id).toBe("entity_1");
      expect(entity.text).toBe("Apple Inc.");
      expect(entity.label).toBe("ORGANIZATION");
      expect(entity.offset.char.start).toBe(0);
      expect(entity.offset.char.end).toBe(10);
      expect(entity.tokenIds).toEqual(["token_1", "token_2"]);
    }));

  it("should validate entity labels", () =>
    Effect.sync(() => {
      const validLabels: Array<Core.EntityLabel> = [
        "PERSON",
        "ORGANIZATION",
        "LOCATION",
        "DATE",
        "TIME",
        "MONEY",
        "PERCENT",
        "EMAIL",
        "URL",
        "PHONE",
        "MISC",
      ];

      for (const label of validLabels) {
        const entity = Core.Entity.create("e1", "test", label, 0, 4, []);
        expect(entity.label).toBe(label);
      }
    }));
});

describe("Core.Document", () => {
  it("should create document with HashMaps", () =>
    Effect.sync(() => {
      const token1 = Core.Token.create(
        "t1",
        "Apple",
        0,
        5,
        "PROPN",
        "Apple",
        [],
        false
      );
      const token2 = Core.Token.create(
        "t2",
        "Inc",
        6,
        9,
        "PROPN",
        "Inc",
        [],
        false
      );

      const entity1 = Core.Entity.create(
        "e1",
        "Apple Inc",
        "ORGANIZATION",
        0,
        9,
        ["t1", "t2"]
      );

      const sentence1 = Core.Sentence.create("s1", "Apple Inc", 0, 9, [
        "t1",
        "t2",
      ]);

      const document = new Core.Document({
        id: "doc_1",
        text: "Apple Inc",
        tokens: HashMap.fromIterable([
          ["t1", token1],
          ["t2", token2],
        ]),
        entities: HashMap.fromIterable([["e1", entity1]]),
        sentences: HashMap.fromIterable([["s1", sentence1]]),
        metadata: HashMap.fromIterable([
          ["created", "2024-01-01"],
          ["version", "2.0.0"],
        ]),
      });

      expect(document.id).toBe("doc_1");
      expect(document.text).toBe("Apple Inc");

      // Test getter methods
      const tokens = document.getTokens();
      expect(tokens).toHaveLength(2);
      expect(tokens[0].text).toBe("Apple");

      const entities = document.getEntities();
      expect(entities).toHaveLength(1);
      expect(entities[0].text).toBe("Apple Inc");

      const sentences = document.getSentences();
      expect(sentences).toHaveLength(1);
      expect(sentences[0].text).toBe("Apple Inc");
    }));

  it("should get entities by label", () =>
    Effect.sync(() => {
      const org = Core.Entity.create("e1", "Apple", "ORGANIZATION", 0, 5, [
        "t1",
      ]);
      const person = Core.Entity.create("e2", "Cook", "PERSON", 6, 10, ["t2"]);

      const document = new Core.Document({
        id: "doc_1",
        text: "Apple Cook",
        tokens: HashMap.empty(),
        entities: HashMap.fromIterable([
          ["e1", org],
          ["e2", person],
        ]),
        sentences: HashMap.empty(),
        metadata: HashMap.empty(),
      });

      const organizations = document.getEntitiesByLabel("ORGANIZATION");
      expect(organizations).toHaveLength(1);
      expect(organizations[0].text).toBe("Apple");

      const people = document.getEntitiesByLabel("PERSON");
      expect(people).toHaveLength(1);
      expect(people[0].text).toBe("Cook");
    }));

  it("should get entity tokens", () =>
    Effect.sync(() => {
      const token1 = Core.Token.create(
        "t1",
        "Apple",
        0,
        5,
        "PROPN",
        "Apple",
        [],
        false
      );
      const token2 = Core.Token.create(
        "t2",
        "Inc",
        6,
        9,
        "PROPN",
        "Inc",
        [],
        false
      );
      const entity = Core.Entity.create(
        "e1",
        "Apple Inc",
        "ORGANIZATION",
        0,
        9,
        ["t1", "t2"]
      );

      const document = new Core.Document({
        id: "doc_1",
        text: "Apple Inc",
        tokens: HashMap.fromIterable([
          ["t1", token1],
          ["t2", token2],
        ]),
        entities: HashMap.fromIterable([["e1", entity]]),
        sentences: HashMap.empty(),
        metadata: HashMap.empty(),
      });

      const entityTokens = document.getEntityTokens(entity);
      expect(entityTokens).toHaveLength(2);
      expect(entityTokens.map((t) => t.text)).toEqual(["Apple", "Inc"]);
    }));

  it("should get tokens in span", () =>
    Effect.sync(() => {
      const token1 = Core.Token.create(
        "t1",
        "Apple",
        0,
        5,
        "PROPN",
        "Apple",
        [],
        false
      );
      const token2 = Core.Token.create(
        "t2",
        "Inc",
        6,
        9,
        "PROPN",
        "Inc",
        [],
        false
      );
      const token3 = Core.Token.create(
        "t3",
        "reported",
        10,
        18,
        "VERB",
        "report",
        [],
        false
      );

      const document = new Core.Document({
        id: "doc_1",
        text: "Apple Inc reported",
        tokens: HashMap.fromIterable([
          ["t1", token1],
          ["t2", token2],
          ["t3", token3],
        ]),
        entities: HashMap.empty(),
        sentences: HashMap.empty(),
        metadata: HashMap.empty(),
      });

      const span = Core.Span.create(0, 9); // Covers "Apple Inc"
      const tokensInSpan = document.getTokensInSpan(span);
      expect(tokensInSpan).toHaveLength(2);
      expect(tokensInSpan.map((t) => t.text)).toEqual(["Apple", "Inc"]);
    }));
});

describe("Core.DocumentStats", () => {
  it("should create valid document stats", () =>
    Effect.sync(() => {
      const stats = new Core.DocumentStats({
        tokenCount: 10,
        sentenceCount: 2,
        entityCount: 3,
        entityCounts: HashMap.fromIterable([
          ["PERSON", 1],
          ["ORGANIZATION", 2],
        ]),
        posDistribution: HashMap.fromIterable([
          ["NOUN", 5],
          ["VERB", 2],
          ["ADJ", 3],
        ]),
        averageTokenLength: 4.2,
        averageSentenceLength: 5.0,
      });

      expect(stats.tokenCount).toBe(10);
      expect(stats.sentenceCount).toBe(2);
      expect(stats.entityCount).toBe(3);
      expect(stats.averageTokenLength).toBe(4.2);
      expect(stats.averageSentenceLength).toBe(5.0);
    }));
});

describe("Core Error Types", () => {
  it("should create NlpError", () =>
    Effect.sync(() => {
      const error = new Core.NlpError({
        message: "Test error",
        cause: new Error("Root cause"),
      });

      expect(error._tag).toBe("NlpError");
      expect(error.message).toBe("Test error");
      expect(error.cause).toBeInstanceOf(Error);
    }));

  it("should create TokenizationError", () =>
    Effect.sync(() => {
      const error = new Core.TokenizationError({
        message: "Tokenization failed",
        text: "problematic text",
        position: 42,
      });

      expect(error._tag).toBe("TokenizationError");
      expect(error.message).toBe("Tokenization failed");
      expect(error.text).toBe("problematic text");
      expect(error.position).toBe(42);
    }));

  it("should create EntityExtractionError", () =>
    Effect.sync(() => {
      const error = new Core.EntityExtractionError({
        message: "Entity extraction failed",
        entityType: "PERSON",
      });

      expect(error._tag).toBe("EntityExtractionError");
      expect(error.message).toBe("Entity extraction failed");
      expect(error.entityType).toBe("PERSON");
    }));
});
