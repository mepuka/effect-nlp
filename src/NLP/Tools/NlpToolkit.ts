/**
 * NLP Toolkit - bundles all NLP tools with handler implementations.
 * Provides a composed layer backed by existing NLP services.
 * @since 3.0.0
 */

import { Chunk, Effect, Layer, Option } from "effect"
import { Toolkit } from "@effect/ai"
import { ChunkBySentences } from "./ChunkBySentences.js"
import { CorpusStats } from "./CorpusStats.js"
import { CreateCorpus } from "./CreateCorpus.js"
import { DeleteCorpus } from "./DeleteCorpus.js"
import { DocumentStats } from "./DocumentStats.js"
import { ExtractEntities } from "./ExtractEntities.js"
import { ExtractKeywords } from "./ExtractKeywords.js"
import { LearnCorpus } from "./LearnCorpus.js"
import { QueryCorpus } from "./QueryCorpus.js"
import { RankByRelevance } from "./RankByRelevance.js"
import { Sentences } from "./Sentences.js"
import { Tokenize } from "./Tokenize.js"
import { TextSimilarity } from "./TextSimilarity.js"
import { TransformText } from "./TransformText.js"
import { Tokenization } from "../Core/Tokenization.js"
import type { Token } from "../Core/Token.js"
import { WinkCorpusManager } from "../Wink/WinkCorpusManager.js"
import { WinkEngine } from "../Wink/WinkEngine.js"
import { WinkVectorizer, type TermFrequency } from "../Wink/WinkVectorizer.js"
import { CosineSimilarityRequest, WinkSimilarity } from "../Wink/WinkSimilarity.js"
import { TextInput, WinkUtils, WinkUtilsLive } from "../Wink/WinkUtils.js"
import { WinkLayerLive } from "../Wink/Layer.js"

export const NlpToolkit = Toolkit.make(
  ChunkBySentences,
  CorpusStats,
  CreateCorpus,
  DeleteCorpus,
  DocumentStats,
  ExtractEntities,
  ExtractKeywords,
  LearnCorpus,
  QueryCorpus,
  RankByRelevance,
  Sentences,
  TextSimilarity,
  Tokenize,
  TransformText
)

const unwrapOptionString = (opt: Option.Option<string | undefined>): string =>
  Option.match(opt, {
    onNone: () => "",
    onSome: (v) => v ?? ""
  })

const tokenToAi = (token: Token) => ({
  text: token.text,
  pos: unwrapOptionString(token.pos),
  lemma: unwrapOptionString(token.lemma),
  stem: unwrapOptionString(token.stem),
  isStopWord: Option.match(token.stopWordFlag, {
    onNone: () => false,
    onSome: (v) => v ?? false
  }),
  isPunctuation: Option.match(token.shape, {
    onNone: () => false,
    onSome: (shape) => !/[Xxd]/.test(shape as string)
  }),
  start: token.start as number,
  end: token.end as number
})

const isPunctuationToken = (token: Token): boolean =>
  Option.match(token.shape, {
    onNone: () => false,
    onSome: (shape) => !/[Xxd]/.test(shape as string)
  })

const isWordLikeToken = (token: Token): boolean =>
  !isPunctuationToken(token) && /[\p{L}\p{N}]/u.test(token.text)

const toPositiveInteger = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback
  const rounded = Math.floor(value)
  return rounded >= 1 ? rounded : fallback
}

interface SentenceSpan {
  readonly index: number
  readonly text: string
}

type OperationName =
  | "lowercase"
  | "uppercase"
  | "trim"
  | "removeHtml"
  | "removePunctuation"
  | "removeExtraSpaces"
  | "removeSpecialChars"
  | "retainAlphaNums"
  | "removeElisions"

const applyOperation = (
  utils: WinkUtils["Type"],
  op: OperationName,
  text: string
) => {
  const input = TextInput({ text })
  switch (op) {
    case "lowercase":
      return utils.lowerCase(input)
    case "uppercase":
      return utils.upperCase(input)
    case "trim":
      return utils.trim(input)
    case "removeHtml":
      return utils.removeHTMLTags(input)
    case "removePunctuation":
      return utils.removePunctuations(input)
    case "removeExtraSpaces":
      return utils.removeExtraSpaces(input)
    case "removeSpecialChars":
      return utils.removeSplChars(input)
    case "retainAlphaNums":
      return utils.retainAlphaNums(input)
    case "removeElisions":
      return utils.removeElisions(input)
  }
}

export const NlpToolkitLive = NlpToolkit.toLayer(
  Effect.gen(function*() {
    const corpusManager = yield* WinkCorpusManager
    const engine = yield* WinkEngine
    const tokenization = yield* Tokenization
    const vectorizer = yield* WinkVectorizer
    const sim = yield* WinkSimilarity
    const utils = yield* WinkUtils

    return {
      ChunkBySentences: ({ maxChunkChars, text }) =>
        Effect.gen(function*() {
          const doc = yield* tokenization.document(text, "chunks-doc")
          const sentenceArray = Chunk.toReadonlyArray(doc.sentences).map((s) => ({
            index: s.index as number,
            text: s.text.trim()
          }))

          const sentences = sentenceArray.filter(
            (sentence): sentence is SentenceSpan => sentence.text.length > 0
          )

          if (sentences.length === 0) {
            return {
              chunks: [],
              chunkCount: 0,
              originalSentenceCount: sentenceArray.length
            }
          }

          const targetSize = toPositiveInteger(maxChunkChars, 1)
          const chunks: Array<{
            readonly text: string
            readonly sentenceCount: number
            readonly charCount: number
            readonly startSentenceIndex: number
            readonly endSentenceIndex: number
          }> = []

          let currentText = ""
          let currentStartSentence = -1
          let currentEndSentence = -1

          const flushCurrent = () => {
            if (currentStartSentence < 0 || currentText.length === 0) return
            chunks.push({
              text: currentText,
              sentenceCount: currentEndSentence - currentStartSentence + 1,
              charCount: currentText.length,
              startSentenceIndex: currentStartSentence,
              endSentenceIndex: currentEndSentence
            })
          }

          for (const sentence of sentences) {
            if (currentStartSentence < 0) {
              currentText = sentence.text
              currentStartSentence = sentence.index
              currentEndSentence = sentence.index
              continue
            }

            const candidateText = `${currentText} ${sentence.text}`
            const candidateLength = candidateText.length

            if (candidateLength <= targetSize) {
              currentText = candidateText
              currentEndSentence = sentence.index
              continue
            }

            flushCurrent()
            currentText = sentence.text
            currentStartSentence = sentence.index
            currentEndSentence = sentence.index
          }

          flushCurrent()

          return {
            chunks,
            chunkCount: chunks.length,
            originalSentenceCount: sentenceArray.length
          }
        }).pipe(Effect.orDie),

      CorpusStats: ({ corpusId, includeIdf, includeMatrix, topIdfTerms }) =>
        corpusManager.getStats({
          corpusId,
          ...(includeIdf === undefined ? {} : { includeIdf }),
          ...(includeMatrix === undefined ? {} : { includeMatrix }),
          ...(topIdfTerms === undefined ? {} : { topIdfTerms })
        }).pipe(Effect.orDie),

      CreateCorpus: ({ bm25Config, corpusId }) =>
        Effect.gen(function*() {
          const normalizedConfig =
            bm25Config === undefined
              ? undefined
              : {
                  ...(bm25Config.k1 === undefined ? {} : { k1: bm25Config.k1 }),
                  ...(bm25Config.b === undefined ? {} : { b: bm25Config.b }),
                  ...(bm25Config.k === undefined ? {} : { k: bm25Config.k }),
                  ...(bm25Config.norm === undefined ? {} : { norm: bm25Config.norm })
                }

          return yield* corpusManager.createCorpus(
            normalizedConfig === undefined && corpusId === undefined
              ? undefined
              : {
                  ...(corpusId === undefined ? {} : { corpusId }),
                  ...(normalizedConfig === undefined
                    ? {}
                    : { bm25Config: normalizedConfig })
                }
          )
        }).pipe(Effect.orDie),

      DeleteCorpus: ({ corpusId }) =>
        Effect.gen(function*() {
          const deleted = yield* corpusManager.deleteCorpus(corpusId)
          return {
            corpusId,
            deleted
          }
        }).pipe(Effect.orDie),

      DocumentStats: ({ text }) =>
        Effect.gen(function*() {
          const doc = yield* tokenization.document(text, "stats-doc")
          const tokenArray = Chunk.toReadonlyArray(doc.tokens)
          const sentenceArray = Chunk.toReadonlyArray(doc.sentences)
          const wordCount = tokenArray.filter((token) => isWordLikeToken(token)).length
          const sentenceCount = sentenceArray.length
          return {
            wordCount,
            sentenceCount,
            avgSentenceLength:
              sentenceCount > 0 ? wordCount / sentenceCount : 0,
            charCount: text.length
          }
        }).pipe(Effect.orDie),

      ExtractEntities: ({ text }) =>
        Effect.gen(function*() {
          const winkDoc = yield* engine.getWinkDoc(text)
          const its = yield* engine.its
          const doc = yield* tokenization.document(text, "entities-doc")
          const tokenArray = Chunk.toReadonlyArray(doc.tokens)

          const details = winkDoc.entities().out(its.detail) as Array<{
            readonly value?: unknown
            readonly type?: unknown
          }>
          const spans = winkDoc.entities().out(its.span) as unknown as ReadonlyArray<
            ReadonlyArray<number>
          >

          const entities = details.map((detail, index) => {
            const rawSpan = spans[index]
            const value =
              typeof detail.value === "string"
                ? detail.value
                : String(detail.value ?? "")
            const type =
              typeof detail.type === "string"
                ? detail.type
                : String(detail.type ?? "")

            let startTokenIndex = 0
            let endTokenIndex = 0

            if (
              tokenArray.length > 0 &&
              Array.isArray(rawSpan) &&
              rawSpan.length >= 2 &&
              typeof rawSpan[0] === "number" &&
              typeof rawSpan[1] === "number"
            ) {
              const maxTokenIndex = tokenArray.length - 1
              const a = Math.floor(rawSpan[0])
              const b = Math.floor(rawSpan[1])
              startTokenIndex = Math.max(0, Math.min(maxTokenIndex, Math.min(a, b)))
              endTokenIndex = Math.max(
                startTokenIndex,
                Math.min(maxTokenIndex, Math.max(a, b))
              )
            }

            const startToken = tokenArray[startTokenIndex]
            const endToken = tokenArray[endTokenIndex]
            const start =
              startToken !== undefined
                ? (startToken.start as number)
                : 0
            const end =
              endToken !== undefined
                ? (endToken.end as number)
                : start + value.length

            return {
              value,
              type,
              start,
              end: Math.max(start, end),
              startTokenIndex,
              endTokenIndex
            }
          })

          const entityTypes = [...new Set(entities.map((entity) => entity.type))]
            .sort((a, b) => a.localeCompare(b))

          return {
            entities,
            entityCount: entities.length,
            entityTypes
          }
        }).pipe(Effect.orDie),

      ExtractKeywords: ({ text, topN }) =>
        vectorizer.withFreshInstance((vec) =>
          Effect.gen(function*() {
            const doc = yield* tokenization.document(text, "keywords-doc")
            yield* vec.learnDocument(doc)
            const tfs = yield* vec.getDocumentTermFrequencies(0)
            const tfArray = Chunk.toReadonlyArray(tfs) as ReadonlyArray<TermFrequency>
            const sorted = [...tfArray]
              .sort((a, b) => b.frequency - a.frequency)
              .slice(0, topN ?? 10)
              .map((tf) => ({ term: tf.term, score: tf.frequency }))
            return { keywords: sorted }
          })
        ).pipe(Effect.orDie),

      LearnCorpus: ({ corpusId, dedupeById, documents }) =>
        Effect.gen(function*() {
          const timestamp = Date.now()
          const docs = yield* Effect.forEach(
            documents,
            (document, index) =>
              tokenization.document(
                document.text,
                document.id ?? `${corpusId}-doc-${timestamp}-${index}`
              )
          )

          return yield* corpusManager.learnDocuments({
            corpusId,
            documents: Chunk.fromIterable(docs),
            ...(dedupeById === undefined ? {} : { dedupeById })
          })
        }).pipe(Effect.orDie),

      QueryCorpus: ({ corpusId, includeText, query, topN }) =>
        corpusManager.query({
          corpusId,
          query,
          ...(topN === undefined ? {} : { topN }),
          ...(includeText === undefined ? {} : { includeText })
        }).pipe(Effect.orDie),

      RankByRelevance: ({ query, texts, topN }) =>
        vectorizer.withFreshInstance((vec) =>
          Effect.gen(function*() {
            if (texts.length === 0) {
              return {
                ranked: [],
                totalTexts: 0,
                returned: 0
              }
            }

            const limit = Math.min(
              texts.length,
              topN === undefined
                ? texts.length
                : toPositiveInteger(topN, texts.length)
            )

            const docs = yield* Effect.forEach(
              texts,
              (text, index) => tokenization.document(text, `rank-doc-${index}`)
            )

            yield* Effect.forEach(docs, (doc) => vec.learnDocument(doc), {
              discard: true
            })

            const queryDoc = yield* tokenization.document(query, "rank-query")
            const queryVector = yield* vec.vectorizeDocument(queryDoc)

            const scored = yield* Effect.forEach(
              docs,
              (doc, index) =>
                Effect.gen(function*() {
                  const candidateVector = yield* vec.vectorizeDocument(doc)
                  const result = yield* sim.vectorCosine(
                    CosineSimilarityRequest({
                      vector1: queryVector,
                      vector2: candidateVector
                    })
                  )
                  return {
                    index,
                    score: Number.isFinite(result.score) ? result.score : 0
                  }
                })
            )

            const ranked = [...scored]
              .sort((a, b) => b.score - a.score || a.index - b.index)
              .slice(0, limit)

            return {
              ranked,
              totalTexts: texts.length,
              returned: ranked.length
            }
          })
        ).pipe(Effect.orDie),

      Sentences: ({ text }) =>
        Effect.gen(function*() {
          const doc = yield* tokenization.document(text)
          const sArr = Chunk.toReadonlyArray(doc.sentences).map((s) => {
            const tokens = Chunk.toReadonlyArray(s.tokens)
            const firstToken = tokens[0]
            const lastToken = tokens[tokens.length - 1]
            return {
              text: s.text,
              tokenCount: tokens.length,
              index: s.index as number,
              start: firstToken !== undefined ? (firstToken.start as number) : 0,
              end: lastToken !== undefined ? (lastToken.end as number) : 0
            }
          })
          return { sentences: sArr, sentenceCount: sArr.length }
        }).pipe(Effect.orDie),

      TextSimilarity: ({ text1, text2 }) =>
        vectorizer.withFreshInstance((vec) =>
          Effect.gen(function*() {
            const doc1 = yield* tokenization.document(text1, "text1")
            const doc2 = yield* tokenization.document(text2, "text2")
            yield* vec.learnDocument(doc1)
            yield* vec.learnDocument(doc2)
            const vec1 = yield* vec.vectorizeDocument(doc1)
            const vec2 = yield* vec.vectorizeDocument(doc2)
            const result = yield* sim.vectorCosine(
              CosineSimilarityRequest({ vector1: vec1, vector2: vec2 })
            )
            return { score: result.score, method: result.method }
          })
        ).pipe(Effect.orDie),

      Tokenize: ({ text }) =>
        Effect.gen(function*() {
          const tokens = yield* tokenization.tokenize(text)
          const arr = Chunk.toReadonlyArray(tokens).map(tokenToAi)
          return { tokens: arr as Array<(typeof arr)[number]>, tokenCount: arr.length }
        }).pipe(Effect.orDie),

      TransformText: ({ operations, text }) =>
        Effect.gen(function*() {
          let current = text
          const applied: Array<string> = []
          for (const op of operations) {
            const result = yield* applyOperation(utils, op as OperationName, current)
            current = result.text
            applied.push(op)
          }
          return { result: current, operationsApplied: applied }
        }).pipe(Effect.orDie)
    }
  })
).pipe(
  Layer.provide(WinkLayerLive),
  Layer.provide(WinkUtilsLive)
)
