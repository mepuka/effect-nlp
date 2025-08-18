/**
 * WinkEngine Service
 * Effect.Service implementation for wink-nlp engine
 * @since 3.0.0
 */

import { Effect, Data, Layer } from "effect";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import type { ItemToken } from "wink-nlp";

/**
 * Wink engine error
 * @since 3.0.0
 */
export class WinkError extends Data.TaggedError("WinkError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * WinkEngine Service Definition
 */
export class WinkEngine extends Effect.Service<WinkEngine>()(
  "effect-nlp/WinkEngine",
  {
    effect: Effect.gen(function* () {
      const nlp = yield* Effect.try({
        try: () => winkNLP(model),
        catch: (error) =>
          new WinkError({
            message: "Failed to initialize wink-nlp engine",
            cause: error,
          }),
      });

      return {
        /**
         * Get raw wink document
         * Direct access to wink-nlp document
         */
        getDocument: (text: string) => nlp.readDoc(text),

        /**
         * Get the nlp instance for accessing its helpers
         */
        getNlpInstance: () => nlp,

        /**
         * Get the its helper for token/document properties
         */
        getIts: () => nlp.its,

        /**
         * Get the as helper for collection reducers
         */
        getAs: () => nlp.as,

        /**
         * Get wink document as Effect for safe access
         */
        getWinkDoc: (text: string): Effect.Effect<any, WinkError> =>
          Effect.try({
            try: () => nlp.readDoc(text),
            catch: (error) =>
              new WinkError({
                message: `Failed to create wink document from text: ${text.slice(
                  0,
                  50
                )}...`,
                cause: error,
              }),
          }),

        /**
         * Get raw tokens from wink
         * Returns wink's native token format
         */
        getRawTokens: (
          text: string
        ): Effect.Effect<ReadonlyArray<ItemToken>, WinkError> =>
          Effect.try({
            try: () => {
              const doc = nlp.readDoc(text);
              const tokens: Array<ItemToken> = [];

              doc.tokens().each((token: ItemToken) => {
                tokens.push(token);
              });

              return tokens as ReadonlyArray<ItemToken>;
            },
            catch: (error) =>
              new WinkError({
                message: "Failed to tokenize text with wink-nlp",
                cause: error,
              }),
          }),

        /**
         * Get token count
         */
        getTokenCount: (text: string): Effect.Effect<number, WinkError> =>
          Effect.try({
            try: () => nlp.readDoc(text).tokens().length(),
            catch: (error) =>
              new WinkError({
                message: "Failed to count tokens",
                cause: error,
              }),
          }),

        /**
         * Check if wink engine is available
         */
        isAvailable: (): boolean => {
          try {
            winkNLP(model);
            return true;
          } catch {
            return false;
          }
        },
      };
    }),
    dependencies: [],
  }
) {}

/**
 * Live layer for WinkEngine
 */
export const WinkEngineLive = WinkEngine.Default;

/**
 * Test layer for WinkEngine
 */
export const WinkEngineTest = Layer.succeed(
  WinkEngine,
  WinkEngine.of({
    getDocument: (text: string) => ({
      tokens: () => ({
        out: () => text.split(" "),
        each: (fn: (token: any) => void) => {
          text.split(" ").forEach((token) =>
            fn({
              out: (prop?: any) => {
                if (!prop) return token;
                if (prop === "normal") return token.toLowerCase();
                if (prop === "pos") return "NOUN";
                return token;
              },
            })
          );
        },
        length: () => text.split(" ").length,
      }),
      sentences: () => ({
        out: () => [text],
        itemAt: () => ({
          out: (prop?: any) => {
            if (!prop) return text;
            if (prop === "span") return [0, text.split(" ").length - 1];
            return text;
          },
        }),
      }),
      out: (prop?: any) => {
        if (!prop) return text;
        if (prop === "sentiment") return 0;
        return text;
      },
    }),
    getNlpInstance: () => ({} as any),
    getIts: () => ({
      normal: "normal",
      pos: "pos",
      lemma: "lemma",
      stem: "stem",
      sentiment: "sentiment",
      span: "span",
      offset: "offset",
      shape: "shape",
      prefix: "prefix",
      suffix: "suffix",
      case: "case",
      uniqueId: "uniqueId",
      abbrevFlag: "abbrevFlag",
      contractionFlag: "contractionFlag",
      stopWordFlag: "stopWordFlag",
      negationFlag: "negationFlag",
      precedingSpaces: "precedingSpaces",
      markedUpText: "markedUpText",
    }),
    getAs: () => ({} as any),
    getWinkDoc: (text: string) => Effect.succeed({} as any),
    getRawTokens: (text: string) =>
      Effect.succeed(
        text.split(" ").map((token) => ({
          out: (prop?: any) => {
            if (!prop) return token;
            if (prop === "normal") return token.toLowerCase();
            return token;
          },
        })) as ReadonlyArray<ItemToken>
      ),
    getTokenCount: (text: string) => Effect.succeed(text.split(" ").length),
    isAvailable: () => true,
  })
);
