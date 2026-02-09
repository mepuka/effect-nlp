/**
 * NLP Toolkit integration test - tests the composed toolkit and handler layer
 * @since 3.0.0
 */

import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import {
  NlpToolkit,
  NlpToolkitLive
} from "../../src/NLP/Tools/NlpToolkit.js"

describe("NlpToolkit", () => {
  it("exports all fourteen tools", () => {
    const toolNames = Object.keys(NlpToolkit.tools)
    assert.deepStrictEqual(toolNames.sort(), [
      "ChunkBySentences",
      "CorpusStats",
      "CreateCorpus",
      "DeleteCorpus",
      "DocumentStats",
      "ExtractEntities",
      "ExtractKeywords",
      "LearnCorpus",
      "QueryCorpus",
      "RankByRelevance",
      "Sentences",
      "TextSimilarity",
      "Tokenize",
      "TransformText"
    ])
  })

  it("each tool has a description", () => {
    for (const tool of Object.values(NlpToolkit.tools)) {
      assert.isTrue(
        typeof (tool as { description?: string }).description === "string" &&
          ((tool as { description?: string }).description?.length ?? 0) > 0
      )
    }
  })

  describe("Toolkit handler layer", () => {
    it.effect("Tokenize handler produces tokens", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Tokenize", { text: "Hello world" })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.tokenCount, 2)
        assert.strictEqual(result.result.tokens.length, 2)
        assert.strictEqual(result.result.tokens[0].text, "Hello")
        assert.strictEqual(result.result.tokens[1].text, "world")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Tokenize handler includes POS tags", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Tokenize", { text: "The cat runs fast" })
        assert.isFalse(result.isFailure)
        for (const tok of result.result.tokens) {
          assert.isTrue(typeof tok.pos === "string")
          assert.isTrue(typeof tok.isStopWord === "boolean")
          assert.isTrue(typeof tok.isPunctuation === "boolean")
        }
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Tokenize enrichment: POS tags are non-empty for known words", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Tokenize", { text: "The cat sat on the mat." })
        assert.isFalse(result.isFailure)
        // "The" should have DET POS tag, "cat" should have NOUN, "sat" should have VERB
        const posValues = result.result.tokens
          .filter((t) => /^[a-zA-Z]+$/.test(t.text))
          .map((t) => t.pos)
        // POS tags should be populated (not empty strings)
        for (const pos of posValues) {
          assert.isTrue(pos.length > 0, `POS tag should be non-empty for word tokens`)
        }
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Tokenize enrichment: stopWordFlag is true for common stop words", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Tokenize", { text: "The cat is a pet." })
        assert.isFalse(result.isFailure)
        const theToken = result.result.tokens.find((t) => t.text.toLowerCase() === "the")
        assert.isTrue(theToken !== undefined, "Should find 'the' token")
        assert.isTrue(theToken!.isStopWord, "'the' should be a stop word")
        const isToken = result.result.tokens.find((t) => t.text.toLowerCase() === "is")
        assert.isTrue(isToken !== undefined, "Should find 'is' token")
        assert.isTrue(isToken!.isStopWord, "'is' should be a stop word")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Tokenize enrichment: isPunctuation is true for punctuation marks", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Tokenize", { text: "Hello, world!" })
        assert.isFalse(result.isFailure)
        const comma = result.result.tokens.find((t) => t.text === ",")
        assert.isTrue(comma !== undefined, "Should find comma token")
        assert.isTrue(comma!.isPunctuation, "Comma should be punctuation")
        const excl = result.result.tokens.find((t) => t.text === "!")
        assert.isTrue(excl !== undefined, "Should find exclamation mark token")
        assert.isTrue(excl!.isPunctuation, "Exclamation should be punctuation")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Sentences handler splits text", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Sentences", {
          text: "Hello world. How are you?"
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.sentenceCount, 2)
        assert.strictEqual(result.result.sentences[0].text, "Hello world.")
        assert.strictEqual(result.result.sentences[1].text, "How are you?")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Sentences handler includes token counts", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Sentences", {
          text: "I am here."
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.sentenceCount, 1)
        assert.isTrue(result.result.sentences[0].tokenCount > 0)
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("Sentences handler: repeated sentences have distinct offsets", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("Sentences", {
          text: "Hello world. Hello world."
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.sentenceCount, 2)
        const s1 = result.result.sentences[0]
        const s2 = result.result.sentences[1]
        // The second occurrence must NOT start at 0
        assert.isTrue(
          s2.start > s1.start,
          `Second sentence start (${s2.start}) should be after first (${s1.start})`
        )
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("DocumentStats returns word/sentence/char stats", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const text = "Hello world. How are you?"
        const result = yield* toolkit.handle("DocumentStats", { text })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.wordCount, 5)
        assert.strictEqual(result.result.sentenceCount, 2)
        assert.strictEqual(result.result.charCount, text.length)
        assert.strictEqual(result.result.avgSentenceLength, 2.5)
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("ChunkBySentences respects sentence boundaries", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("ChunkBySentences", {
          text: "One two three. Four five six. Seven eight nine.",
          maxChunkChars: 20
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.chunkCount, 3)
        assert.strictEqual(result.result.originalSentenceCount, 3)
        assert.strictEqual(result.result.chunks[0].text, "One two three.")
        assert.strictEqual(result.result.chunks[1].text, "Four five six.")
        assert.strictEqual(result.result.chunks[2].text, "Seven eight nine.")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("RankByRelevance returns sorted ranked indices", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("RankByRelevance", {
          texts: [
            "Cats purr and meow softly.",
            "Felines are playful companions.",
            "Quantum computing uses qubits."
          ],
          query: "cats and felines",
          topN: 2
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.totalTexts, 3)
        assert.strictEqual(result.result.returned, 2)
        assert.isTrue(result.result.ranked.length <= 2)
        assert.isTrue(result.result.ranked[0].score >= result.result.ranked[1].score)
        assert.isTrue(result.result.ranked.every((r) => r.index >= 0 && r.index < 3))
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("TextSimilarity handler compares identical texts", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("TextSimilarity", {
          text1: "The cat sat on the mat",
          text2: "The cat sat on the mat"
        })
        assert.isFalse(result.isFailure)
        // BM25 cosine similarity for identical texts should be positive
        assert.isTrue(result.result.score > 0)
        assert.strictEqual(result.result.method, "vector.cosine")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("TextSimilarity handler scores different texts lower", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("TextSimilarity", {
          text1: "The cat sat on the mat",
          text2: "Quantum computing advances rapidly"
        })
        assert.isFalse(result.isFailure)
        assert.isTrue(result.result.score < 1)
        assert.isTrue(result.result.score >= 0)
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("TransformText handler applies lowercase", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("TransformText", {
          text: "HELLO WORLD",
          operations: ["lowercase"]
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.result, "hello world")
        assert.deepStrictEqual(result.result.operationsApplied, ["lowercase"])
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("TransformText handler chains operations", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("TransformText", {
          text: "  HELLO   WORLD  ",
          operations: ["removeExtraSpaces", "lowercase"]
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.result, "hello world")
        assert.deepStrictEqual(result.result.operationsApplied, [
          "removeExtraSpaces",
          "lowercase"
        ])
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("TransformText handler removes HTML", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("TransformText", {
          text: "<b>Hello</b>",
          operations: ["removeHtml", "trim"]
        })
        assert.isFalse(result.isFailure)
        assert.strictEqual(result.result.result, "Hello")
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("ExtractKeywords handler extracts keywords", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("ExtractKeywords", {
          text: "The cat sat on the mat. The cat was happy. The cat purred."
        })
        assert.isFalse(result.isFailure)
        assert.isTrue(result.result.keywords.length > 0)
        for (const kw of result.result.keywords) {
          assert.isTrue(typeof kw.term === "string")
          assert.isTrue(typeof kw.score === "number")
          assert.isTrue(kw.score > 0)
        }
      }).pipe(Effect.provide(NlpToolkitLive))
    )

    it.effect("ExtractKeywords handler respects topN", () =>
      Effect.gen(function*() {
        const toolkit = yield* NlpToolkit
        const result = yield* toolkit.handle("ExtractKeywords", {
          text: "The quick brown fox jumps over the lazy dog while the happy cat sleeps peacefully.",
          topN: 3
        })
        assert.isFalse(result.isFailure)
        assert.isTrue(result.result.keywords.length <= 3)
      }).pipe(Effect.provide(NlpToolkitLive))
    )
  })
})
