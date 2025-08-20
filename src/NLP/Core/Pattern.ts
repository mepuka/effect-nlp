import { Effect, ParseResult, Schema, Data, Order } from "effect";
// ============================================================================
// POS TAG REFERENCE
// ============================================================================

/**
 * Universal POS tags supported by wink-nlp
 * Based on https://winkjs.org/wink-nlp/part-of-speech.html
 */

export type WinkPOSTag = Schema.Schema.Type<typeof WinkPOSTag>;
const WinkPOSTag = Schema.Literal(
  "ADJ", // Adjective: Red, unique, rare, huge, happy
  "ADP", // Adposition: in, of, to, over
  "ADV", // Adverb: Very, happily, briefly, soon
  "AUX", // Auxiliary: Do, did, is, am, are, should, must, will
  "CCONJ", // Coordinating conjunction: And, or, but
  "DET", // Determiner: my, that, few, this, an, the
  "INTJ", // Interjection: Alas, oh, wow
  "NOUN", // Noun: Man, dog, table, chair
  "NUM", // Numeral: one, five, 3.14, 100
  "PART", // Particle: 's, not, n't
  "PRON", // Pronoun: You, I, he, she, myself, what, who
  "PROPN", // Proper noun: John Smith, London, UN
  "PUNCT", // Punctuation: ., ,, (), !
  "SCONJ", // Subordinating conjunction: That, if, while
  "SYM", // Symbol: $, +, =, :), 😝
  "VERB", // Verb: Run, sing, develop
  "X", // Other: Words that cannot be assigned any POS tag
  "SPACE" // Space: \n, \t, \r (wink-nlp specific)
);

export type WinkEntityType = Schema.Schema.Type<typeof WinkEntityType>;
export const WinkEntityType = Schema.Literal(
  "DATE",
  "ORDINAL",
  "CARDINAL",
  "MONEY",
  "PERCENT",
  "TIME",
  "DURATION",
  "HASHTAG",
  "EMOJI",
  "EMOTICON",
  "EMAIL",
  "URL",
  "MENTION"
);

// ============================================================================
// PATTERN ELEMENT SCHEMAS
// ============================================================================
// literal option is a literal or series of literals separated by "|"
// can half empty option [|DET] e.g. "empty or DET"

export const POSPatternOptionFromString = Schema.transformOrFail(
  Schema.NonEmptyArray(Schema.Union(WinkPOSTag, Schema.Literal(""))),
  Schema.NonEmptyString,
  {
    strict: true,
    decode: (input, _options, _ast, _fromI) => {
      // Check if there are any non-empty POS tags
      const hasValidTags = input.some((tag) => tag !== "");
      if (!hasValidTags) {
        return Effect.fail(
          new ParseResult.Type(
            _ast,
            input,
            "POS pattern must contain at least one valid POS tag"
          )
        );
      }
      return Effect.succeed(`[${input.join("|")}]`);
    },
    encode: (input, _options, _ast) => {
      const content = input.slice(1, -1); // Remove brackets
      const parts = content.split("|");

      return Schema.decodeUnknown(
        Schema.NonEmptyArray(Schema.Union(WinkPOSTag, Schema.Literal("")))
      )(parts).pipe(
        Effect.flatMap((decodedParts) => {
          // Check if there are any non-empty POS tags
          const hasValidTags = decodedParts.some((tag) => tag !== "");
          if (!hasValidTags) {
            return Effect.fail(
              new ParseResult.Type(
                _ast,
                input,
                "POS pattern must contain at least one valid POS tag"
              )
            );
          }
          return Effect.succeed(decodedParts);
        }),
        Effect.mapError(
          (error) =>
            new ParseResult.Type(
              _ast,
              input,
              `Invalid POS pattern: ${error.message}`
            )
        )
      );
    },
  }
);

export const EntityPatternOptionFromString = Schema.transformOrFail(
  Schema.NonEmptyArray(Schema.Union(WinkEntityType, Schema.Literal(""))),
  Schema.NonEmptyString,
  {
    strict: true,
    decode: (input, _options, _ast, _fromI) => {
      // Check if there are any non-empty entity types
      const hasValidTypes = input.some((type) => type !== "");
      if (!hasValidTypes) {
        return Effect.fail(
          new ParseResult.Type(
            _ast,
            input,
            "Entity pattern must contain at least one valid entity type"
          )
        );
      }
      return Effect.succeed(`[${input.join("|")}]`);
    },
    encode: (input, _options, _ast) => {
      const content = input.slice(1, -1); // Remove brackets
      const parts = content.split("|");

      return Schema.decodeUnknown(
        Schema.NonEmptyArray(Schema.Union(WinkEntityType, Schema.Literal("")))
      )(parts).pipe(
        Effect.flatMap((decodedParts) => {
          // Check if there are any non-empty entity types
          const hasValidTypes = decodedParts.some((type) => type !== "");
          if (!hasValidTypes) {
            return Effect.fail(
              new ParseResult.Type(
                _ast,
                input,
                "Entity pattern must contain at least one valid entity type"
              )
            );
          }
          return Effect.succeed(decodedParts);
        }),
        Effect.mapError(
          (error) =>
            new ParseResult.Type(
              _ast,
              input,
              `Invalid entity pattern: ${error.message}`
            )
        )
      );
    },
  }
);

export const LiteralPatternOptionFromString = Schema.transformOrFail(
  Schema.NonEmptyArray(Schema.Union(Schema.NonEmptyString, Schema.Literal(""))),
  Schema.NonEmptyString,
  {
    strict: true,
    decode: (input, _options, _ast, _fromI) => {
      // Check if there are any non-empty literals
      const hasValidLiterals = input.some((literal) => literal !== "");
      if (!hasValidLiterals) {
        return Effect.fail(
          new ParseResult.Type(
            _ast,
            input,
            "Literal pattern must contain at least one valid literal"
          )
        );
      }
      return Effect.succeed(`[${input.join("|")}]`);
    },
    encode: (input, _options, _ast) => {
      const content = input.slice(1, -1); // Remove brackets
      const parts = content.split("|");

      return Schema.decodeUnknown(
        Schema.NonEmptyArray(
          Schema.Union(Schema.NonEmptyString, Schema.Literal(""))
        )
      )(parts).pipe(
        Effect.flatMap((decodedParts) => {
          // Check if there are any non-empty literals
          const hasValidLiterals = decodedParts.some(
            (literal) => literal !== ""
          );
          if (!hasValidLiterals) {
            return Effect.fail(
              new ParseResult.Type(
                _ast,
                input,
                "Literal pattern must contain at least one valid literal"
              )
            );
          }
          return Effect.succeed(decodedParts);
        }),
        Effect.mapError(
          (error) =>
            new ParseResult.Type(
              _ast,
              input,
              `Invalid literal pattern: ${error.message}`
            )
        )
      );
    },
  }
);

// ============================================================================
// PATTERN ELEMENT TAGGED STRUCTS
// ============================================================================

export const POSPatternElement = Schema.TaggedStruct("pos", {
  value: POSPatternOptionFromString.pipe(
    Schema.annotations({
      title: "POS Pattern String",
      description:
        "A bracket-wrapped string containing POS tags separated by pipes",
      examples: ["[NOUN|VERB|ADJ]", "[|DET]", "[ADJ|NOUN]", "[|ADJ|NOUN]"],
      documentation: `
POS pattern format: [TAG1|TAG2|...]
- Must be wrapped in square brackets
- Tags separated by pipe (|) character
- Empty string (|) represents optional element
- At least one non-empty tag required
- Valid tags: ADJ, ADP, ADV, AUX, CCONJ, DET, INTJ, NOUN, NUM, PART, PRON, PROPN, PUNCT, SCONJ, SYM, VERB, X, SPACE

Examples:
- "[NOUN|VERB|ADJ]" - matches any of these POS tags
- "[|DET]" - optional determiner
- "[ADJ|NOUN]" - adjective or noun
- "[|ADJ|NOUN]" - optional adjective followed by noun
      `,
    })
  ),
}).pipe(
  Schema.annotations({
    title: "POS Pattern Element",
    description: "A pattern element representing Part-of-Speech tag options",
    examples: [
      { _tag: "pos", value: "[NOUN|VERB|ADJ]" },
      { _tag: "pos", value: "[|DET]" },
      { _tag: "pos", value: "[ADJ|NOUN]" },
    ],
  })
);

export const EntityPatternElement = Schema.TaggedStruct("entity", {
  value: EntityPatternOptionFromString.pipe(
    Schema.annotations({
      title: "Entity Pattern String",
      description:
        "A bracket-wrapped string containing entity types separated by pipes",
      examples: [
        "[CARDINAL|TIME]",
        "[DATE|]",
        "[MONEY|PERCENT]",
        "[|CARDINAL|TIME]",
      ],
      documentation: `
Entity pattern format: [TYPE1|TYPE2|...]
- Must be wrapped in square brackets
- Types separated by pipe (|) character
- Empty string (|) represents optional element
- At least one non-empty type required
- Valid types: DATE, ORDINAL, CARDINAL, MONEY, PERCENT, TIME, DURATION, HASHTAG, EMOJI, EMOTICON, EMAIL, URL, MENTION

Examples:
- "[CARDINAL|TIME]" - matches cardinal numbers or time entities
- "[DATE|]" - optional date entity
- "[MONEY|PERCENT]" - money or percentage entities
- "[|CARDINAL|TIME]" - optional cardinal followed by time
      `,
    })
  ),
}).pipe(
  Schema.annotations({
    title: "Entity Pattern Element",
    description: "A pattern element representing named entity type options",
    examples: [
      { _tag: "entity", value: "[CARDINAL|TIME]" },
      { _tag: "entity", value: "[DATE|]" },
      { _tag: "entity", value: "[MONEY|PERCENT]" },
    ],
  })
);

export const LiteralPatternElement = Schema.TaggedStruct("literal", {
  value: LiteralPatternOptionFromString.pipe(
    Schema.annotations({
      title: "Literal Pattern String",
      description:
        "A bracket-wrapped string containing literal words separated by pipes",
      examples: [
        "[Classic|Supreme|Extravaganza]",
        "[Delivery|]",
        "[Corn|Capsicum|Onion]",
        "[|Small|Medium|Large]",
      ],
      documentation: `
Literal pattern format: [WORD1|WORD2|...]
- Must be wrapped in square brackets
- Words separated by pipe (|) character
- Empty string (|) represents optional element
- At least one non-empty word required
- Words are matched exactly as written (case-sensitive)

Examples:
- "[Classic|Supreme|Extravaganza]" - matches any of these pizza types
- "[Delivery|]" - optional delivery option
- "[Corn|Capsicum|Onion]" - matches any of these toppings
- "[|Small|Medium|Large]" - optional size specification
      `,
    })
  ),
}).pipe(
  Schema.annotations({
    title: "Literal Pattern Element",
    description: "A pattern element representing literal word options",
    examples: [
      { _tag: "literal", value: "[Classic|Supreme|Extravaganza]" },
      { _tag: "literal", value: "[Delivery|]" },
      { _tag: "literal", value: "[Corn|Capsicum|Onion]" },
    ],
  })
);

// ============================================================================
// PATTERN ELEMENT UNION TYPE
// ============================================================================

export type PatternElement = Schema.Schema.Type<typeof PatternElement>;
export const PatternElement = Schema.Union(
  POSPatternElement,
  EntityPatternElement,
  LiteralPatternElement
).pipe(
  Schema.annotations({
    title: "Pattern Element",
    description:
      "A pattern element that can be a POS tag, entity type, or literal word group",
    examples: [
      { _tag: "pos", value: "[NOUN|VERB|ADJ]" },
      { _tag: "entity", value: "[CARDINAL|TIME]" },
      { _tag: "literal", value: "[Classic|Supreme|Extravaganza]" },
    ],
    documentation: `
Pattern elements are the building blocks of wink-nlp patterns. Each element represents
a group of options that can match at a specific position in the text.

Types:
- pos: Part-of-Speech tags (NOUN, VERB, ADJ, etc.)
- entity: Named entity types (CARDINAL, TIME, DATE, etc.)
- literal: Exact word matches (Classic, Supreme, etc.)

All elements use the same bracket format: [OPTION1|OPTION2|...]
Empty options (|) represent optional elements that may or may not be present.
      `,
  })
);

export const Pattern = Schema.TaggedStruct("pattern", {
  elements: Schema.NonEmptyArray(PatternElement),
}).pipe(
  Schema.annotations({
    title: "Pattern",
    description: "A pattern representing a group of pattern elements",
  })
);

export type Pattern = Schema.Schema.Type<typeof Pattern>;

// ============================================================================
// ENHANCED PATTERN DATA TYPES
// ============================================================================

/**
 * EntityPattern - First-class pattern data object with ordering capabilities
 */
export const EntityPattern = Data.case<{
  readonly id: string;
  readonly name: string;
  readonly pattern: Pattern;
  readonly priority: number; // Arbitrary numeric priority (higher = first)
  readonly weight?: number; // Optional weight for tie-breaking
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}>();

export type EntityPattern = ReturnType<typeof EntityPattern>;

/**
 * Order instance for EntityPattern - supports arbitrary priority values
 * Primary: priority (higher first), Secondary: weight (higher first), Tertiary: name (lexical)
 */
export const EntityPatternOrder: Order.Order<EntityPattern> = Order.make(
  (a, b) => {
    // Primary: priority (higher numbers first)
    if (a.priority < b.priority) return 1;
    if (a.priority > b.priority) return -1;

    // Secondary: weight (higher numbers first, treat undefined as 0)
    const weightA = a.weight ?? 0;
    const weightB = b.weight ?? 0;
    if (weightA < weightB) return 1;
    if (weightA > weightB) return -1;

    // Tertiary: name (lexical for deterministic ordering)
    const nameComparison = a.name.localeCompare(b.name);
    if (nameComparison < 0) return -1;
    if (nameComparison > 0) return 1;
    return 0;
  }
);
