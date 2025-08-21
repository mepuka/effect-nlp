/**
 * WinkEngine Service with Ref-based State Management
 * Manages a shared wink-nlp instance using Effect Ref for proper state management
 * @since 3.0.0
 */

import {
  Effect,
  Data,
  Context,
  Layer,
  Ref,
  Schema,
  Hash,
  Random,
  Chunk,
  Match,
} from "effect";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import type { ItemToken, CustomEntityExample } from "wink-nlp";
import { Pattern, PatternElement } from "../Core/Pattern.js";

/**
 * Wink engine error
 * @since 3.0.0
 */
export class WinkError extends Data.TaggedError("WinkError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Custom entity definition for wink-nlp
 */
export interface CustomEntityDefinition {
  readonly name: string;
  readonly patterns: ReadonlyArray<Schema.Schema.Type<typeof Pattern>>;
}

/**
 * WinkEngine state containing the nlp instance and custom entities
 */
export interface WinkEngineState {
  readonly nlp: any; // wink-nlp instance
  readonly customEntities: ReadonlyArray<CustomEntityDefinition>;
  readonly instanceId: string; // randomly generated instance ID
  readonly engineHash: number; // hash of instance ID + serialized custom entities
}

/**
 * Ref wrapper for WinkEngine state
 */
export class WinkEngineRef extends Context.Tag("effect-nlp/WinkEngineRef")<
  WinkEngineRef,
  Ref.Ref<WinkEngineState>
>() {}

/**
 * Generate engine hash from instance ID and custom entities
 */
const generateEngineHash = (
  instanceId: string,
  customEntities: ReadonlyArray<CustomEntityDefinition>
): number => {
  const serializedData = JSON.stringify({
    instanceId,
    customEntities: customEntities.map((entity) => ({
      name: entity.name,
      patterns: entity.patterns.map((pattern) => JSON.stringify(pattern)),
    })),
  });
  return Hash.hash(serializedData);
};

/**
 * WinkEngine Service Definition with Ref-based state management
 */
export class WinkEngine extends Effect.Service<WinkEngine>()(
  "effect-nlp/WinkEngine",
  {
    effect: Effect.gen(function* () {
      // Initialize the nlp instance
      const nlp = yield* Effect.try({
        try: () => winkNLP(model),
        catch: (error) =>
          new WinkError({
            message: "Failed to initialize wink-nlp engine",
            cause: error,
          }),
      });

      // Generate instance ID
      const instanceId = yield* Random.nextIntBetween(100000, 999999).pipe(
        Effect.map((num) => `wink-engine-${num}-${Date.now()}`)
      );

      // Create the state ref
      const stateRef = yield* Ref.make<WinkEngineState>({
        nlp,
        customEntities: [],
        instanceId,
        engineHash: generateEngineHash(instanceId, []),
      });

      return {
        /**
         * Get raw wink document
         * Direct access to wink-nlp document
         */
        getDocument: (text: string) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return yield* Effect.try({
              try: () => state.nlp.readDoc(text),
              catch: (error) =>
                new WinkError({
                  message: "Failed to create wink document",
                  cause: error,
                }),
            });
          }),

        /**
         * Get the nlp instance for accessing its helpers
         */
        getNlpInstance: Ref.get(stateRef).pipe(
          Effect.map((state) => state.nlp)
        ),

        /**
         * Get the its helper for token/document properties
         */
        its: Ref.get(stateRef).pipe(Effect.map((state) => state.nlp.its)),

        /**
         * Get the as helper for collection reducers
         */
        as: Ref.get(stateRef).pipe(Effect.map((state) => state.nlp.as)),

        /**
         * Get wink document as Effect for safe access
         */
        getWinkDoc: (text: string): Effect.Effect<any, WinkError> =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return yield* Effect.try({
              try: () => state.nlp.readDoc(text),
              catch: (error) =>
                new WinkError({
                  message: `Failed to create wink document from text: ${text.slice(
                    0,
                    50
                  )}...`,
                  cause: error,
                }),
            });
          }),

        /**
         * Get raw tokens from wink
         * Returns wink's native token format
         */
        getRawTokens: (
          text: string
        ): Effect.Effect<ReadonlyArray<ItemToken>, WinkError> =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return yield* Effect.try({
              try: () => {
                const doc = state.nlp.readDoc(text);
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
            });
          }),

        /**
         * Get token count
         */
        getTokenCount: (text: string): Effect.Effect<number, WinkError> =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);
            return yield* Effect.try({
              try: () => state.nlp.readDoc(text).tokens().length(),
              catch: (error) =>
                new WinkError({
                  message: "Failed to count tokens",
                  cause: error,
                }),
            });
          }),

        /**
         * Add custom entity definition with patterns
         */
        addCustomEntity: (
          definition: CustomEntityDefinition
        ): Effect.Effect<void, never> =>
          Ref.update(stateRef, (state) => ({
            ...state,
            customEntities: [...state.customEntities, definition],
          })),

        /**
         * Get custom entities
         */
        getCustomEntities: Ref.get(stateRef).pipe(
          Effect.map((state) => state.customEntities)
        ),

        /**
         * Get instance ID
         */
        getInstanceId: Ref.get(stateRef).pipe(
          Effect.map((state) => state.instanceId)
        ),

        /**
         * Get engine hash
         */
        getEngineHash: Ref.get(stateRef).pipe(
          Effect.map((state) => state.engineHash)
        ),

        /**
         * Learn custom entities into the nlp instance
         */
        learnCustomEntities: (): Effect.Effect<void, WinkError> =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);

            // Convert Pattern types to wink-nlp format
            const winkPatterns = state.customEntities.map((entity) => ({
              name: entity.name,
              patterns: entity.patterns.map((pattern) => {
                // Extract the pattern elements and convert to wink format
                // This is a simplified conversion - actual implementation would need
                // to handle all pattern types properly
                return pattern.elements
                  .map((element: PatternElement) => {
                    // Return the value which is already in wink format like "[NOUN|VERB]"
                    return element.value.toString();
                  })
                  .join(" ");
              }),
            }));

            // Learn the patterns using wink-nlp's custom entity API
            yield* Effect.try({
              try: () => {
                if (state.nlp.learnCustomEntities && winkPatterns.length > 0) {
                  state.nlp.learnCustomEntities(winkPatterns);
                }
              },
              catch: (error) =>
                new WinkError({
                  message: "Failed to learn custom entities",
                  cause: error,
                }),
            });

            yield* Effect.logInfo(
              `Learned ${winkPatterns.length} custom entity patterns`
            );
          }),

        /**
         * Reset the engine to initial state
         */
        reset: (): Effect.Effect<void, WinkError> =>
          Effect.gen(function* () {
            const freshNlp = yield* Effect.try({
              try: () => winkNLP(model),
              catch: (error) =>
                new WinkError({
                  message: "Failed to initialize fresh wink-nlp instance",
                  cause: error,
                }),
            });

            // Generate new instance ID for the reset engine
            const newInstanceId = yield* Random.nextIntBetween(
              100000,
              999999
            ).pipe(Effect.map((num) => `wink-engine-${num}-${Date.now()}`));

            yield* Ref.set(stateRef, {
              nlp: freshNlp,
              customEntities: [],
              instanceId: newInstanceId,
              engineHash: generateEngineHash(newInstanceId, []),
            });
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
 * Service that provides the Ref directly for advanced use cases
 */
export const WinkEngineRefLive = Layer.effect(
  WinkEngineRef,
  Effect.gen(function* () {
    const nlp = yield* Effect.try({
      try: () => winkNLP(model),
      catch: (error) =>
        new WinkError({
          message: "Failed to initialize wink-nlp engine",
          cause: error,
        }),
    });

    // Generate instance ID for the ref layer
    const instanceId = yield* Random.nextIntBetween(100000, 999999).pipe(
      Effect.map((num) => `wink-engine-ref-${num}-${Date.now()}`)
    );

    return yield* Ref.make<WinkEngineState>({
      nlp,
      customEntities: [],
      instanceId,
      engineHash: generateEngineHash(instanceId, []),
    });
  })
);
