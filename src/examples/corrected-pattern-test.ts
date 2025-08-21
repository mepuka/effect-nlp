/**
 * Corrected Pattern Testing - Proper POS Combinations
 * 
 * Fixing the issue where POS elements were split instead of combined
 */

import { Effect, Data, Chunk, Option } from "effect";
import { WinkEngine } from "../NLP/Wink/WinkEngine.js";
import { WinkEngineCustomEntities } from "../NLP/Wink/WinkPattern.js";
import {
  Pattern,
  LiteralPatternElement,
  POSPatternElement,
  EntityPatternElement,
} from "../NLP/Core/Pattern.js";

const createCorrectedPatterns = () => {
  // Pattern 1: Content words (ADJ OR NOUN OR VERB at one position)
  const contentWords = new Pattern({
    id: Pattern.Id("content-words"),
    elements: Chunk.make(
      POSPatternElement.make({ 
        value: Data.array(["ADJ", "NOUN", "VERB"]) as any 
      })
    ),
  });

  // Pattern 2: Adjective followed by Noun (sequence of two positions)
  const adjectiveNoun = new Pattern({
    id: Pattern.Id("adjective-noun-sequence"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  // Pattern 3: Function words (DET OR ADP OR CCONJ at one position) 
  const functionWords = new Pattern({
    id: Pattern.Id("function-words"),
    elements: Chunk.make(
      POSPatternElement.make({ 
        value: Data.array(["DET", "ADP", "CCONJ"]) as any 
      })
    ),
  });

  // Pattern 4: Complex noun phrase (DET + ADJ + NOUN sequence)
  const complexNounPhrase = new Pattern({
    id: Pattern.Id("complex-noun-phrase"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["DET"]) as any }),
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  // Pattern 5: Mixed content (VERB OR NOUN) + companies
  const actionCompanies = new Pattern({
    id: Pattern.Id("action-companies"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array(["Apple", "Google", "Microsoft"]) as any,
      }),
      POSPatternElement.make({ 
        value: Data.array(["VERB", "NOUN"]) as any 
      })
    ),
  });

  // Pattern 6: Optional patterns with empty string
  const optionalPattern = new Pattern({
    id: Pattern.Id("optional-determiner"),
    elements: Chunk.make(
      POSPatternElement.make({ 
        value: Data.array(["", "DET"]) as any  // Optional determiner
      }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  // Pattern 7: Numbers and entities combined
  const numberEntity = new Pattern({
    id: Pattern.Id("number-entity"),
    elements: Chunk.make(
      POSPatternElement.make({ 
        value: Data.array(["NUM"]) as any 
      }),
      EntityPatternElement.make({
        value: Data.array(["MONEY", "PERCENT", "CARDINAL"]) as any,
      })
    ),
  });

  // Pattern 8: MARK test - extract just the company name
  const markedCompany = new Pattern({
    id: Pattern.Id("marked-company"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array(["Apple", "Google", "Microsoft"]) as any,
      }),
      POSPatternElement.make({ value: Data.array(["VERB"]) as any }),
      POSPatternElement.make({ value: Data.array(["ADJ", "NOUN"]) as any })
    ),
    mark: Option.some([0, 0]), // Extract only the company name
  });

  return WinkEngineCustomEntities.fromPatterns("corrected-patterns", [
    contentWords,
    adjectiveNoun,
    functionWords,
    complexNounPhrase,
    actionCompanies,
    optionalPattern,
    numberEntity,
    markedCompany,
  ]);
};

const testCorrectedPatterns = Effect.gen(function* () {
  console.log("🔧 Testing Corrected POS Pattern Combinations\n");

  const engine = yield* WinkEngine;
  const customEntities = createCorrectedPatterns();

  yield* engine.learnCustomEntities(customEntities);

  const testTexts = [
    "Apple develops innovative solutions for users.",
    "The smart algorithm processes complex data efficiently.", 
    "Google creates powerful tools and applications.",
    "Microsoft builds advanced software systems.",
    "A quick brown fox jumps over the lazy dog.",
    "The innovative company launched revolutionary products.",
    "Happy developers write clean code daily.",
    "50 million users access the platform.",
    "Strong performance improves user experience significantly.",
    "The efficient system handles multiple requests."
  ];

  const its = yield* engine.its;
  let totalMatches = 0;

  for (const [index, text] of testTexts.entries()) {
    console.log(`\nDocument ${index + 1}: "${text}"`);
    const doc = yield* engine.getWinkDoc(text);
    
    let documentMatches = 0;
    
    doc.customEntities().each((entity: any) => {
      const span = entity.out(its.span);
      const type = entity.out(its.type);
      
      console.log(`  ✅ "${entity.out()}" [${type}] span: [${span[0]},${span[1]}]`);
      
      // Check if this is a marked extraction
      if (type === "marked-company") {
        console.log(`    🎯 MARKED: "${entity.out()}"`);
      }
      
      documentMatches++;
      totalMatches++;
    });
    
    if (documentMatches === 0) {
      console.log("  ❌ No matches found");
    }
  }

  console.log(`\n📊 CORRECTED PATTERN RESULTS:`);
  console.log(`Total matches: ${totalMatches}`);
  console.log(`Success rate: ${((totalMatches / testTexts.length) * 100).toFixed(1)}%`);
  
  return totalMatches;
});

// Run the corrected test
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runCorrectedTest() {
    const { WinkEngineLive } = await import("../NLP/Wink/WinkEngine.js");

    const matches = await Effect.runPromise(
      testCorrectedPatterns.pipe(Effect.provide(WinkEngineLive))
    );

    console.log(`\n🎉 Corrected pattern test completed with ${matches} matches!`);
    return matches;
  }

  runCorrectedTest().catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
}