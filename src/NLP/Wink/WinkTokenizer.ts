/**
 * WinkTokenizer Service
 * Effect.Service implementation for wink-nlp tokenization with WinkEngine dependency
 * @since 3.0.0
 */

import { Effect, Chunk, Option } from "effect";
import type { ItemToken } from "wink-nlp";
import { Token, TokenIndex, CharPosition } from "../Core/Token.js";
import { Sentence, SentenceIndex } from "../Core/Sentence.js";
import { Document, DocumentId } from "../Core/Document.js";
import { WinkEngine } from "./WinkEngine.js";
import type { WinkError } from "./WinkEngine.js";

/**
 * Convert wink token to our Token model using proper wink-nlp its API
 * Based on https://winkjs.org/wink-nlp/its-as-helper.html
 */
const convertWinkToken = (
  winkToken: ItemToken,
  index: number,
  its: any
): Token => {
  // Get all available token properties using wink its API
  const text = winkToken.out(); // its.value is default
  const pos = winkToken.out(its.pos);
  const lemma = winkToken.out(its.lemma);
  const stem = winkToken.out(its.stem);
  const normal = winkToken.out(its.normal);
  const shape = winkToken.out(its.shape);
  const prefix = winkToken.out(its.prefix);
  const suffix = winkToken.out(its.suffix);
  const case_ = winkToken.out(its.case);
  const uniqueId = winkToken.out(its.uniqueId);
  const abbrevFlag = winkToken.out(its.abbrevFlag);
  const contractionFlag = winkToken.out(its.contractionFlag);
  const stopWordFlag = winkToken.out(its.stopWordFlag);
  const negationFlag = winkToken.out(its.negationFlag);
  const precedingSpaces = winkToken.out(its.precedingSpaces);

  // Get character position using its.offset
  const offset = winkToken.out(its.offset);
  const start = typeof offset === "number" ? offset : index * 2;

  return new Token({
    text: text || "",
    index: TokenIndex(index),
    start: CharPosition(start),
    end: CharPosition(start + (text?.length || 0)),
    pos: pos ? Option.some(pos as string) : Option.none<string>(),
    lemma: lemma ? Option.some(lemma as string) : Option.none<string>(),
    stem: stem ? Option.some(stem as string) : Option.none<string>(),
    normal: normal ? Option.some(normal as string) : Option.none<string>(),
    shape: shape ? Option.some(shape as string) : Option.none<string>(),
    prefix: prefix ? Option.some(prefix as string) : Option.none<string>(),
    suffix: suffix ? Option.some(suffix as string) : Option.none<string>(),
    case: case_ ? Option.some(case_ as string) : Option.none<string>(),
    uniqueId:
      typeof uniqueId === "number"
        ? Option.some(uniqueId)
        : Option.none<number>(),
    abbrevFlag:
      typeof abbrevFlag === "boolean"
        ? Option.some(abbrevFlag)
        : Option.none<boolean>(),
    contractionFlag:
      typeof contractionFlag === "boolean"
        ? Option.some(contractionFlag)
        : Option.none<boolean>(),
    stopWordFlag:
      typeof stopWordFlag === "boolean"
        ? Option.some(stopWordFlag)
        : Option.none<boolean>(),
    negationFlag:
      typeof negationFlag === "boolean"
        ? Option.some(negationFlag)
        : Option.none<boolean>(),
    precedingSpaces: precedingSpaces
      ? Option.some(precedingSpaces as string)
      : Option.none<string>(),
    tags: [],
  });
};

/**
 * Convert wink sentence to our Sentence model
 */
const convertWinkSentence = (
  winkSentence: any,
  index: number,
  tokens: Chunk.Chunk<Token>,
  its: any
): Sentence => {
  const text = winkSentence.out();
  const sentiment = winkSentence.out(its.sentiment);
  const negationFlag = winkSentence.out(its.negationFlag);
  const markedUpText = winkSentence.out(its.markedUpText);
  const span = winkSentence.out(its.span);

  return new Sentence({
    text: text || "",
    index: SentenceIndex(index),
    tokens,
    start: TokenIndex(span?.[0] || 0),
    end: TokenIndex(span?.[1] || Chunk.size(tokens) - 1),
    sentiment:
      typeof sentiment === "number" ? Option.some(sentiment) : Option.none(),
    importance: Option.none(),
    negationFlag:
      typeof negationFlag === "boolean"
        ? Option.some(negationFlag)
        : Option.none(),
    markedUpText: markedUpText ? Option.some(markedUpText) : Option.none(),
  });
};

/**
 * WinkTokenizer Service Definition
 */
export class WinkTokenizer extends Effect.Service<WinkTokenizer>()(
  "effect-nlp/WinkTokenizer",
  {
    effect: Effect.gen(function* () {
      const engine = yield* WinkEngine;

      return {
        /**
         * Tokenize text into Token array with full wink properties
         */
        tokenize: (
          text: string
        ): Effect.Effect<Chunk.Chunk<Token>, WinkError> =>
          Effect.gen(function* () {
            const rawTokens = yield* engine.getRawTokens(text);
            const its = yield* engine.its;
            return Chunk.fromIterable(rawTokens).pipe(
              Chunk.map((token, index) => convertWinkToken(token, index, its))
            );
          }),

        /**
         * Get sentences with full wink properties
         */
        getSentences: (
          text: string
        ): Effect.Effect<Chunk.Chunk<Sentence>, WinkError> =>
          Effect.gen(function* () {
            const doc = yield* engine.getWinkDoc(text);
            const sentences = doc.sentences();
            const allTokens = yield* engine.getRawTokens(text);
            const its = yield* engine.its;

            const tokenObjects = Chunk.fromIterable(allTokens).pipe(
              Chunk.map((token, index) => convertWinkToken(token, index, its))
            );

            return Chunk.fromIterable(sentences.out()).pipe(
              Chunk.map((sentenceText, index) => {
                const sentence = sentences.itemAt(index);
                const span = sentence.out(its.span);
                const sentenceTokens = span
                  ? Chunk.take(
                      Chunk.drop(tokenObjects, span[0]),
                      span[1] - span[0] + 1
                    )
                  : Chunk.empty<Token>();

                return convertWinkSentence(
                  sentence,
                  index,
                  sentenceTokens,
                  its
                );
              })
            );
          }),

        /**
         * Tokenize text and create clean Document with pure NLP properties
         */
        tokenizeToDocument: (
          text: string,
          id?: string
        ): Effect.Effect<Document, WinkError> =>
          Effect.gen(function* () {
            const tokens = yield* engine.getRawTokens(text);
            const its = yield* engine.its;

            // Convert tokens
            const tokenObjects = Chunk.fromIterable(tokens).pipe(
              Chunk.map((token, index) => convertWinkToken(token, index, its))
            );

            // Get sentences
            const doc = yield* engine.getWinkDoc(text);
            const sentences = doc.sentences();
            const sentenceObjects = Chunk.fromIterable(sentences.out()).pipe(
              Chunk.map((sentenceText, index) => {
                const sentence = sentences.itemAt(index);
                const span = sentence.out(its.span);
                const sentenceTokens = span
                  ? Chunk.take(
                      Chunk.drop(tokenObjects, span[0]),
                      span[1] - span[0] + 1
                    )
                  : Chunk.empty<Token>();

                return convertWinkSentence(
                  sentence,
                  index,
                  sentenceTokens,
                  its
                );
              })
            );

            // Get document-level NLP properties
            const sentiment = doc.out(its.sentiment);

            return new Document({
              id: DocumentId.make(id || `doc-${Date.now()}`),
              text,
              tokens: tokenObjects,
              sentences: sentenceObjects,
              sentiment:
                typeof sentiment === "number"
                  ? Option.some(sentiment)
                  : Option.none(),
            });
          }),

        /**
         * Get token count (efficient)
         */
        getTokenCount: (text: string): Effect.Effect<number, WinkError> =>
          engine.getTokenCount(text),
      };
    }),
    dependencies: [WinkEngine.Default],
  }
) {}

/**
 * Live layer for WinkTokenizer
 */
export const WinkTokenizerLive = WinkTokenizer.Default;

/**
 * Test layer for WinkTokenizer
 */

/**
 * Data-first convenience functions
 */

export const tokenize = (
  text: string
): Effect.Effect<Chunk.Chunk<Token>, WinkError, WinkTokenizer> =>
  Effect.gen(function* () {
    const tokenizer = yield* WinkTokenizer;
    return yield* tokenizer.tokenize(text);
  });

export const getSentences = (
  text: string
): Effect.Effect<Chunk.Chunk<Sentence>, WinkError, WinkTokenizer> =>
  Effect.gen(function* () {
    const tokenizer = yield* WinkTokenizer;
    return yield* tokenizer.getSentences(text);
  });

export const tokenizeToDocument = (
  text: string,
  id?: string
): Effect.Effect<Document, WinkError, WinkTokenizer> =>
  Effect.gen(function* () {
    const tokenizer = yield* WinkTokenizer;
    return yield* tokenizer.tokenizeToDocument(text, id);
  });

export const getTokenCount = (
  text: string
): Effect.Effect<number, WinkError, WinkTokenizer> =>
  Effect.gen(function* () {
    const tokenizer = yield* WinkTokenizer;
    return yield* tokenizer.getTokenCount(text);
  });
