/**
 * Simple Corpus Pipeline - Pure Functional Data Flow
 * 
 * Focus on data transformation through Effect pipelines
 * No classes, just functions and data flow
 */

import { Effect, Stream, pipe, Chunk } from "effect";
import { WinkEngine } from "../NLP/Wink/WinkEngine.js";
import { WinkEngineCustomEntities } from "../NLP/Wink/WinkPattern.js";
import { Pattern, LiteralPatternElement, POSPatternElement } from "../NLP/Core/Pattern.js";

// ============================================================================
// SIMPLE DATA TYPES
// ============================================================================

export type Document = {
  readonly id: string;
  readonly text: string;
  readonly metadata: Record<string, unknown>;
};

export type EntityMention = {
  readonly text: string;
  readonly type: string;
  readonly span: readonly [number, number];
  readonly confidence: number;
};

export type ProcessedDocument = {
  readonly document: Document;
  readonly entities: ReadonlyArray<EntityMention>;
  readonly processingTime: number;
  readonly version: number;
};

// ============================================================================
// PIPELINE STAGES - PURE FUNCTIONS
// ============================================================================

/**
 * Extract entities from document text
 */
const extractEntities = (doc: Document) => Effect.gen(function* () {
  const startTime = Date.now();
  const engine = yield* WinkEngine;
  
  // Simple extraction - just get whatever matches
  const winkDoc = yield* engine.getWinkDoc(doc.text);
  const its = yield* engine.its;
  
  const entities: Array<EntityMention> = [];
  
  // Collect custom entities
  winkDoc.customEntities().each((entity: any) => {
    const span = entity.out(its.span);
    entities.push({
      text: entity.out(),
      type: entity.out(its.type) || "UNKNOWN",
      span: [span[0], span[1]],
      confidence: 0.9 // Mock confidence
    });
  });
  
  // Collect built-in entities  
  winkDoc.entities().each((entity: any) => {
    const span = entity.out(its.span);
    entities.push({
      text: entity.out(),
      type: entity.out(its.type) || "BUILTIN",
      span: [span[0], span[1]], 
      confidence: 0.8 // Mock confidence
    });
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    document: doc,
    entities,
    processingTime,
    version: 1
  } as ProcessedDocument;
});

/**
 * Filter entities by confidence threshold
 */
const filterByConfidence = (threshold: number) => (processed: ProcessedDocument) => Effect.succeed({
  ...processed,
  entities: processed.entities.filter(e => e.confidence >= threshold),
  version: processed.version + 1
});

/**
 * Deduplicate overlapping entities
 */
const deduplicateEntities = (processed: ProcessedDocument) => {
  const sorted = [...processed.entities].sort((a, b) => a.span[0] - b.span[0]);
  const deduplicated: Array<EntityMention> = [];
  
  for (const entity of sorted) {
    const overlaps = deduplicated.some(existing => 
      entity.span[0] < existing.span[1] && entity.span[1] > existing.span[0]
    );
    
    if (!overlaps) {
      deduplicated.push(entity);
    }
  }
  
  return Effect.succeed({
    ...processed,
    entities: deduplicated,
    version: processed.version + 1
  });
};

/**
 * Add semantic enrichment
 */
const enrichSemantics = (processed: ProcessedDocument) => Effect.succeed({
  ...processed,
  entities: processed.entities.map(entity => ({
    ...entity,
    confidence: Math.min(entity.confidence + 0.1, 1.0) // Boost confidence
  })),
  version: processed.version + 1
});

// ============================================================================
// PIPELINE COMPOSITION
// ============================================================================

/**
 * Complete processing pipeline
 */
const processingPipeline = (doc: Document) => pipe(
  extractEntities(doc),
  Effect.flatMap(filterByConfidence(0.5)),
  Effect.flatMap(deduplicateEntities),
  Effect.flatMap(enrichSemantics)
);

/**
 * Stream processing for multiple documents
 */
const processDocumentStream = (docs: ReadonlyArray<Document>) => 
  pipe(
    Stream.fromIterable(docs),
    Stream.mapEffect(processingPipeline, { concurrency: 2 }),
    Stream.runCollect
  );

// ============================================================================
// DEMO PIPELINE EXECUTION
// ============================================================================

const runCorpusPipeline = Effect.gen(function* () {
  console.log("🚀 Simple Corpus Pipeline - Pure Data Flow\n");
  
  // Create test corpus
  const documents: Array<Document> = [
    {
      id: "doc-1",
      text: "Apple develops innovative technology while Google creates advanced algorithms.",
      metadata: { source: "tech-news" }
    },
    {
      id: "doc-2", 
      text: "Microsoft spends 50 million dollars on research and Amazon builds new facilities.",
      metadata: { source: "business" }
    },
    {
      id: "doc-3",
      text: "The smart system processes 1000 requests per second efficiently.",
      metadata: { source: "technical" }
    },
    {
      id: "doc-4",
      text: "Who is the CEO of Tesla and what products do they make?",
      metadata: { source: "questions" }
    },
    {
      id: "doc-5",
      text: "Performance increased by 40 percent over the last quarter.",
      metadata: { source: "metrics" }
    }
  ];
  
  console.log(`📄 Processing ${documents.length} documents through pipeline...\n`);
  
  // Process all documents through the pipeline
  const results = yield* processDocumentStream(documents);
  
  // Display results
  console.log("📊 PIPELINE RESULTS\n");
  
  pipe(
    results,
    Chunk.toReadonlyArray,
    (processedDocs) => {
      let totalEntities = 0;
      let totalTime = 0;
      
      processedDocs.forEach((result, i) => {
        console.log(`📄 Document ${i + 1}: ${result.document.id}`);
        console.log(`   Text: "${result.document.text}"`);
        console.log(`   Processing time: ${result.processingTime}ms`);
        console.log(`   Version: ${result.version}`);
        console.log(`   Entities found: ${result.entities.length}`);
        
        if (result.entities.length > 0) {
          result.entities.forEach((entity, j) => {
            console.log(`     ${j + 1}. "${entity.text}" [${entity.type}] confidence: ${entity.confidence.toFixed(2)} span: [${entity.span[0]}, ${entity.span[1]}]`);
          });
        }
        
        totalEntities += result.entities.length;
        totalTime += result.processingTime;
        console.log("");
      });
      
      console.log("📈 SUMMARY:");
      console.log(`   Total documents: ${processedDocs.length}`);
      console.log(`   Total entities: ${totalEntities}`);
      console.log(`   Average entities per doc: ${(totalEntities / processedDocs.length).toFixed(1)}`);
      console.log(`   Total processing time: ${totalTime}ms`);
      console.log(`   Average time per doc: ${(totalTime / processedDocs.length).toFixed(1)}ms`);
      
      return processedDocs;
    }
  );
  
  return results;
});

// ============================================================================
// PATTERN SETUP FOR DEMO
// ============================================================================

const setupPatterns = Effect.gen(function* () {
  const engine = yield* WinkEngine;
  
  // Create simple patterns inline for demo
  const companyPattern = new Pattern({
    id: Pattern.Id("companies"),
    elements: Chunk.make(
      LiteralPatternElement.make({
        value: ["Apple", "Google", "Microsoft", "Amazon", "Tesla"] as any,
      })
    ),
  });
  
  const actionPattern = new Pattern({
    id: Pattern.Id("actions"),
    elements: Chunk.make(
      POSPatternElement.make({ value: ["VERB", "NOUN"] as any })
    ),
  });
  
  const patterns = WinkEngineCustomEntities.fromPatterns("demo-patterns", [
    companyPattern,
    actionPattern,
  ]);
  
  yield* engine.learnCustomEntities(patterns);
  
  console.log("✅ Patterns loaded for entity extraction\n");
});

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const main = Effect.gen(function* () {
  yield* setupPatterns;
  const results = yield* runCorpusPipeline;
  
  console.log(`\n🎉 Pipeline completed successfully!`);
  console.log(`Processed ${Chunk.size(results)} documents with pure functional data flow.`);
  
  return results;
});

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runDemo() {
    const { WinkEngineLive } = await import("../NLP/Wink/WinkEngine.js");
    
    const results = await Effect.runPromise(
      main.pipe(Effect.provide(WinkEngineLive))
    );
    
    return results;
  }
  
  runDemo().catch((error) => {
    console.error("💥 Pipeline failed:", error);
    process.exit(1);
  });
}

// ============================================================================
// DESIGN NOTES
// ============================================================================

/**
 * PURE FUNCTIONAL APPROACH:
 * 
 * 1. DATA FLOW: Documents → Extract → Filter → Dedupe → Enrich → Results
 * 2. NO CLASSES: Just types, functions, and Effect.gen for orchestration
 * 3. COMPOSITION: Pipeline stages compose naturally with Effect.flatMap
 * 4. STREAMING: Process multiple documents concurrently with Stream
 * 5. IMMUTABLE: Each stage returns new data, never mutates
 * 
 * ACADEMIC NLP CONCEPTS:
 * 
 * 1. EXTRACTION: Surface form → structured mentions
 * 2. FILTERING: Quality control based on confidence
 * 3. DEDUPLICATION: Resolve overlapping spans
 * 4. ENRICHMENT: Add semantic/contextual information
 * 5. EVALUATION: Track processing metrics and quality
 * 
 * EFFECT PATTERNS:
 * 
 * 1. Effect.gen for imperative-style async code
 * 2. pipe() for functional composition
 * 3. Stream for memory-efficient processing
 * 4. Services for dependency injection (WinkEngine)
 * 5. Error handling through Effect type system
 */