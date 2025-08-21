/**
 * Data Visualization Scripts
 *
 * Basic string processing to visualize:
 * - ADT nature of Effect Schema structures
 * - Pattern elements vs match data
 * - Semantic concepts, linguistic patterns, and context
 * - Living data structure for capture and analysis
 */

import { Effect, Data, Chunk, pipe } from "effect";
import { WinkEngine } from "../NLP/Wink/WinkEngine.js";
import { WinkEngineCustomEntities } from "../NLP/Wink/WinkPattern.js";
import {
  Pattern,
  LiteralPatternElement,
  POSPatternElement,
} from "../NLP/Core/Pattern.js";

// ============================================================================
// CORE DATA STRUCTURES FOR VISUALIZATION
// ============================================================================

export class LinguisticFeatures extends Data.Class<{
  text: string;
  pos: string;
  lemma?: string;
  tokenIndex: number;
  isEntityPart: boolean;
}> {}

export class PatternElement extends Data.Class<{
  type: "LITERAL" | "POS" | "ENTITY";
  values: ReadonlyArray<string>;
  position: number;
}> {}

export class PatternDefinition extends Data.Class<{
  id: string;
  name: string;
  elements: ReadonlyArray<PatternElement>;
  expectedStructure: string;
}> {}

export class MatchInstance extends Data.Class<{
  text: string;
  patternId: string;
  span: [number, number];
  tokenFeatures: ReadonlyArray<LinguisticFeatures>;
  sentenceContext: string;
  semanticConcept?: string;
}> {}

export class DataVisualization extends Data.Class<{
  patterns: ReadonlyArray<PatternDefinition>;
  matches: ReadonlyArray<MatchInstance>;
  corpusText: string;
  timestamp: Date;
}> {}

// ============================================================================
// VISUALIZATION UTILITIES
// ============================================================================

const createVisualPatterns = () => {
  // Pattern 1: Company entities
  const companies = new Pattern({
    id: Pattern.Id("tech-companies"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: Data.array(["Apple", "Google", "Microsoft", "Amazon"]) as any,
      })
    ),
  });

  // Pattern 2: Action phrases (Verb + Object)
  const actionPhrases = new Pattern({
    id: Pattern.Id("action-phrases"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["VERB"]) as any }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  // Pattern 3: Descriptive phrases (Adj + Noun)
  const descriptive = new Pattern({
    id: Pattern.Id("descriptive-phrases"),
    elements: Chunk.make(
      POSPatternElement.make({ value: Data.array(["ADJ"]) as any }),
      POSPatternElement.make({ value: Data.array(["NOUN"]) as any })
    ),
  });

  return WinkEngineCustomEntities.fromPatterns("demo-patterns", [
    companies,
    actionPhrases,
    descriptive,
  ]);
};

const extractPatternDefinitions = (
  customEntities: WinkEngineCustomEntities
): ReadonlyArray<PatternDefinition> => {
  const patterns = customEntities.toArray();

  return patterns.map((entity, index) => {
    // Parse the pattern strings to understand structure
    const patternStrings = entity.patterns;
    const elements: Array<PatternElement> = [];

    patternStrings.forEach((patternStr, pos) => {
      if (patternStr.includes("[") && patternStr.includes("]")) {
        // This is a POS or Entity pattern
        const content = patternStr.slice(1, -1); // Remove brackets
        const isPos = ["ADJ", "NOUN", "VERB", "ADP", "DET"].some((tag) =>
          content.includes(tag)
        );

        elements.push(
          new PatternElement({
            type: isPos ? "POS" : "ENTITY",
            values: content.split("|"),
            position: pos,
          })
        );
      } else {
        // This is a literal pattern
        elements.push(
          new PatternElement({
            type: "LITERAL",
            values: [patternStr],
            position: pos,
          })
        );
      }
    });

    return new PatternDefinition({
      id: entity.name,
      name: entity.name,
      elements,
      expectedStructure: patternStrings.join(" "),
    });
  });
};

const visualizeADTStructure = (data: DataVisualization): string => {
  let output = "\n" + "=".repeat(80) + "\n";
  output += "ADT STRUCTURE VISUALIZATION\n";
  output += "=".repeat(80) + "\n\n";

  // Visualize Pattern ADTs
  output += "📋 PATTERN DEFINITIONS (ADT Schema)\n";
  output += "-".repeat(50) + "\n";

  data.patterns.forEach((pattern, i) => {
    output += `Pattern ${i + 1}: ${pattern.name}\n`;
    output += `  ID: ${pattern.id}\n`;
    output += `  Structure: ${pattern.expectedStructure}\n`;
    output += `  Elements:\n`;

    pattern.elements.forEach((element, j) => {
      output += `    [${j}] Type: ${element.type}\n`;
      output += `        Values: [${element.values.join(", ")}]\n`;
    });
    output += "\n";
  });

  // Visualize Match Instance ADTs
  output += "🎯 MATCH INSTANCES (Data)\n";
  output += "-".repeat(50) + "\n";

  data.matches.forEach((match, i) => {
    output += `Match ${i + 1}: "${match.text}"\n`;
    output += `  Pattern: ${match.patternId}\n`;
    output += `  Span: [${match.span[0]}, ${match.span[1]}]\n`;
    output += `  Context: "${match.sentenceContext}"\n`;
    output += `  Semantic: ${match.semanticConcept || "undefined"}\n`;
    output += `  Linguistic Features:\n`;

    match.tokenFeatures.forEach((feature, j) => {
      const marker = feature.isEntityPart ? "🔴" : "⚫";
      output += `    ${marker} [${feature.tokenIndex}] "${feature.text}" (${feature.pos})\n`;
    });
    output += "\n";
  });

  return output;
};

const visualizePatternMatching = (
  patterns: ReadonlyArray<PatternDefinition>,
  matches: ReadonlyArray<MatchInstance>
): string => {
  let output = "\n" + "=".repeat(80) + "\n";
  output += "PATTERN → MATCH RELATIONSHIPS\n";
  output += "=".repeat(80) + "\n\n";

  patterns.forEach((pattern) => {
    const patternMatches = matches.filter((m) => m.patternId === pattern.id);

    output += `📐 PATTERN: ${pattern.name}\n`;
    output += `   Template: ${pattern.expectedStructure}\n`;
    output += `   Elements: ${pattern.elements
      .map((e) => `${e.type}(${e.values.join("|")})`)
      .join(" → ")}\n`;
    output += `   Matches Found: ${patternMatches.length}\n\n`;

    if (patternMatches.length > 0) {
      output += `   🎯 MATCHED INSTANCES:\n`;
      patternMatches.forEach((match, i) => {
        output += `   ${i + 1}. "${match.text}"\n`;
        output += `      Tokens: ${match.tokenFeatures
          .map((f) => `${f.text}(${f.pos})`)
          .join(" ")}\n`;
        output += `      Context: "...${match.sentenceContext.slice(
          0,
          50
        )}..."\n`;
      });
    } else {
      output += `   ❌ No matches found\n`;
    }
    output += "\n" + "-".repeat(60) + "\n\n";
  });

  return output;
};

const visualizeLinguisticLayers = (
  matches: ReadonlyArray<MatchInstance>
): string => {
  let output = "\n" + "=".repeat(80) + "\n";
  output += "LINGUISTIC ANALYSIS LAYERS\n";
  output += "=".repeat(80) + "\n\n";

  matches.forEach((match, i) => {
    output += `🔍 MATCH ${i + 1}: "${match.text}"\n`;
    output += "-".repeat(40) + "\n";

    // Token-level analysis
    output += "Token Layer:\n";
    output += "  Index | Text      | POS    | Entity | Lemma\n";
    output += "  ------|-----------|--------|--------|-------\n";

    match.tokenFeatures.forEach((feature) => {
      const entityMark = feature.isEntityPart ? "   ✓   " : "   ✗   ";
      const text = feature.text.padEnd(9);
      const pos = feature.pos.padEnd(6);
      const lemma = (feature.lemma || "N/A").padEnd(6);

      output += `    ${feature.tokenIndex}   | ${text} | ${pos} |${entityMark}| ${lemma}\n`;
    });

    // Semantic layer
    output += `\nSemantic Layer:\n`;
    output += `  Concept: ${match.semanticConcept || "Not classified"}\n`;
    output += `  Pattern: ${match.patternId}\n`;

    // Context layer
    output += `\nContext Layer:\n`;
    output += `  Sentence: "${match.sentenceContext}"\n`;
    output += `  Position: tokens [${match.span[0]}-${match.span[1]}]\n`;

    output += "\n" + "~".repeat(60) + "\n\n";
  });

  return output;
};

// ============================================================================
// MAIN VISUALIZATION PIPELINE
// ============================================================================

const runVisualization = Effect.gen(function* () {
  console.log("🎨 Starting Data Visualization...\n");

  const engine = yield* WinkEngine;
  const customEntities = createVisualPatterns();

  yield* engine.learnCustomEntities(customEntities);

  // Test corpus with varied patterns
  const testCorpus = [
    "Apple develops innovative software while Google creates advanced algorithms.",
    "Microsoft builds powerful tools and Amazon delivers excellent services.",
    "The smart system processes complex data during peak hours.",
    "New technology enables faster communication between remote teams.",
  ];

  const its = yield* engine.its;

  // Extract pattern definitions
  const patternDefinitions = extractPatternDefinitions(customEntities);

  // Process each document and collect matches
  const allMatches: Array<MatchInstance> = [];

  for (const [docIndex, text] of testCorpus.entries()) {
    console.log(`Processing document ${docIndex + 1}: "${text}"`);

    const doc = yield* engine.getWinkDoc(text);

    doc.customEntities().each((entity: any) => {
      const span = entity.out(its.span) as [number, number];
      const tokenFeatures: Array<LinguisticFeatures> = [];

      // Collect linguistic features for all tokens in the document
      doc.tokens().each((token: any, tokenIndex: number) => {
        const parentEntity = token.parentCustomEntity();
        const isEntityPart = parentEntity !== undefined;

        tokenFeatures.push(
          new LinguisticFeatures({
            text: token.out(),
            pos: token.out(its.pos),
            lemma: token.out(its.normal), // Using normal as lemma approximation
            tokenIndex,
            isEntityPart,
          })
        );
      });

      // Filter to just the tokens for this entity
      const entityTokenFeatures = tokenFeatures.filter(
        (_, idx) => idx >= span[0] && idx <= span[1]
      );

      const match = new MatchInstance({
        text: entity.out(),
        patternId: entity.out(its.type),
        span,
        tokenFeatures: entityTokenFeatures,
        sentenceContext: text,
        semanticConcept: undefined, // To be filled by future semantic analysis
      });

      allMatches.push(match);
    });
  }

  // Create complete visualization data structure
  const visualizationData = new DataVisualization({
    patterns: patternDefinitions,
    matches: allMatches,
    corpusText: testCorpus.join(" "),
    timestamp: new Date(),
  });

  // Generate visualizations
  console.log(visualizeADTStructure(visualizationData));
  console.log(visualizePatternMatching(patternDefinitions, allMatches));
  console.log(visualizeLinguisticLayers(allMatches));

  // Show raw data structure
  console.log("\n" + "=".repeat(80));
  console.log("RAW DATA STRUCTURE (JSON)");
  console.log("=".repeat(80));
  console.log(JSON.stringify(visualizationData, null, 2));

  return visualizationData;
});

// Run visualization
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runVisualizationScript() {
    const { WinkEngineLive } = await import("../NLP/Wink/WinkEngine.js");

    const result = await Effect.runPromise(
      runVisualization.pipe(Effect.provide(WinkEngineLive))
    );

    console.log(
      `\n✅ Visualization complete! Processed ${result.matches.length} matches across ${result.patterns.length} patterns.`
    );
    return result;
  }

  runVisualizationScript().catch((error) => {
    console.error("💥 Visualization failed:", error);
    process.exit(1);
  });
}
