
import { Schema, Effect, ReadonlyArray, Context, Layer } from "effect";
import { EntityPattern, PatternElement } from "../Core/Pattern.js";

// ============================================================================
// Wink-NLP Custom Pattern Schemas
// ============================================================================

/**
 * Schema for a single pattern item that wink-nlp understands.
 * This is a string, which can be a literal, a POS tag like `[NOUN]`,
 * or an entity type like `[DATE]`.
 */
export const WinkPatternItem = Schema.String;
export type WinkPatternItem = Schema.Schema.Type<typeof WinkPatternItem>;

/**
 * Schema for a wink-nlp pattern, which is an array of pattern items.
 */
export const WinkPattern = Schema.TaggedStruct("WinkPattern", {
    name: Schema.String,
    patterns: Schema.Array(WinkPatternItem)
});
export type WinkPattern = Schema.Schema.Type<typeof WinkPattern>;

// ============================================================================
// Pattern Transformation Logic
// ============================================================================

const winkPatternFromPatternElement = (element: PatternElement): WinkPatternItem => {
    switch (element._tag) {
        case "pos":
        case "entity":
        case "literal":
            return element.value;
    }
};

const winkPatternFromEntityPattern = (entityPattern: EntityPattern): WinkPattern => {
    const patterns = ReadonlyArray.map(entityPattern.pattern.elements, winkPatternFromPatternElement);
    return {
        _tag: "WinkPattern",
        name: entityPattern.name,
        patterns: ReadonlyArray.toArray(patterns)
    };
};

// ============================================================================
// WinkPattern Service
// ============================================================================

export class WinkPatternService extends Context.Tag("WinkPatternService")<
    WinkPatternService,
    {
        readonly fromEntityPatterns: (
            patterns: ReadonlyArray.NonEmptyArray<EntityPattern>
        ) => Effect.Effect<ReadonlyArray.NonEmptyArray<WinkPattern>>;
    }
>() {}

export const WinkPatternServiceLive = Layer.succeed(
    WinkPatternService,
    WinkPatternService.of({
        fromEntityPatterns: (patterns) => Effect.succeed(
            ReadonlyArray.map(patterns, winkPatternFromEntityPattern)
        )
    })
);
