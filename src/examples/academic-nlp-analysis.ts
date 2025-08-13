/**
 * Academic-Level Natural Language Processing Analysis
 *
 * This example demonstrates Stanford NLP-level rigor and functionality using
 * the Effect-NLP library with proper Effect patterns, Schema validation,
 * and comprehensive linguistic analysis.
 *
 * Features demonstrated:
 * - Document-centric API with rigorous type safety
 * - Multi-engine NLP analysis (wink-nlp + compromise.js)
 * - Comprehensive linguistic feature extraction
 * - Academic-quality entity recognition and classification
 * - Statistical analysis and corpus linguistics metrics
 * - Proper error handling with Effect's type-safe errors
 * - Functional composition with Effect.gen patterns
 *
 * @author Effect-NLP Library
 * @version 2.0.0
 * @since 2024-01-01
 */

import { Console, Effect, HashMap, Option, Duration } from "effect";
import type * as Core from "../NLP/Core.js";
import * as DP from "../NLP/DocumentProcessor.js";
import * as Live from "../NLP/DocumentProcessorLive.js";

// =============================================================================
// Academic Text Corpus for Analysis
// =============================================================================

const RESEARCH_CORPUS = {
  // Computational Linguistics Paper Abstract
  COMPUTATIONAL_LINGUISTICS: `
    Neural machine translation has revolutionized the field of computational linguistics, 
    achieving state-of-the-art performance on benchmark datasets like WMT and BLEU evaluations.
    Dr. Yoshua Bengio from the University of Montreal and Professor Geoffrey Hinton from 
    the University of Toronto pioneered deep learning approaches that utilize attention mechanisms.
    The Transformer architecture, introduced by Vaswani et al. (2017) at Google Research,
    employs self-attention to capture long-range dependencies in sequences with O(n²) complexity.
    Recent studies by OpenAI and DeepMind demonstrate 99.2% accuracy on Stanford Question 
    Answering Dataset (SQuAD) benchmarks, surpassing human performance by 15.7%.
  `,

  // Medical Research Abstract
  MEDICAL_RESEARCH: `
    A randomized controlled trial (RCT) conducted at Johns Hopkins University and 
    Harvard Medical School examined the efficacy of mRNA-1273 vaccine in preventing 
    COVID-19 infection. The study enrolled 30,420 participants aged 18-95 years across 
    99 clinical sites in the United States between July 2020 and October 2020.
    Primary endpoint analysis showed 94.1% vaccine efficacy (95% CI: 89.3-96.8%, p<0.001).
    Dr. Anthony Fauci, Director of NIAID, and Dr. Rochelle Walensky from the CDC 
    reported severe adverse events in <0.1% of participants. The FDA approved emergency 
    use authorization on December 18, 2020, following rigorous Phase III trials.
  `,

  // Financial Analysis Report
  FINANCIAL_ANALYSIS: `
    Apple Inc. (NASDAQ: AAPL) reported record quarterly revenue of $123.9 billion for Q1 2024,
    representing a 12.7% year-over-year increase driven by iPhone 15 sales and services growth.
    CEO Tim Cook and CFO Luca Maestri announced a $110 billion share buyback program during
    the earnings call on February 1st, 2024. The company's gross margin expanded to 46.6%,
    beating Wall Street consensus estimates of 45.2% (Reuters consensus poll, N=27 analysts).
    Market capitalization reached $3.1 trillion, with institutional ownership at 67.8% 
    according to Bloomberg Terminal data. Morgan Stanley upgraded AAPL to "Overweight" 
    with a $225 price target, citing AI integration opportunities valued at $15-20 billion.
  `,

  // Legal Document Analysis
  LEGAL_DOCUMENT: `
    In the matter of Alphabet Inc. v. European Commission (Case T-604/18), the General Court
    of the European Union rendered judgment on September 14, 2022, regarding antitrust violations
    under Article 102 TFEU. The Commission imposed a €4.34 billion fine against Google LLC
    for abuse of dominant position in the Android mobile operating system market.
    Judge Marc van der Woude presided over proceedings at the Court of Justice in Luxembourg.
    Legal counsel from Clifford Chance LLP and Sullivan & Cromwell represented the parties.
    The judgment cited precedents from United Brands (Case 27/76) and Microsoft v. Commission
    (Case T-201/04), establishing market dominance thresholds exceeding 75% market share.
  `,
} as const;

// =============================================================================
// Academic Analysis Pipeline
// =============================================================================

/**
 * Comprehensive document analysis pipeline following academic standards
 */
const analyzeDocument = (text: string, documentId: string) =>
  Effect.gen(function* () {
    const processor = yield* DP.DocumentProcessorService;
    const query = yield* DP.DocumentQueryService;
    const transformer = yield* DP.TextTransformerService;

    // Step 1: Core document processing with timing
    const startTime = yield* Effect.sync(() => Date.now());
    const document = yield* processor
      .process(text)
      .pipe(
        Effect.tapError((error) =>
          Console.error(`Document processing failed for ${documentId}:`, error)
        )
      );
    const processingTime = yield* Effect.sync(() => Date.now() - startTime);

    // Step 2: Extract comprehensive linguistic features
    const stats = processor.getStats(document);
    const tokens = document.getTokens();
    const entities = document.getEntities();
    const sentences = document.getSentences();

    // Step 3: Advanced linguistic analysis
    const linguisticFeatures = analyzeLinguisticFeatures(document, query);
    const entityAnalysis = analyzeEntities(document, query);
    const syntacticAnalysis = analyzeSyntacticStructure(document, query);

    // Step 4: Text preprocessing variants for comparison
    const normalizedText = yield* transformer.transform(text, {
      _tag: "Normalize",
    });
    const titleCaseText = yield* transformer.transform(text, {
      _tag: "ToTitleCase",
    });

    return {
      documentId,
      document,
      stats,
      processingTime,
      linguisticFeatures,
      entityAnalysis,
      syntacticAnalysis,
      textVariants: {
        original: text,
        normalized: normalizedText,
        titleCase: titleCaseText,
      },
      metadata: {
        tokenCount: tokens.length,
        entityCount: entities.length,
        sentenceCount: sentences.length,
        avgSentenceLength: stats.averageSentenceLength,
        avgTokenLength: stats.averageTokenLength,
      },
    };
  });

/**
 * Extract advanced linguistic features for academic analysis
 */
const analyzeLinguisticFeatures = (
  document: Core.Document,
  _query: DP.DocumentQuery
) => {
  const tokens = document.getTokens();

  // Part-of-Speech distribution analysis
  const posDistribution = tokens.reduce((acc, token) => {
    const pos = token.pos;
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Morphological analysis
  const morphologicalFeatures = {
    properNouns: tokens.filter((t) => t.isProperNoun).length,
    punctuation: tokens.filter((t) => t.isPunctuation).length,
    negatedTokens: tokens.filter((t) => t.features.isNegated).length,
    averageLemmaLength:
      tokens.reduce((sum, t) => sum + t.features.lemma.length, 0) /
      tokens.length,
  };

  // Lexical diversity metrics (academic standard)
  const uniqueTokens = new Set(tokens.map((t) => t.normalizedText));
  const typeTokenRatio = uniqueTokens.size / tokens.length; // TTR
  const rootTypeTokenRatio = uniqueTokens.size / Math.sqrt(tokens.length); // RTTR

  // Semantic density analysis
  const contentWords = tokens.filter((t) =>
    ["NOUN", "VERB", "ADJ", "ADV"].includes(t.pos)
  );
  const semanticDensity = contentWords.length / tokens.length;

  return {
    posDistribution,
    morphologicalFeatures,
    lexicalDiversity: {
      typeTokenRatio,
      rootTypeTokenRatio,
      uniqueTokens: uniqueTokens.size,
      totalTokens: tokens.length,
    },
    semanticDensity,
    contentWordRatio: contentWords.length / tokens.length,
  };
};

/**
 * Comprehensive entity analysis following NER standards
 */
const analyzeEntities = (document: Core.Document, _query: DP.DocumentQuery) => {
  const entities = document.getEntities();

  // Entity classification by label
  const entityClassification = entities.reduce((acc, entity) => {
    const label = entity.label;
    if (!acc[label]) acc[label] = [];
    acc[label].push(entity);
    return acc;
  }, {} as Record<Core.EntityLabel, Array<Core.Entity>>);

  // Entity span analysis (academic metric)
  const entitySpanStats = {
    averageSpanLength:
      entities.reduce((sum, e) => sum + e.offset.char.length, 0) /
      entities.length,
    maxSpanLength: Math.max(...entities.map((e) => e.offset.char.length)),
    minSpanLength: Math.min(...entities.map((e) => e.offset.char.length)),
  };

  // Named Entity Density (entities per 100 tokens)
  const tokenCount = document.getTokens().length;
  const namedEntityDensity = (entities.length / tokenCount) * 100;

  // Entity overlap analysis (for multi-engine validation)
  const entityOverlaps = entities.reduce((overlaps, entity1, i) => {
    entities.slice(i + 1).forEach((entity2) => {
      if (entity1.offset.char.overlaps(entity2.offset.char)) {
        overlaps.push([entity1, entity2]);
      }
    });
    return overlaps;
  }, [] as Array<[Core.Entity, Core.Entity]>);

  return {
    entityClassification,
    entitySpanStats,
    namedEntityDensity,
    entityOverlaps: entityOverlaps.length,
    totalEntities: entities.length,
    uniqueEntityTexts: new Set(entities.map((e) => e.text.toLowerCase())).size,
  };
};

/**
 * Syntactic structure analysis
 */
const analyzeSyntacticStructure = (
  document: Core.Document,
  _query: DP.DocumentQuery
) => {
  const sentences = document.getSentences();
  const tokens = document.getTokens();

  // Sentence complexity metrics
  const sentenceComplexity = sentences.map((sentence) => {
    const sentenceTokens = sentence.tokenIds
      .map((id) => HashMap.get(document.tokens, id))
      .filter(Option.isSome)
      .map((option) => option.value);

    return {
      sentenceId: sentence.id,
      tokenCount: sentenceTokens.length,
      verbCount: sentenceTokens.filter((t) => t.pos === "VERB").length,
      nounCount: sentenceTokens.filter((t) => ["NOUN", "PROPN"].includes(t.pos))
        .length,
      complexityScore: sentenceTokens.length / 10, // Simple complexity metric
    };
  });

  // Average sentence metrics
  const avgSentenceComplexity =
    sentenceComplexity.reduce((sum, s) => sum + s.complexityScore, 0) /
    sentences.length;
  const avgVerbsPerSentence =
    sentenceComplexity.reduce((sum, s) => sum + s.verbCount, 0) /
    sentences.length;
  const avgNounsPerSentence =
    sentenceComplexity.reduce((sum, s) => sum + s.nounCount, 0) /
    sentences.length;

  return {
    sentenceComplexity,
    averageMetrics: {
      complexityScore: avgSentenceComplexity,
      verbsPerSentence: avgVerbsPerSentence,
      nounsPerSentence: avgNounsPerSentence,
      sentenceLength: tokens.length / sentences.length,
    },
    totalSentences: sentences.length,
  };
};

// =============================================================================
// Academic Reporting and Visualization
// =============================================================================

/**
 * Type for document analysis result
 */
type DocumentAnalysisResult = {
  documentId: string;
  document: Core.Document;
  stats: Core.DocumentStats;
  processingTime: number;
  linguisticFeatures: {
    posDistribution: Record<string, number>;
    morphologicalFeatures: {
      properNouns: number;
      punctuation: number;
      negatedTokens: number;
      averageLemmaLength: number;
    };
    lexicalDiversity: {
      typeTokenRatio: number;
      rootTypeTokenRatio: number;
      uniqueTokens: number;
      totalTokens: number;
    };
    semanticDensity: number;
    contentWordRatio: number;
  };
  entityAnalysis: {
    entityClassification: Record<Core.EntityLabel, Array<Core.Entity>>;
    entitySpanStats: {
      averageSpanLength: number;
      maxSpanLength: number;
      minSpanLength: number;
    };
    namedEntityDensity: number;
    entityOverlaps: number;
    totalEntities: number;
    uniqueEntityTexts: number;
  };
  syntacticAnalysis: {
    sentenceComplexity: Array<{
      sentenceId: string;
      tokenCount: number;
      verbCount: number;
      nounCount: number;
      complexityScore: number;
    }>;
    averageMetrics: {
      complexityScore: number;
      verbsPerSentence: number;
      nounsPerSentence: number;
      sentenceLength: number;
    };
    totalSentences: number;
  };
  textVariants: {
    original: string;
    normalized: string;
    titleCase: string;
  };
  metadata: {
    tokenCount: number;
    entityCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    avgTokenLength: number;
  };
};

/**
 * Generate comprehensive academic report for a document analysis
 */
const generateAcademicReport = (analysis: DocumentAnalysisResult) =>
  Effect.gen(function* () {
    yield* Console.log("=".repeat(80));
    yield* Console.log(
      `📚 ACADEMIC NLP ANALYSIS REPORT: ${analysis.documentId}`
    );
    yield* Console.log("=".repeat(80));

    // Document Overview
    yield* Console.log("\n📄 DOCUMENT OVERVIEW");
    yield* Console.log("-".repeat(40));
    yield* Console.log(`Document ID: ${analysis.documentId}`);
    yield* Console.log(`Processing Time: ${analysis.processingTime}ms`);
    yield* Console.log(`Total Tokens: ${analysis.metadata.tokenCount}`);
    yield* Console.log(`Total Entities: ${analysis.metadata.entityCount}`);
    yield* Console.log(`Total Sentences: ${analysis.metadata.sentenceCount}`);
    yield* Console.log(
      `Average Sentence Length: ${analysis.metadata.avgSentenceLength.toFixed(
        2
      )} tokens`
    );
    yield* Console.log(
      `Average Token Length: ${analysis.metadata.avgTokenLength.toFixed(
        2
      )} characters`
    );

    // Linguistic Features Analysis
    yield* Console.log("\n🔬 LINGUISTIC FEATURES ANALYSIS");
    yield* Console.log("-".repeat(40));
    yield* Console.log(
      `Type-Token Ratio (TTR): ${analysis.linguisticFeatures.lexicalDiversity.typeTokenRatio.toFixed(
        4
      )}`
    );
    yield* Console.log(
      `Root TTR: ${analysis.linguisticFeatures.lexicalDiversity.rootTypeTokenRatio.toFixed(
        4
      )}`
    );
    yield* Console.log(
      `Semantic Density: ${(
        analysis.linguisticFeatures.semanticDensity * 100
      ).toFixed(2)}%`
    );
    yield* Console.log(
      `Content Word Ratio: ${(
        analysis.linguisticFeatures.contentWordRatio * 100
      ).toFixed(2)}%`
    );

    // Part-of-Speech Distribution
    yield* Console.log("\n📊 PART-OF-SPEECH DISTRIBUTION");
    yield* Console.log("-".repeat(40));
    const posEntries = Object.entries(
      analysis.linguisticFeatures.posDistribution
    ).sort(([, a], [, b]) => b - a);

    for (const [pos, count] of posEntries) {
      const percentage = ((count / analysis.metadata.tokenCount) * 100).toFixed(
        1
      );
      yield* Console.log(
        `${pos.padEnd(8)}: ${count.toString().padStart(4)} (${percentage}%)`
      );
    }

    // Entity Analysis
    yield* Console.log("\n🏷️ NAMED ENTITY ANALYSIS");
    yield* Console.log("-".repeat(40));
    yield* Console.log(
      `Named Entity Density: ${analysis.entityAnalysis.namedEntityDensity.toFixed(
        2
      )} entities/100 tokens`
    );
    yield* Console.log(
      `Entity Overlaps Detected: ${analysis.entityAnalysis.entityOverlaps}`
    );
    yield* Console.log(
      `Unique Entity Texts: ${analysis.entityAnalysis.uniqueEntityTexts}`
    );
    yield* Console.log(
      `Average Entity Span: ${analysis.entityAnalysis.entitySpanStats.averageSpanLength.toFixed(
        2
      )} characters`
    );

    // Entity Classification
    yield* Console.log("\n📋 ENTITY CLASSIFICATION BY TYPE");
    yield* Console.log("-".repeat(40));
    const entityEntries = Object.entries(
      analysis.entityAnalysis.entityClassification
    ).sort(([, a], [, b]) => b.length - a.length);

    for (const [label, entities] of entityEntries) {
      yield* Console.log(
        `${label.padEnd(12)}: ${entities.length
          .toString()
          .padStart(3)} entities`
      );
      // Show first 3 examples
      const examples = entities
        .slice(0, 3)
        .map((e) => `"${e.text}"`)
        .join(", ");
      if (examples) {
        yield* Console.log(`${"".padEnd(16)}Examples: ${examples}`);
      }
    }

    // Syntactic Analysis
    yield* Console.log("\n🔧 SYNTACTIC STRUCTURE ANALYSIS");
    yield* Console.log("-".repeat(40));
    yield* Console.log(
      `Average Sentence Complexity: ${analysis.syntacticAnalysis.averageMetrics.complexityScore.toFixed(
        2
      )}`
    );
    yield* Console.log(
      `Average Verbs per Sentence: ${analysis.syntacticAnalysis.averageMetrics.verbsPerSentence.toFixed(
        2
      )}`
    );
    yield* Console.log(
      `Average Nouns per Sentence: ${analysis.syntacticAnalysis.averageMetrics.nounsPerSentence.toFixed(
        2
      )}`
    );

    // Text Preprocessing Comparison
    yield* Console.log("\n⚙️ TEXT PREPROCESSING VARIANTS");
    yield* Console.log("-".repeat(40));
    yield* Console.log(
      `Original length: ${analysis.textVariants.original.length} chars`
    );
    yield* Console.log(
      `Normalized length: ${analysis.textVariants.normalized.length} chars`
    );
    yield* Console.log(
      `Title case length: ${analysis.textVariants.titleCase.length} chars`
    );

    yield* Console.log("\n" + "=".repeat(80));
  });

/**
 * Comparative corpus analysis across multiple documents
 */
const performCorpusAnalysis = (analyses: Array<DocumentAnalysisResult>) =>
  Effect.gen(function* () {
    yield* Console.log("\n" + "=".repeat(80));
    yield* Console.log("📊 COMPARATIVE CORPUS ANALYSIS");
    yield* Console.log("=".repeat(80));

    // Aggregate statistics
    const corpusStats = {
      totalDocuments: analyses.length,
      totalTokens: analyses.reduce((sum, a) => sum + a.metadata.tokenCount, 0),
      totalEntities: analyses.reduce(
        (sum, a) => sum + a.metadata.entityCount,
        0
      ),
      totalSentences: analyses.reduce(
        (sum, a) => sum + a.metadata.sentenceCount,
        0
      ),
      averageProcessingTime:
        analyses.reduce((sum, a) => sum + a.processingTime, 0) /
        analyses.length,
    };

    yield* Console.log("\n📈 CORPUS STATISTICS");
    yield* Console.log("-".repeat(40));
    yield* Console.log(`Total Documents: ${corpusStats.totalDocuments}`);
    yield* Console.log(
      `Total Tokens: ${corpusStats.totalTokens.toLocaleString()}`
    );
    yield* Console.log(
      `Total Entities: ${corpusStats.totalEntities.toLocaleString()}`
    );
    yield* Console.log(
      `Total Sentences: ${corpusStats.totalSentences.toLocaleString()}`
    );
    yield* Console.log(
      `Average Processing Time: ${corpusStats.averageProcessingTime.toFixed(
        2
      )}ms`
    );
    yield* Console.log(
      `Tokens per Document: ${(
        corpusStats.totalTokens / corpusStats.totalDocuments
      ).toFixed(0)}`
    );
    yield* Console.log(
      `Entities per Document: ${(
        corpusStats.totalEntities / corpusStats.totalDocuments
      ).toFixed(1)}`
    );

    // Cross-document linguistic comparison
    yield* Console.log("\n🔬 CROSS-DOCUMENT LINGUISTIC METRICS");
    yield* Console.log("-".repeat(40));

    for (const analysis of analyses) {
      const ttr = analysis.linguisticFeatures.lexicalDiversity.typeTokenRatio;
      const semanticDensity = analysis.linguisticFeatures.semanticDensity;
      const entityDensity = analysis.entityAnalysis.namedEntityDensity;

      yield* Console.log(`${analysis.documentId}:`);
      yield* Console.log(
        `  TTR: ${ttr.toFixed(4)} | Semantic: ${(semanticDensity * 100).toFixed(
          1
        )}% | Entities: ${entityDensity.toFixed(2)}/100`
      );
    }

    // Entity distribution across corpus
    yield* Console.log("\n🏷️ ENTITY DISTRIBUTION ACROSS CORPUS");
    yield* Console.log("-".repeat(40));

    const allEntityTypes = new Set<Core.EntityLabel>();
    analyses.forEach((a) =>
      Object.keys(a.entityAnalysis.entityClassification).forEach((type) =>
        allEntityTypes.add(type as Core.EntityLabel)
      )
    );

    for (const entityType of Array.from(allEntityTypes).sort()) {
      const counts = analyses.map(
        (a) => a.entityAnalysis.entityClassification[entityType]?.length || 0
      );
      const total = counts.reduce((sum, count) => sum + count, 0);
      const avg = total / analyses.length;

      yield* Console.log(
        `${entityType.padEnd(12)}: Total=${total
          .toString()
          .padStart(3)}, Avg=${avg.toFixed(1)}`
      );
    }

    yield* Console.log("\n" + "=".repeat(80));
  });

// =============================================================================
// Main Academic Analysis Program
// =============================================================================

/**
 * Main program demonstrating academic-level NLP analysis
 */
const main = Effect.gen(function* () {
  yield* Console.log("🎓 ACADEMIC-LEVEL NATURAL LANGUAGE PROCESSING ANALYSIS");
  yield* Console.log("📚 Effect-NLP Library v2.0 - Stanford NLP Level Rigor");
  yield* Console.log(
    "⚡ Powered by Effect Schema, wink-nlp, and compromise.js"
  );
  yield* Console.log("");

  // Process entire research corpus
  yield* Console.log("📖 Processing Research Corpus...");
  const startTime = yield* Effect.sync(() => Date.now());

  const analyses = yield* Effect.all(
    [
      analyzeDocument(RESEARCH_CORPUS.COMPUTATIONAL_LINGUISTICS, "COMP_LING"),
      analyzeDocument(RESEARCH_CORPUS.MEDICAL_RESEARCH, "MED_RESEARCH"),
      analyzeDocument(RESEARCH_CORPUS.FINANCIAL_ANALYSIS, "FIN_ANALYSIS"),
      analyzeDocument(RESEARCH_CORPUS.LEGAL_DOCUMENT, "LEGAL_DOC"),
    ],
    { concurrency: 2 }
  );

  const totalTime = yield* Effect.sync(() => Date.now() - startTime);
  yield* Console.log(`✅ Corpus processed in ${totalTime}ms\n`);

  // Generate individual reports
  yield* Effect.forEach(
    analyses,
    (analysis) => generateAcademicReport(analysis),
    { concurrency: 1 }
  );

  // Generate comparative corpus analysis
  yield* performCorpusAnalysis(analyses);

  // Final summary
  yield* Console.log("\n🎯 ANALYSIS COMPLETE");
  yield* Console.log("=".repeat(80));
  yield* Console.log("✨ Academic-level NLP analysis demonstrates:");
  yield* Console.log("   • Rigorous linguistic feature extraction");
  yield* Console.log("   • Multi-engine entity recognition validation");
  yield* Console.log("   • Comprehensive syntactic and semantic analysis");
  yield* Console.log("   • Statistical corpus linguistics metrics");
  yield* Console.log("   • Type-safe Effect patterns with Schema validation");
  yield* Console.log("   • Production-ready error handling and performance");
  yield* Console.log("");
  yield* Console.log(
    "📊 Ready for academic research and production deployment!"
  );
  yield* Console.log("=".repeat(80));
});

// Run with proper Effect service layer
const program = main.pipe(
  Effect.provide(Live.DocumentProcessingLive),
  Effect.timeout(Duration.seconds(60)),
  Effect.tapError((error) => Console.error("Analysis failed:", error))
);

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Effect.runPromise(program);
}

export { main as academicNlpAnalysis, analyzeDocument, generateAcademicReport };
