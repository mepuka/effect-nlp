/**
 * Wink API Corrections - Testing Proper API Usage
 *
 * Based on wink-nlp documentation:
 * - https://winkjs.org/wink-nlp/leveraging-out.html
 * - https://winkjs.org/wink-nlp/its-as-helper.html
 */

import { Effect, Data, Chunk } from "effect";
import { WinkEngine } from "../NLP/Wink/WinkEngine.js";
import { WinkEngineCustomEntities } from "../NLP/Wink/WinkPattern.js";
import {
  Pattern,
  LiteralPatternElement,
  POSPatternElement,
} from "../NLP/Core/Pattern.js";

// Corrected EntityMatch with proper offset types
export class CorrectedEntityMatch extends Data.Class<{
  text: string;
  label: string;
  patternId: string;
  docText: string;
  sentenceText: string;
  span: [number, number]; // Token span indexes
  tokenCount: number;
}> {}

const createTestPatterns = () => {
  const companies = new Pattern({
    id: Pattern.Id("tech-companies"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array(["Apple", "Google", "Microsoft"]) as any,
      })
    ),
  });

  const adjNoun = new Pattern({
    id: Pattern.Id("adjective-noun"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  return WinkEngineCustomEntities.fromPatterns("test-patterns", [
    companies,
    adjNoun,
  ]);
};

const testCorrectWinkAPIs = Effect.gen(function* () {
  console.log("=== Testing Correct Wink API Usage ===\n");

  const engine = yield* WinkEngine;
  const customEntities = createTestPatterns();

  yield* engine.learnCustomEntities(customEntities);

  const testText =
    "Apple creates innovative solutions while Google develops advanced technology.";
  const doc = yield* engine.getWinkDoc(testText);

  console.log(`Text: "${testText}"\n`);

  // Get its and as helpers
  const its = yield* engine.its;
  const _as = yield* engine.as;

  console.log("=== Document Analysis ===");
  console.log(`Document span: ${JSON.stringify(doc.out(its.span))}`);
  console.log(`Document token count: ${doc.tokens().length()}`);
  console.log("");

  console.log("=== Custom Entities Analysis ===");
  console.log(`Custom entities count: ${doc.customEntities().length()}`);

  doc.customEntities().each((entity: any, index: number) => {
    console.log(`Entity ${index + 1}:`);
    console.log(`  Text: "${entity.out()}"`);
    console.log(`  Type: ${entity.out(its.type)}`);

    // Test different span access methods
    const entitySpan = entity.out(its.span);
    console.log(`  Span (token indexes): ${JSON.stringify(entitySpan)}`);

    // Get token count in entity
    const tokenCount = entity.tokens().length();
    console.log(`  Token count: ${tokenCount}`);

    // Get sentence context
    const parentSentence = entity.parentSentence();
    console.log(`  Parent sentence: "${parentSentence?.out()}"`);

    // Analyze tokens within this entity
    console.log(`  Tokens in entity:`);
    entity.tokens().each((token: any, tokenIndex: number) => {
      console.log(
        `    Token ${tokenIndex}: "${token.out()}" (POS: ${token.out(its.pos)})`
      );
    });

    console.log("");
  });

  console.log("=== Token-by-Token Analysis ===");
  doc.tokens().each((token: any, index: number) => {
    const tokenText = token.out();
    const pos = token.out(its.pos);
    const type = token.out(its.type);

    // Check if token is part of a custom entity
    const parentEntity = token.parentCustomEntity();
    const isInCustomEntity = parentEntity !== undefined;

    if (isInCustomEntity) {
      console.log(
        `Token ${index}: "${tokenText}" (POS: ${pos}, Type: ${type})`
      );
      console.log(`  → Part of custom entity: "${parentEntity?.out()}"`);
    }
  });

  console.log("\n=== Built-in Entities (for comparison) ===");
  console.log(`Built-in entities count: ${doc.entities().length()}`);

  doc.entities().each((entity: any, index: number) => {
    console.log(`Built-in Entity ${index + 1}:`);
    console.log(`  Text: "${entity.out()}"`);
    console.log(`  Type: ${entity.out(its.type)}`);
    console.log(`  Span: ${JSON.stringify(entity.out(its.span))}`);
    console.log("");
  });

  console.log("=== Sentence Analysis ===");
  doc.sentences().each((sentence: any, index: number) => {
    console.log(`Sentence ${index + 1}: "${sentence.out()}"`);
    console.log(`  Span: ${JSON.stringify(sentence.out(its.span))}`);
    console.log(`  Token count: ${sentence.tokens().length()}`);
    console.log(
      `  Custom entities in sentence: ${sentence.customEntities().length()}`
    );
    console.log("");
  });

  // Create corrected EntityMatch instances
  const correctedMatches: Array<CorrectedEntityMatch> = [];

  doc.customEntities().each((entity: any) => {
    const span = entity.out(its.span) as [number, number];
    const match = new CorrectedEntityMatch({
      text: entity.out(),
      label: entity.out(its.type) || "custom",
      patternId: entity.out(its.type) || "unknown", // Will need better mapping
      docText: doc.out(),
      sentenceText: entity.parentSentence()?.out() || "",
      span,
      tokenCount: entity.tokens().length(),
    });

    correctedMatches.push(match);
    console.log(`Corrected EntityMatch: ${JSON.stringify(match, null, 2)}`);
  });

  return correctedMatches;
});

// Run the corrected API test
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runCorrectedTest() {
    const { WinkEngineLive } = await import("../NLP/Wink/WinkEngine.js");

    const matches = await Effect.runPromise(
      testCorrectWinkAPIs.pipe(Effect.provide(WinkEngineLive))
    );

    console.log(`\n✅ Found ${matches.length} corrected entity matches`);
    return matches;
  }

  runCorrectedTest().catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
}
