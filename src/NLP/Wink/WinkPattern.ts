import {
  Chunk,
  HashSet,
  Match,
  Schema,
  Data,
  Hash,
  Equal,
  Equivalence,
  Pipeable,
} from "effect";
import { Pattern } from "../Core/Pattern.js";

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Branded type for entity group names
 */
export type EntityGroupName = Schema.Schema.Type<typeof EntityGroupName>;
export const EntityGroupName = Schema.NonEmptyString.pipe(
  Schema.brand("EntityGroupName"),
  Schema.annotations({
    identifier: "effect-nlp/WinkPattern/EntityGroupName",
    title: "Entity Group Name",
    description: "A branded string representing a unique entity group name",
  })
);

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
        description: "Ordered array of pattern strings for sequential matching",
      },
    })
  ),
}) {}

export class WinkEngineCustomEntities
  extends Schema.Class<WinkEngineCustomEntities>("WinkEngineCustomEntities")({
    name: EntityGroupName,
    patterns: Schema.HashSetFromSelf(CustomEntityExample).pipe(
      Schema.annotations({
        jsonSchema: {
          type: "array",
          items: true,
          uniqueItems: true,
          description: "Set of custom entity examples",
        },
      })
    ),
  })
  implements Pipeable.Pipeable
{
  static fromPatterns(
    name: EntityGroupName | string,
    patterns: ReadonlyArray<Pattern.Type> | Chunk.Chunk<Pattern.Type>
  ) {
    const groupName = Schema.is(EntityGroupName)(name)
      ? name
      : EntityGroupName.make(name);
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
      name: groupName,
      patterns: HashSet.fromIterable(Chunk.toArray(serialized)),
    });
  }

  // ============================================================================
  // Pipeable Implementation
  // ============================================================================

  pipe(): WinkEngineCustomEntities;
  pipe<A>(ab: (input: WinkEngineCustomEntities) => A): A;
  pipe<A, B>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B
  ): B;
  pipe<A, B, C>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C
  ): C;
  pipe<A, B, C, D>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D
  ): D;
  pipe<A, B, C, D, E>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D,
    ef: (input: D) => E
  ): E;
  pipe<A, B, C, D, E, F>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D,
    ef: (input: D) => E,
    fg: (input: E) => F
  ): F;
  pipe<A, B, C, D, E, F, G>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D,
    ef: (input: D) => E,
    fg: (input: E) => F,
    gh: (input: F) => G
  ): G;
  pipe<A, B, C, D, E, F, G, H>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D,
    ef: (input: D) => E,
    fg: (input: E) => F,
    gh: (input: F) => G,
    hi: (input: G) => H
  ): H;
  pipe<A, B, C, D, E, F, G, H, I>(
    ab: (input: WinkEngineCustomEntities) => A,
    bc: (input: A) => B,
    cd: (input: B) => C,
    de: (input: C) => D,
    ef: (input: D) => E,
    fg: (input: E) => F,
    gh: (input: F) => G,
    hi: (input: G) => H,
    ij: (input: H) => I
  ): I;
  pipe(...args: ReadonlyArray<(input: any) => any>): any {
    switch (args.length) {
      case 0:
        return this;
      case 1:
        return args[0](this);
      default:
        return args.reduce((acc, fn) => fn(acc), this);
    }
  }

  // ============================================================================
  // Hash and Equivalence Utilities
  // ============================================================================

  /**
   * Get hash of this WinkEngineCustomEntities instance
   * Uses Effect's built-in Hash implementation from Schema.Class
   */
  getHash(): number {
    return Hash.hash(this);
  }

  /**
   * Check equality with another WinkEngineCustomEntities instance
   * Uses Effect's built-in Equal implementation from Schema.Class
   */
  equals(other: WinkEngineCustomEntities): boolean {
    return Equal.equals(this, other);
  }

  /**
   * Get equivalence instance for WinkEngineCustomEntities
   * Useful for creating custom collections or comparisons
   */
  static getEquivalence(): Equivalence.Equivalence<WinkEngineCustomEntities> {
    return Equivalence.make((self, that) => Equal.equals(self, that));
  }

  /**
   * Merge with another WinkEngineCustomEntities instance
   * Returns new instance with union of patterns (deduplicates automatically)
   * Requires explicit name specification for the merged result
   */
  merge(
    other: WinkEngineCustomEntities,
    newName: EntityGroupName | string
  ): WinkEngineCustomEntities {
    const mergedPatterns = HashSet.union(this.patterns, other.patterns);
    const resultName =
      typeof newName === "string" ? EntityGroupName.make(newName) : newName;

    return new WinkEngineCustomEntities({
      name: resultName,
      patterns: mergedPatterns,
    });
  }

  /**
   * Rename this entity group
   */
  rename(newName: EntityGroupName | string): WinkEngineCustomEntities {
    const name = Schema.is(EntityGroupName)(newName)
      ? newName
      : EntityGroupName.make(newName);
    return new WinkEngineCustomEntities({
      name,
      patterns: this.patterns,
    });
  }

  /**
   * Add a single pattern to this entities collection
   * Returns new instance with the pattern added (deduplicates automatically)
   */
  addPattern(pattern: Pattern.Type): WinkEngineCustomEntities {
    const entity = Schema.decodeSync(PatternToWinkCustomEntityExample)(
      Pattern.encode(pattern)
    );
    const updatedPatterns = HashSet.add(this.patterns, entity);
    return new WinkEngineCustomEntities({
      name: this.name,
      patterns: updatedPatterns,
    });
  }

  /**
   * Remove a pattern by name
   * Returns new instance with the named pattern removed
   */
  removePattern(name: EntityGroupName | string): WinkEngineCustomEntities {
    const nameToRemove = Schema.is(EntityGroupName)(name)
      ? name
      : EntityGroupName.make(name);
    const filteredPatterns = HashSet.filter(
      this.patterns,
      (entity: CustomEntityExample) => entity.name !== nameToRemove
    );
    return new WinkEngineCustomEntities({
      name: this.name,
      patterns: filteredPatterns,
    });
  }

  /**
   * Get pattern by name
   * Returns the CustomEntityExample if found, otherwise undefined
   */
  getPattern(name: EntityGroupName | string): CustomEntityExample | undefined {
    const nameToGet = Schema.is(EntityGroupName)(name)
      ? name
      : EntityGroupName.make(name);
    const values = HashSet.toValues(this.patterns);
    return values.find((entity) => entity.name === nameToGet);
  }

  /**
   * Check if a pattern with the given name exists
   */
  hasPattern(name: EntityGroupName | string): boolean {
    const nameToCheck = Schema.is(EntityGroupName)(name)
      ? name
      : EntityGroupName.make(name);
    return HashSet.some(this.patterns, (entity: CustomEntityExample) =>
      Equal.equals(entity.name, nameToCheck)
    );
  }

  /**
   * Get the number of unique patterns
   */
  size(): number {
    return HashSet.size(this.patterns);
  }

  /**
   * Check if the entities collection is empty
   */
  isEmpty(): boolean {
    return HashSet.size(this.patterns) === 0;
  }

  /**
   * Convert to array for iteration or external APIs
   */
  toArray(): ReadonlyArray<CustomEntityExample> {
    return HashSet.toValues(this.patterns);
  }

  /**
   * Convert to wink-nlp compatible format
   * Returns array of objects with name and patterns for wink-nlp.learnCustomEntities()
   */
  toWinkFormat(): ReadonlyArray<{
    name: string;
    patterns: ReadonlyArray<string>;
  }> {
    return HashSet.toValues(this.patterns).map(
      (entity: CustomEntityExample) => ({
        name: entity.name,
        patterns: entity.patterns as ReadonlyArray<string>,
      })
    );
  }

  /**
   * Create a debug string representation
   */
  toDebugString(): string {
    const entities = this.toArray();
    return `WinkEngineCustomEntities("${this.name}", ${
      entities.length
    } entities): ${entities
      .map((e) => `${e.name}[${e.patterns.length}]`)
      .join(", ")}`;
  }

  // ============================================================================
  // Static Data-First Utility Functions (for pipe operations)
  // ============================================================================

  /**
   * Data-first merge operation
   * Usage: pipe(entities1, WinkEngineCustomEntities.mergeWith(entities2, "new-name"))
   */
  static mergeWith =
    (other: WinkEngineCustomEntities, newName: EntityGroupName | string) =>
    (self: WinkEngineCustomEntities) =>
      self.merge(other, newName);

  /**
   * Data-first rename operation
   * Usage: pipe(entities, WinkEngineCustomEntities.renameTo("new-name"))
   */
  static renameTo =
    (newName: EntityGroupName | string) => (self: WinkEngineCustomEntities) =>
      self.rename(newName);

  /**
   * Data-first add pattern operation
   * Usage: pipe(entities, WinkEngineCustomEntities.addingPattern(pattern))
   */
  static addingPattern =
    (pattern: Pattern.Type) => (self: WinkEngineCustomEntities) =>
      self.addPattern(pattern);

  /**
   * Data-first remove pattern operation
   * Usage: pipe(entities, WinkEngineCustomEntities.removingPattern("pattern-name"))
   */
  static removingPattern =
    (name: EntityGroupName | string) => (self: WinkEngineCustomEntities) =>
      self.removePattern(name);

  /**
   * Data-first filter operation
   * Usage: pipe(entities, WinkEngineCustomEntities.filteringBy(predicate))
   */
  static filteringBy =
    (predicate: (entity: CustomEntityExample) => boolean) =>
    (self: WinkEngineCustomEntities) => {
      const filteredPatterns = HashSet.filter(self.patterns, predicate);
      return new WinkEngineCustomEntities({
        name: self.name,
        patterns: filteredPatterns,
      });
    };
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
