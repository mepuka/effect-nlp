/**
 * Minimal Entity API Exploration
 *
 * Explore wink-nlp entity APIs to understand:
 * - Built-in vs custom entity differences
 * - Entity context data (doc/sentence/token/text/label/patterns)
 * - Minimal EntityMatch modeling
 */

import { Effect, Data, Chunk } from "effect";
import { WinkEngine } from "../NLP/Wink/WinkEngine.js";
import { WinkEngineCustomEntities } from "../NLP/Wink/WinkPattern.js";
import {
  Pattern,
  LiteralPatternElement,
  POSPatternElement,
  EntityPatternElement,
} from "../NLP/Core/Pattern.js";

// Minimal EntityMatch context - single data structure
export class EntityMatch extends Data.Class<{
  text: string;
  label: string;
  patternId: string;
  docText: string;
  sentenceText: string;
  startOffset: number;
  endOffset: number;
}> {}

const createComplexEntityPatterns = () => {
  // Pattern 1: Simple literals - tech companies
  const techCompanies = new Pattern({
    id: Pattern.Id("tech-companies"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array([
          "Google",
          "Apple",
          "Microsoft",
          "Amazon",
          "Meta",
        ]) as any,
      })
    ),
  });

  // Pattern 2: POS patterns - adjective + noun combinations
  const adjectiveNoun = new Pattern({
    id: Pattern.Id("adjective-noun"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }), // Adjective
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any }) // Noun
    ),
  });

  // Pattern 3: Complex sequence - determiner + adjective + noun
  const complexNounPhrase = new Pattern({
    id: Pattern.Id("complex-noun-phrase"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["DET"]) as any }), // Determiner (the, a, an)
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }), // Adjective
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any }) // Noun
    ),
  });

  // Pattern 4: Mixed literal + POS - company + verb + product
  const companyAction = new Pattern({
    id: Pattern.Id("company-action"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array(["Apple", "Google", "Microsoft"]) as any,
      }),
      POSPatternElement.make({ value: Data.array(["VERB"]) as any }), // Verb
      LiteralPatternElement.make({
        value: Data.array(["iPhone", "Chrome", "Windows"]) as any,
      })
    ),
  });

  // Pattern 5: Verb + preposition sequence
  const verbPreposition = new Pattern({
    id: Pattern.Id("verb-preposition"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["VERB"]) as any }), // Verb
      POSPatternElement.make({ value: Data.array(["ADP"]) as any }) // Preposition/Adposition
    ),
  });

  // Pattern 6: Number + noun combinations
  const numberNoun = new Pattern({
    id: Pattern.Id("number-noun"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["NUM"]) as any }), // Number
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any }) // Plural noun
    ),
  });

  return WinkEngineCustomEntities.fromPatterns("complex-patterns", [
    techCompanies,
    adjectiveNoun,
    complexNounPhrase,
    companyAction,
    verbPreposition,
    numberNoun,
  ]);
};

const exploreEntityAPIs = Effect.gen(function* () {
  console.log("=== Exploring Entity APIs ===\n");

  const engine = yield* WinkEngine;
  const customEntities = createComplexEntityPatterns();

  yield* engine.learnCustomEntities(customEntities);

  // Test texts for complex pattern matching
  const testTexts = [
    "Apple releases iPhone while Google develops Chrome for better performance.",
    "The innovative solution helps 50 developers working on complex projects.",
    "Microsoft creates Windows and the new system improves user experience.",
    "A smart algorithm processes 100 records during the testing phase.",
    "The efficient method generates 25 reports while analyzing big data.",
    "Google launches Chrome and the advanced browser supports 200 extensions.",
  ];

  const allMatches: Array<EntityMatch> = [];

  for (const [index, testText] of testTexts.entries()) {
    console.log(`\n--- Document ${index + 1}: "${testText}" ---`);
    const doc = yield* engine.getWinkDoc(testText);

    // Explore custom entities
    console.log("Custom entities found:");
    doc.customEntities().each((entity: any) => {
      console.log(`  Entity: "${entity.out()}"`);
      console.log(`    Type: ${entity.out("its.type")}`);
      console.log(
        `    Start/End: ${entity.out("its.startOffset")}-${entity.out(
          "its.endOffset"
        )}`
      );
      console.log(`    Parent sentence: "${entity.parentSentence()?.out()}"`);

      // Create EntityMatch instance
      const match = new EntityMatch({
        text: entity.out(),
        label: entity.out("its.type") || "custom",
        patternId: entity.out("its.type") || "unknown",
        docText: doc.out(),
        sentenceText: entity.parentSentence()?.out() || "",
        startOffset: entity.out("its.startOffset"),
        endOffset: entity.out("its.endOffset"),
      });

      allMatches.push(match);
      console.log(`    EntityMatch: ${JSON.stringify(match, null, 4)}`);
      console.log("");
    });

    // Explore tokens for custom entities
    console.log("Token analysis:");
    doc.tokens().each((token: any) => {
      const entityType = token.out("its.entity");
      if (entityType) {
        console.log(`  Entity token: "${token.out()}" (${entityType})`);

        const parentCustomEntity = token.parentCustomEntity();
        if (parentCustomEntity) {
          console.log(`    Parent entity: "${parentCustomEntity.out()}"`);
        }
      }
    });
  }

  return allMatches;
});

// Run exploration
async function runExploration() {
  const { WinkEngineLive } = await import("../NLP/Wink/WinkEngine.js");

  const matches = await Effect.runPromise(
    exploreEntityAPIs.pipe(Effect.provide(WinkEngineLive))
  );

  console.log(`\n✅ Found ${matches.length} entity matches`);
  return matches;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExploration().catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
}
