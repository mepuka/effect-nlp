import { Chunk, HashSet, Match, Schema, Data } from "effect";
import { Pattern } from "../Core/Pattern.js";

// ============================================================================
// Pattern Element Matcher
// ============================================================================

/**
 * Simple matcher type for PatternElement to string conversion
 */
export interface PatternElementMatcher {
  readonly convertToString: (element: Pattern.Element.Type) => string;
}

/**
 * Pattern matching implementation for converting PatternElement to bracket string
 * Using correct _tag values based on the TaggedClass first argument
 */
const patternElementToBracketString = Match.type<Pattern.Element.Type>().pipe(
  Match.tag("POSPatternElement", (element) =>
    Pattern.POS.toBracketString(element.value)
  ),
  Match.tag("EntityPatternElement", (element) =>
    Pattern.Entity.toBracketString(element.value)
  ),
  Match.tag("LiteralPatternElement", (element) =>
    Pattern.Literal.toBracketString(element.value)
  ),
  Match.exhaustive
);

export class CustomEntityExample extends Schema.Class<CustomEntityExample>(
  "CustomEntityExample"
)({
  name: Schema.String,
  patterns: Schema.Data(Schema.Array(Schema.String)).pipe(
    Schema.annotations({
      jsonSchema: {
        type: "array",
        items: { type: "string" },
        description: "Ordered array of pattern strings for sequential matching"
      }
    })
  ),
}) {}

export class WinkEngineCustomEntities extends Schema.Class<WinkEngineCustomEntities>(
  "WinkEngineCustomEntities"
)({
  patterns: Schema.HashSetFromSelf(CustomEntityExample).pipe(
    Schema.annotations({
      jsonSchema: {
        type: "array",
        items: true,
        uniqueItems: true,
        description: "Set of custom entity examples"
      }
    })
  ),
}) {
  static fromPatterns(
    patterns: ReadonlyArray<Pattern.Type> | Chunk.Chunk<Pattern.Type>
  ) {
    const patternChunk = Chunk.isChunk(patterns)
      ? patterns
      : Chunk.fromIterable(patterns);

    const serialized = Chunk.map(patternChunk, (pattern) => {
      const name = pattern.id;
      const patterns = patternElementChunksToBracketString(pattern);
      return new CustomEntityExample({
        name,
        patterns: Data.array(patterns),
      });
    });

    return new WinkEngineCustomEntities({
      patterns: HashSet.fromIterable(Chunk.toArray(serialized)),
    });
  }
}

export const PatternToWinkCustomEntityExample = Schema.transform(
  Pattern,
  CustomEntityExample,
  {
    strict: true,
    decode: (pattern) => {
      const name = pattern.id;
      const patterns = patternElementChunksToBracketString(pattern);
      return new CustomEntityExample({
        name,
        patterns: Data.array(patterns),
      });
    },
    encode: (customEntityExample) => {
      const id = Pattern.Id(customEntityExample.name);
      const elements = Chunk.fromIterable(customEntityExample.patterns);
      const pattern = Pattern.decode({
        id,
        elements,
      });
      return pattern;
    },
  }
);
export const patternElementChunksToBracketString = (pattern: Pattern.Type) =>
  Chunk.toArray(Chunk.map(pattern.elements, patternElementToBracketString));
