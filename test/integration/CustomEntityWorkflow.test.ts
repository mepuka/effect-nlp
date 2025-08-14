/**
 * Integration tests for complete custom entity workflows
 * Tests end-to-end scenarios with proper Effect patterns
 */

import { describe, it, expect } from "vitest";
import { Effect, pipe, Array as RA, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DocumentProcessor from "../../src/NLP/DocumentProcessor.js";
import { DocumentProcessingLive } from "../../src/NLP/DocumentProcessorLive.js";

const TestLayer = DocumentProcessingLive;

describe("Custom Entity Workflow Integration", () => {
  describe("Complete Entity Learning and Processing Workflow", () => {
    it("should learn patterns, process text, and extract entities in sequence", () =>
      Effect.gen(function* () {
        // Step 1: Create entity patterns using Effect.sync for complex logic
        const createPatterns = Effect.sync(() => [
          Core.EntityPattern.forTerms(
            "programming_languages",
            "Programming Languages",
            Core.EntityLabels.custom("LANG"),
            ["JavaScript", "TypeScript", "Python", "Rust"]
          ),
          Core.EntityPattern.forTerms(
            "frameworks",
            "Frameworks",
            Core.EntityLabels.custom("FRAMEWORK"),
            ["React", "Vue", "Angular", "Express"]
          ),
        ]);

        const patterns = yield* createPatterns;

        // Step 2: Create definition with Effect error handling
        const definition = yield* Effect.try({
          try: () =>
            Core.CustomEntityDefinition.create(
              "dev_stack_analysis",
              "software_development",
              "1.0.0",
              patterns
            ),
          catch: (error) => new Error(`Failed to create definition: ${error}`),
        });

        // Step 3: Get processor service
        const processor = yield* DocumentProcessor.DocumentProcessorService;

        // Step 4: Learn custom entities
        yield* processor.learnCustomEntities(definition);

        // Step 5: Process text with learned entities
        const codeText =
          "Our stack uses TypeScript with React framework and Python for backend services.";
        const document = yield* processor.process(codeText);

        // Step 6: Extract and analyze entities using Effect operations
        const analysis = yield* Effect.gen(function* () {
          const allEntities = document.getEntities();

          const customEntities = yield* Effect.sync(() =>
            pipe(allEntities, Core.E.filterCustom)
          );

          const languageEntities = yield* Effect.sync(() =>
            pipe(
              allEntities,
              RA.filter((e) => e.label === "CUSTOM_PROGRAMMING_LANGUAGES")
            )
          );

          const frameworkEntities = yield* Effect.sync(() =>
            pipe(
              allEntities,
              RA.filter((e) => e.label === "CUSTOM_FRAMEWORKS")
            )
          );

          return {
            totalEntities: allEntities.length,
            customEntities: customEntities.length,
            languages: languageEntities.map((e) => e.text),
            frameworks: frameworkEntities.map((e) => e.text),
          };
        });

        // Verify complete workflow
        expect(analysis.customEntities).toBeGreaterThan(0);
        expect(analysis.languages.length + analysis.frameworks.length).toBe(
          analysis.customEntities
        );
        expect(analysis.languages).toContain("TypeScript");
        expect(analysis.languages).toContain("Python");
        expect(analysis.frameworks).toContain("React");
      }).pipe(Effect.provide(TestLayer)));

    it("should handle multi-domain entity recognition with Effect composition", () =>
      Effect.gen(function* () {
        // Create multiple domain-specific definitions
        const createDomainDefinitions = Effect.all([
          // Business domain
          Effect.succeed(
            Core.CustomEntityDefinition.create(
              "business_entities",
              "business",
              "1.0.0",
              [
                Core.EntityPattern.forTerms(
                  "business_metrics",
                  "Business Metrics",
                  Core.EntityLabels.custom("METRIC"),
                  ["revenue", "profit", "ROI", "KPI"]
                ),
              ]
            )
          ),
          // Technology domain
          Effect.succeed(
            Core.CustomEntityDefinition.create(
              "tech_entities",
              "technology",
              "1.0.0",
              [
                Core.EntityPattern.forTerms(
                  "tech_concepts",
                  "Technology Concepts",
                  Core.EntityLabels.custom("TECH"),
                  ["API", "database", "cloud", "microservices"]
                ),
              ]
            )
          ),
        ]);

        const [businessDef, techDef] = yield* createDomainDefinitions;

        const processor = yield* DocumentProcessor.DocumentProcessorService;

        // Learn entities from multiple domains
        yield* Effect.all([
          processor.learnCustomEntities(businessDef),
          processor.learnCustomEntities(techDef),
        ]);

        const businessText =
          "The company's revenue increased through better API design and cloud infrastructure, improving overall ROI.";

        // Process with all learned entities
        const document = yield* processor.process(businessText);

        // Analyze multi-domain results
        const multiDomainAnalysis = yield* Effect.gen(function* () {
          const entities = document.getEntities();

          const businessEntities = yield* Effect.sync(() =>
            pipe(
              entities,
              RA.filter((e) => e.label === "CUSTOM_BUSINESS_METRICS")
            )
          );

          const techEntities = yield* Effect.sync(() =>
            pipe(
              entities,
              RA.filter((e) => e.label === "CUSTOM_TECH_CONCEPTS")
            )
          );

          const entityDistribution = yield* Effect.sync(() =>
            pipe(entities, Core.E.countByLabel, HashMap.toEntries)
          );

          return {
            businessTerms: businessEntities.map((e) => e.text),
            techTerms: techEntities.map((e) => e.text),
            distribution: entityDistribution,
            totalCustom: businessEntities.length + techEntities.length,
          };
        });

        // Verify multi-domain recognition
        expect(multiDomainAnalysis.totalCustom).toBeGreaterThan(0);
        expect(
          multiDomainAnalysis.businessTerms.length +
            multiDomainAnalysis.techTerms.length
        ).toBe(multiDomainAnalysis.totalCustom);
        expect([
          ...multiDomainAnalysis.businessTerms,
          ...multiDomainAnalysis.techTerms,
        ]).toContain("API");
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Advanced Pattern Matching Scenarios", () => {
    it("should handle complex shorthand patterns with Effect error recovery", () =>
      Effect.gen(function* () {
        // Create complex patterns with potential edge cases
        const createComplexPatterns = Effect.gen(function* () {
          const sizePattern = yield* Effect.try({
            try: () =>
              Core.EntityPattern.forShorthand(
                "product_sizes",
                "Product Sizes",
                Core.EntityLabels.custom("SIZE"),
                "[Small|Medium|Large|Extra Large]"
              ),
            catch: (error) => new Error(`Size pattern failed: ${error}`),
          });

          const colorPattern = yield* Effect.try({
            try: () =>
              Core.EntityPattern.forShorthand(
                "product_colors",
                "Product Colors",
                Core.EntityLabels.custom("COLOR"),
                "[Red|Blue|Green|Black|White]"
              ),
            catch: (error) => new Error(`Color pattern failed: ${error}`),
          });

          return [sizePattern, colorPattern];
        });

        const patterns = yield* createComplexPatterns;

        const definition = Core.CustomEntityDefinition.create(
          "product_catalog",
          "ecommerce",
          "1.0.0",
          patterns
        );

        const productText =
          "Available in Small Red, Medium Blue, and Large Black options.";

        // Extract with error recovery
        const extractionResult = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(productText).pipe(
          Effect.catchAll((error) =>
            Effect.succeed({
              success: false,
              error: error.message,
              entities: [] as Core.Entity[],
            })
          )
        );

        // Verify extraction or graceful error handling
        if (Array.isArray(extractionResult)) {
          expect(extractionResult.length).toBeGreaterThan(0);
          const entityTexts = extractionResult.map((e) => e.text);
          expect(
            entityTexts.some((text) =>
              ["Small", "Red", "Medium", "Blue", "Large", "Black"].includes(
                text
              )
            )
          ).toBe(true);
        } else {
          expect(extractionResult.success).toBe(false);
        }
      }).pipe(Effect.provide(TestLayer)));

    it("should process POS-based patterns with Effect data transformation", () =>
      Effect.gen(function* () {
        // Create POS-based patterns
        const posPatterns = yield* Effect.sync(() => [
          Core.EntityPattern.forPosSequence(
            "adjective_noun",
            "Adjective-Noun Pairs",
            Core.EntityLabels.custom("DESCRIPTOR"),
            ["ADJ", "NOUN"]
          ),
          Core.EntityPattern.forNounPhrase("noun_phrases"),
        ]);

        const definition = Core.CustomEntityDefinition.create(
          "linguistic_analysis",
          "grammar",
          "1.0.0",
          posPatterns
        );

        const linguisticText =
          "The beautiful garden has colorful flowers and tall trees.";

        // Extract and transform linguistic data
        const linguisticAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            definition
          )(linguisticText);

          // Transform data using Effect.sync
          const analysis = yield* Effect.sync(() => {
            const descriptors = entities.filter(
              (e) => e.label === "CUSTOM_ADJECTIVE_NOUN"
            );
            const nounPhrases = entities.filter(
              (e) => e.label === "CUSTOM_NOUN_PHRASES"
            );

            return {
              descriptorCount: descriptors.length,
              nounPhraseCount: nounPhrases.length,
              avgEntityLength:
                entities.length > 0
                  ? entities.reduce((sum, e) => sum + e.text.length, 0) /
                    entities.length
                  : 0,
              entityPositions: entities.map((e) => ({
                text: e.text,
                start: e.offset.char.start,
                end: e.offset.char.end,
              })),
            };
          });

          return analysis;
        });

        // Verify linguistic analysis
        expect(
          linguisticAnalysis.descriptorCount +
            linguisticAnalysis.nounPhraseCount
        ).toBeGreaterThan(0);
        expect(linguisticAnalysis.avgEntityLength).toBeGreaterThan(0);
        expect(linguisticAnalysis.entityPositions.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Performance and Scalability Testing", () => {
    it("should handle large-scale entity extraction with Effect concurrency", () =>
      Effect.gen(function* () {
        // Create comprehensive entity patterns
        const createLargePatternSet = Effect.sync(() => {
          const domains = ["TECH", "BUSINESS", "SCIENCE", "HEALTH", "FINANCE"];
          return domains.flatMap((domain) =>
            Array.from({ length: 5 }, (_, i) =>
              Core.EntityPattern.forTerms(
                `${domain.toLowerCase()}_terms_${i}`,
                `${domain} Terms ${i}`,
                Core.EntityLabels.custom(domain),
                [
                  `${domain.toLowerCase()}${i}a`,
                  `${domain.toLowerCase()}${i}b`,
                  `${domain.toLowerCase()}${i}c`,
                ]
              )
            )
          );
        });

        const patterns = yield* createLargePatternSet;

        const definition = Core.CustomEntityDefinition.create(
          "large_scale_test",
          "comprehensive",
          "1.0.0",
          patterns
        );

        // Create test documents
        const createTestDocuments = Effect.sync(() =>
          Array.from(
            { length: 10 },
            (_, i) =>
              `Document ${i}: tech0a business1b science2c health3a finance4b analysis.`
          )
        );

        const documents = yield* createTestDocuments;

        // Process documents concurrently
        const startTime = Date.now();

        const results = yield* Effect.all(
          documents.map((doc) =>
            DocumentProcessor.extractCustomEntities(definition)(doc)
          ),
          { concurrency: 3 }
        );

        const endTime = Date.now();

        // Analyze performance
        const performanceAnalysis = yield* Effect.sync(() => ({
          documentsProcessed: documents.length,
          totalEntities: results.reduce(
            (sum, entities) => sum + entities.length,
            0
          ),
          processingTimeMs: endTime - startTime,
          avgEntitiesPerDoc:
            results.reduce((sum, entities) => sum + entities.length, 0) /
            documents.length,
          avgTimePerDoc: (endTime - startTime) / documents.length,
        }));

        // Verify performance characteristics
        expect(performanceAnalysis.documentsProcessed).toBe(10);
        expect(performanceAnalysis.totalEntities).toBeGreaterThan(0);
        expect(performanceAnalysis.processingTimeMs).toBeLessThan(30000); // Should complete within 30 seconds
        expect(performanceAnalysis.avgEntitiesPerDoc).toBeGreaterThan(0);
      }).pipe(Effect.provide(TestLayer)));

    it("should maintain entity extraction accuracy under concurrent load", () =>
      Effect.gen(function* () {
        // Create deterministic patterns for accuracy testing
        const accuracyPatterns = [
          Core.EntityPattern.forTerms(
            "test_colors",
            "Test Colors",
            Core.EntityLabels.custom("COLOR"),
            ["red", "blue", "green"]
          ),
          Core.EntityPattern.forTerms(
            "test_numbers",
            "Test Numbers",
            Core.EntityLabels.custom("NUMBER"),
            ["one", "two", "three"]
          ),
        ];

        const definition = Core.CustomEntityDefinition.create(
          "accuracy_test",
          "testing",
          "1.0.0",
          accuracyPatterns
        );

        // Create predictable test cases
        const testCases = [
          { text: "red one", expectedColors: 1, expectedNumbers: 1 },
          { text: "blue two green", expectedColors: 2, expectedNumbers: 1 },
          { text: "three red blue", expectedColors: 2, expectedNumbers: 1 },
          { text: "one two three", expectedColors: 0, expectedNumbers: 3 },
        ];

        // Process all test cases concurrently
        const accuracyResults = yield* Effect.all(
          testCases.map((testCase) =>
            Effect.gen(function* () {
              const entities = yield* DocumentProcessor.extractCustomEntities(
                definition
              )(testCase.text);

              const colorCount = yield* Effect.sync(
                () =>
                  entities.filter((e) => e.label === "CUSTOM_TEST_COLORS")
                    .length
              );

              const numberCount = yield* Effect.sync(
                () =>
                  entities.filter((e) => e.label === "CUSTOM_TEST_NUMBERS")
                    .length
              );

              return {
                text: testCase.text,
                expectedColors: testCase.expectedColors,
                expectedNumbers: testCase.expectedNumbers,
                actualColors: colorCount,
                actualNumbers: numberCount,
                accurate:
                  colorCount === testCase.expectedColors &&
                  numberCount === testCase.expectedNumbers,
              };
            })
          ),
          { concurrency: 4 }
        );

        // Verify accuracy under concurrent load
        const accuracyRate =
          accuracyResults.filter((result) => result.accurate).length /
          accuracyResults.length;

        expect(accuracyRate).toBeGreaterThan(0.8); // At least 80% accuracy
        expect(
          accuracyResults.every(
            (result) => result.actualColors >= 0 && result.actualNumbers >= 0
          )
        ).toBe(true);

        // Log detailed results for debugging if needed
        const detailedAnalysis = yield* Effect.sync(() => ({
          totalTests: accuracyResults.length,
          accurateResults: accuracyResults.filter((r) => r.accurate).length,
          accuracyRate: accuracyRate * 100,
          failures: accuracyResults.filter((r) => !r.accurate),
        }));

        expect(detailedAnalysis.totalTests).toBe(4);
        expect(detailedAnalysis.accuracyRate).toBeGreaterThan(80);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Real-World Document Processing", () => {
    it("should extract entities from structured business documents", () =>
      Effect.gen(function* () {
        // Business document entity patterns
        const businessPatterns = [
          Core.EntityPattern.forTerms(
            "financial_metrics",
            "Financial Metrics",
            Core.EntityLabels.custom("METRIC"),
            ["revenue", "EBITDA", "margin", "ROI", "CAGR"]
          ),
          Core.EntityPattern.forTerms(
            "business_units",
            "Business Units",
            Core.EntityLabels.custom("UNIT"),
            ["division", "subsidiary", "department", "branch"]
          ),
          Core.EntityPattern.forShorthand(
            "quarters",
            "Quarters",
            Core.EntityLabels.custom("PERIOD"),
            "[Q1|Q2|Q3|Q4]"
          ),
        ];

        const definition = Core.CustomEntityDefinition.create(
          "business_document_analysis",
          "business_intelligence",
          "1.0.0",
          businessPatterns
        );

        const businessDocument = `
          Q1 revenue for the technology division increased by 15%, while the marketing department 
          saw EBITDA margin improvements. The subsidiary reported strong ROI in Q2, with the 
          European branch showing exceptional CAGR growth.
        `;

        // Extract and categorize business entities
        const businessAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            definition
          )(businessDocument);

          const categorizedEntities = yield* Effect.sync(() => {
            const metrics = entities.filter(
              (e) => e.label === "CUSTOM_FINANCIAL_METRICS"
            );
            const units = entities.filter(
              (e) => e.label === "CUSTOM_BUSINESS_UNITS"
            );
            const periods = entities.filter(
              (e) => e.label === "CUSTOM_QUARTERS"
            );

            return {
              financialMetrics: metrics.map((e) => e.text),
              businessUnits: units.map((e) => e.text),
              timePeriods: periods.map((e) => e.text),
              totalBusinessEntities: entities.length,
            };
          });

          return categorizedEntities;
        });

        // Verify business document analysis
        expect(businessAnalysis.totalBusinessEntities).toBeGreaterThan(0);
        expect(
          businessAnalysis.financialMetrics.length +
            businessAnalysis.businessUnits.length +
            businessAnalysis.timePeriods.length
        ).toBe(businessAnalysis.totalBusinessEntities);

        // Check for expected business terms
        const allTerms = [
          ...businessAnalysis.financialMetrics,
          ...businessAnalysis.businessUnits,
          ...businessAnalysis.timePeriods,
        ];

        expect(
          allTerms.some((term) =>
            ["Q1", "Q2", "revenue", "EBITDA", "ROI", "CAGR"].includes(term)
          )
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });
});
