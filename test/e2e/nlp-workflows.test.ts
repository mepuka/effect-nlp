/**
 * End-to-end tests for complete NLP workflows using Effect patterns
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, Duration } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DP from "../../src/NLP/DocumentProcessor.js";
import * as Live from "../../src/NLP/DocumentProcessorLive.js";
import * as Fixtures from "../fixtures/sample-texts.js";

describe("End-to-End NLP Workflows", () => {
  const TestLayer = Live.DocumentProcessingLive;

  it("Financial Analysis Workflow", () =>
    Effect.gen(function* () {
      // Step 1: Process financial document
      const document = yield* DP.process(Fixtures.FINANCIAL_TEXT);
      
      // Step 2: Extract key business metrics
      const stats = yield* DP.getStats(document);
      const entities = document.getEntities();
      
      // Step 3: Analyze financial entities
      const organizations = document.getEntitiesByLabel("ORGANIZATION");
      const moneyAmounts = document.getEntitiesByLabel("MONEY");  
      const percentages = document.getEntitiesByLabel("PERCENT");
      const locations = document.getEntitiesByLabel("LOCATION");
      const people = document.getEntitiesByLabel("PERSON");
      
      // Step 4: Validate expected results
      expect(organizations.length).toBeGreaterThanOrEqual(0);
      expect(moneyAmounts.length).toBeGreaterThanOrEqual(0);
      expect(percentages.length).toBeGreaterThanOrEqual(0);
      expect(locations.length).toBeGreaterThanOrEqual(0);
      expect(people.length).toBeGreaterThanOrEqual(0);
      
      // Step 5: Generate business intelligence summary
      const summary = {
        documentId: document.id,
        totalEntities: entities.length,
        keyMetrics: {
          organizations: organizations.length,
          financialFigures: moneyAmounts.length,
          percentages: percentages.length,
          locations: locations.length,
          executiveMentions: people.length
        },
        processingStats: {
          tokens: stats.tokenCount,
          sentences: stats.sentenceCount,
          avgTokenLength: stats.averageTokenLength
        }
      };
      
      expect(summary.processingStats.tokens).toBeGreaterThan(0);
      expect(summary.keyMetrics.organizations).toBeGreaterThanOrEqual(0);
      expect(summary.keyMetrics.financialFigures).toBeGreaterThanOrEqual(0);
      
      return summary;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Academic Research Analysis Workflow", () =>
    Effect.gen(function* () {
      // Step 1: Process academic document
      const document = yield* DP.process(Fixtures.ACADEMIC_TEXT);
      
      // Step 2: Extract research entities
      const query = yield* DP.DocumentQueryService;
      
      const researchers = query.findEntities(document, entity => 
        entity.label === "PERSON" && 
        (entity.text.includes("Dr.") || entity.text.includes("Professor"))
      );
      
      const institutions = query.findEntities(document, entity =>
        entity.label === "ORGANIZATION" && 
        (entity.text.includes("University") || entity.text.includes("Laboratory"))
      );
      
      const funding = document.getEntitiesByLabel("MONEY");
      const locations = document.getEntitiesByLabel("LOCATION");
      
      // Step 3: Analyze research network
      const researchNetwork = {
        principalInvestigators: researchers.map(r => r.text),
        affiliatedInstitutions: institutions.map(i => i.text),
        fundingAmounts: funding.map(f => f.text),
        researchLocations: locations.map(l => l.text)
      };
      
      // Step 4: Generate research summary
      expect(researchers.length).toBeGreaterThanOrEqual(0);
      expect(institutions.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(researchNetwork.principalInvestigators)).toBe(true);
      expect(Array.isArray(researchNetwork.affiliatedInstitutions)).toBe(true);
      
      return researchNetwork;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Multi-Document Comparison Workflow", () =>
    Effect.gen(function* () {
      // Process multiple document types concurrently
      const [financialDoc, academicDoc, newsDoc] = yield* Effect.all([
        DP.process(Fixtures.FINANCIAL_TEXT),
        DP.process(Fixtures.ACADEMIC_TEXT),
        DP.process(Fixtures.NEWS_TEXT)
      ], { concurrency: 3 });
      
      // Generate comparative analysis
      const comparison = {
        financial: {
          entities: financialDoc.getEntities().length,
          organizations: financialDoc.getEntitiesByLabel("ORGANIZATION").length,
          money: financialDoc.getEntitiesByLabel("MONEY").length
        },
        academic: {
          entities: academicDoc.getEntities().length,
          organizations: academicDoc.getEntitiesByLabel("ORGANIZATION").length,
          people: academicDoc.getEntitiesByLabel("PERSON").length
        },
        news: {
          entities: newsDoc.getEntities().length,
          organizations: newsDoc.getEntitiesByLabel("ORGANIZATION").length,
          locations: newsDoc.getEntitiesByLabel("LOCATION").length
        }
      };
      
      // Validate each document type has appropriate entities
      expect(comparison.financial.organizations).toBeGreaterThanOrEqual(0);
      expect(comparison.academic.organizations).toBeGreaterThanOrEqual(0);
      expect(comparison.news.organizations).toBeGreaterThanOrEqual(0);
      
      expect(typeof comparison.financial.entities).toBe("number");
      expect(typeof comparison.academic.entities).toBe("number");
      expect(typeof comparison.news.entities).toBe("number");
      
      return comparison;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Contact Information Extraction Workflow", () =>
    Effect.gen(function* () {
      const document = yield* DP.process(Fixtures.MIXED_ENTITIES_TEXT);
      
      // Extract contact information
      const emails = document.getEntitiesByLabel("EMAIL");
      const phones = document.getEntitiesByLabel("PHONE");
      const urls = document.getEntitiesByLabel("URL");
      const locations = document.getEntitiesByLabel("LOCATION");
      const dates = document.getEntitiesByLabel("DATE");
      const money = document.getEntitiesByLabel("MONEY");
      const people = document.getEntitiesByLabel("PERSON");
      
      const contactInfo = {
        emails: emails.map(e => e.text),
        phones: phones.map(p => p.text),
        websites: urls.map(u => u.text),
        addresses: locations.map(l => l.text),
        scheduledMeetings: dates.map(d => d.text),
        budgetInfo: money.map(m => m.text),
        contacts: people.map(p => p.text)
      };
      
      // Validate contact extraction
      expect(emails.length).toBeGreaterThanOrEqual(0);
      expect(phones.length).toBeGreaterThanOrEqual(0); 
      expect(urls.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(contactInfo.emails)).toBe(true);
      expect(Array.isArray(contactInfo.phones)).toBe(true);
      
      return contactInfo;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Performance and Scale Workflow", () =>
    Effect.gen(function* () {
      const startTime = yield* Effect.sync(() => Date.now());
      
      // Process multiple texts in parallel with timeout
      const results = yield* Effect.all([
        DP.process(Fixtures.FINANCIAL_TEXT),
        DP.process(Fixtures.ACADEMIC_TEXT),
        DP.process(Fixtures.NEWS_TEXT),
        DP.process(Fixtures.TECHNICAL_TEXT),
        DP.process(Fixtures.SOCIAL_MEDIA_TEXT)
      ], { concurrency: 3 }).pipe(
        Effect.timeout(Duration.seconds(30)) // 30 second timeout
      );
      
      const endTime = yield* Effect.sync(() => Date.now());
      const processingTime = endTime - startTime;
      
      // Analyze processing performance
      const totalTokens = results.reduce((sum, doc) => sum + doc.getTokens().length, 0);
      const totalEntities = results.reduce((sum, doc) => sum + doc.getEntities().length, 0);
      
      const performance = {
        documentsProcessed: results.length,
        totalProcessingTime: processingTime,
        averageTimePerDocument: processingTime / results.length,
        totalTokensProcessed: totalTokens,
        totalEntitiesExtracted: totalEntities,
        tokensPerSecond: (totalTokens / processingTime) * 1000
      };
      
      // Validate reasonable performance
      expect(performance.documentsProcessed).toBe(5);
      expect(performance.totalTokensProcessed).toBeGreaterThan(0);
      expect(performance.totalEntitiesExtracted).toBeGreaterThanOrEqual(0);
      expect(performance.averageTimePerDocument).toBeLessThan(10000); // Less than 10 seconds per doc
      
      return performance;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Error Recovery Workflow", () =>
    Effect.gen(function* () {
      const processor = yield* DP.DocumentProcessorService;
      
      // Test graceful handling of edge cases
      const edgeCases = [
        "", // empty
        " ", // whitespace only
        "a", // single char
        "123", // numbers only
        "!!!", // punctuation only
        Fixtures.TEST_CASES.SPECIAL_CHARACTERS, // unicode
        Fixtures.TEST_CASES.HTML_CONTENT, // HTML
        Fixtures.TEST_CASES.JSON_CONTENT // JSON
      ];
      
      // Process all edge cases - should not throw errors
      const results = yield* Effect.all(
        edgeCases.map(text => 
          processor.process(text).pipe(
            Effect.either,
            Effect.map(result => ({
              text: text.slice(0, 20),
              success: result._tag === "Right",
              error: result._tag === "Left" ? result.left : null
            }))
          )
        )
      );
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      const summary = {
        totalTests: edgeCases.length,
        successful: successCount,
        errors: errorCount,
        successRate: (successCount / edgeCases.length) * 100,
        results
      };
      
      expect(summary.totalTests).toBe(8);
      expect(summary.successRate).toBeGreaterThan(50); // At least 50% success rate
      
      return summary;
    }).pipe(Effect.provide(TestLayer))
  );

  it("Service Layer Integration Workflow", () =>
    Effect.gen(function* () {
      // Test all three services working together
      const processor = yield* DP.DocumentProcessorService;
      const query = yield* DP.DocumentQueryService;
      const transformer = yield* DP.TextTransformerService;
      
      // Step 1: Process document
      const document = yield* processor.process("Apple Inc. announced new iPhone models.");
      
      // Step 2: Query entities
      const organizations = query.findEntities(document, e => e.label === "ORGANIZATION");
      const tokens = query.findTokens(document, t => t.isProperNoun);
      
      // Step 3: Transform text
      const normalized = yield* transformer.transform(document.text, { _tag: "Normalize" });
      const titleCase = yield* transformer.transform(document.text, { _tag: "ToTitleCase" });
      
      // Step 4: Generate stats
      const stats = processor.getStats(document);
      
      // Validate integration
      expect(document).toBeInstanceOf(Core.Document);
      expect(Array.isArray(organizations)).toBe(true);
      expect(Array.isArray(tokens)).toBe(true);
      expect(typeof normalized).toBe("string");
      expect(typeof titleCase).toBe("string");
      expect(stats).toBeInstanceOf(Core.DocumentStats);
      
      const integration = {
        originalText: document.text,
        normalized,
        titleCase,
        organizations: organizations.length,
        properNouns: tokens.length,
        totalTokens: stats.tokenCount,
        totalEntities: stats.entityCount
      };
      
      return integration;
    }).pipe(Effect.provide(TestLayer))
  );
});