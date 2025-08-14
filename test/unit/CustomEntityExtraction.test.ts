/**
 * Comprehensive tests for custom entity extraction functionality
 * Tests real-world Effect usage patterns with proper Effect construction
 */

import { describe, it, expect } from "vitest";
import { Effect, pipe, Array as RA, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DocumentProcessor from "../../src/NLP/DocumentProcessor.js";
import { DocumentProcessingLive } from "../../src/NLP/DocumentProcessorLive.js";

/**
 * Test Layer for custom entity tests
 */
const TestLayer = DocumentProcessingLive;

describe("Custom Entity Extraction", () => {
  describe("Basic Custom Entity Recognition", () => {
    it("should extract simple term patterns with proper Effect construction", () =>
      Effect.gen(function* () {
        // Data in: Simple tech terms pattern
        const techPattern = Core.EntityPattern.forTerms(
          "tech_terms",
          "Technology Terms",
          Core.EntityLabels.custom("TECH"),
          ["AI", "blockchain", "quantum"],
          ["artificial intelligence", "distributed ledger"],
          8
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_analysis",
          "technology",
          "1.0.0",
          [techPattern]
        );

        const inputText =
          "Companies are investing in AI and blockchain technology.";

        // Effect operation: Extract custom entities
        const customEntities = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(inputText);

        // Data out: Verify extracted entities
        expect(customEntities).toHaveLength(2);

        const entityTexts = customEntities.map((e) => e.text);
        expect(entityTexts).toContain("AI");
        expect(entityTexts).toContain("blockchain");

        // Verify branded labels
        customEntities.forEach((entity) => {
          expect(entity.label).toBe("CUSTOM_TECH");
          expect(entity.isCustomEntity).toBe(true);
          expect(entity.isStandardEntity).toBe(false);
        });
      }).pipe(Effect.provide(TestLayer)));

    it("should handle shorthand patterns with proper yield usage", () =>
      Effect.gen(function* () {
        // Data in: Pizza category pattern (from wink-nlp docs)
        const pizzaPattern = Core.EntityPattern.forShorthand(
          "pizza_categories",
          "Pizza Categories",
          Core.EntityLabels.custom("PIZZA"),
          "[Classic|Supreme|Extravaganza|Favorite]"
        );

        const definition = Core.CustomEntityDefinition.create(
          "pizza_ordering",
          "food",
          "1.0.0",
          [pizzaPattern]
        );

        const inputText = "I want a classic pizza and a supreme pizza.";

        // Effect operation: Extract with proper yield*
        const entities = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(inputText);

        // Data out: Verify results
        expect(entities).toHaveLength(2);
        expect(entities[0].text).toBe("classic");
        expect(entities[1].text).toBe("supreme");
        expect(entities[0].label).toBe("CUSTOM_PIZZA_CATEGORIES");
        expect(entities[1].label).toBe("CUSTOM_PIZZA_CATEGORIES");
      }).pipe(Effect.provide(TestLayer)));

    it("should extract POS-based patterns using Effect.sync for data transformation", () =>
      Effect.gen(function* () {
        // Data in: Noun phrase pattern
        const nounPhrasePattern =
          Core.EntityPattern.forNounPhrase("noun_phrases");

        const definition = Core.CustomEntityDefinition.create(
          "linguistic_analysis",
          "grammar",
          "1.0.0",
          [nounPhrasePattern]
        );

        const inputText = "The big house stands near the old tree.";

        // Effect operation: Extract entities
        const entities = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(inputText);

        // Effect.sync for data transformation
        const entitySummary = yield* Effect.sync(() => ({
          totalFound: entities.length,
          entityTexts: entities.map((e) => e.text),
          avgLength:
            entities.length > 0
              ? entities.reduce((sum, e) => sum + e.text.length, 0) /
                entities.length
              : 0,
        }));

        // Data out: Verify extraction and transformation
        expect(entitySummary.totalFound).toBeGreaterThan(0);
        expect(entitySummary.entityTexts).toContain("house");
        expect(entitySummary.avgLength).toBeGreaterThan(0);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Effect-Style Data Processing", () => {
    it("should process multiple entity types with functional composition", () =>
      Effect.gen(function* () {
        // Data in: Multiple patterns
        const patterns = [
          Core.EntityPattern.forTerms(
            "tech_companies",
            "Tech Companies",
            Core.EntityLabels.custom("COMPANY"),
            ["Apple", "Google", "Microsoft"]
          ),
          Core.EntityPattern.forTerms(
            "tech_products",
            "Tech Products",
            Core.EntityLabels.custom("PRODUCT"),
            ["iPhone", "Android", "Windows"]
          ),
        ];

        const definition = Core.CustomEntityDefinition.create(
          "tech_ecosystem",
          "technology",
          "1.0.0",
          patterns
        );

        const inputText =
          "Apple released the iPhone while Google developed Android.";

        // Effect operation: Extract all custom entities
        const allEntities = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(inputText);

        // Effect-style functional processing
        const processingResult = yield* Effect.sync(() =>
          pipe(
            allEntities,
            Core.E.groupByLabel,
            HashMap.toEntries,
            RA.map(([label, group]) => ({
              label,
              count: group.length,
              entities: group.map((e) => e.text),
            }))
          )
        );

        // Data out: Verify functional processing
        expect(processingResult).toHaveLength(2);

        const companyGroup = processingResult.find(
          (g) => g.label === "CUSTOM_TECH_COMPANIES"
        );
        const productGroup = processingResult.find(
          (g) => g.label === "CUSTOM_TECH_PRODUCTS"
        );

        expect(companyGroup).toBeDefined();
        expect(productGroup).toBeDefined();
        expect(companyGroup!.entities).toContain("Apple");
        expect(productGroup!.entities).toContain("iPhone");
      }).pipe(Effect.provide(TestLayer)));

    it("should handle entity filtering with branded types and Effect operations", () =>
      Effect.gen(function* () {
        // Data in: Mixed entity definition
        const mixedPattern = Core.EntityPattern.forTerms(
          "mixed_entities",
          "Mixed Entities",
          Core.EntityLabels.custom("MIXED"),
          ["data", "analysis", "machine", "learning"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "data_science",
          "analytics",
          "1.0.0",
          [mixedPattern]
        );

        const inputText = "Data analysis using machine learning techniques.";

        // Effect operation: Process with custom entities
        const document = yield* DocumentProcessor.processWithCustomEntities(
          definition
        )(inputText);

        // Effect-style entity operations with branded types
        const allEntities = document.getEntities();
        const customEntities = yield* Effect.sync(() =>
          pipe(allEntities, Core.E.filterCustom)
        );

        const longCustomEntities = yield* Effect.sync(() =>
          pipe(customEntities, Core.E.filterByTextLength(6))
        );

        // Data out: Verify branded type filtering
        expect(customEntities.length).toBeGreaterThan(0);
        expect(longCustomEntities.length).toBeGreaterThan(0);

        customEntities.forEach((entity) => {
          expect(entity.isCustomEntity).toBe(true);
          expect(entity.label.startsWith("CUSTOM_")).toBe(true);
        });

        longCustomEntities.forEach((entity) => {
          expect(entity.text.length).toBeGreaterThan(5);
        });
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty text with proper Effect error handling", () =>
      Effect.gen(function* () {
        // Data in: Valid pattern, empty text
        const pattern = Core.EntityPattern.forTerms(
          "test_pattern",
          "Test Pattern",
          Core.EntityLabels.custom("TEST"),
          ["test", "example"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "empty_test",
          "testing",
          "1.0.0",
          [pattern]
        );

        const emptyText = "";

        // Effect operation: Handle empty input
        const result = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(emptyText).pipe(
          Effect.catchAll((error) =>
            Effect.succeed({
              error: error.message,
              entities: [] as Core.Entity[],
            })
          )
        );

        // Data out: Verify graceful handling
        if ("entities" in result) {
          expect(result.entities).toHaveLength(0);
        } else {
          expect(result).toHaveLength(0);
        }
      }).pipe(Effect.provide(TestLayer)));

    it("should handle no matches with Effect success", () =>
      Effect.gen(function* () {
        // Data in: Pattern that won't match
        const pattern = Core.EntityPattern.forTerms(
          "unmatchable",
          "Unmatchable Terms",
          Core.EntityLabels.custom("NOMATCH"),
          ["xyz123", "abc456"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "no_match_test",
          "testing",
          "1.0.0",
          [pattern]
        );

        const inputText = "This text contains no matching entities.";

        // Effect operation: Extract (expecting no matches)
        const entities = yield* DocumentProcessor.extractCustomEntities(
          definition
        )(inputText);

        // Data out: Verify empty result is still success
        expect(entities).toHaveLength(0);
        expect(Array.isArray(entities)).toBe(true);
      }).pipe(Effect.provide(TestLayer)));

    it("should validate entity definitions with Effect error handling", () =>
      Effect.gen(function* () {
        // Data in: Valid definition
        const validPattern = Core.EntityPattern.forTerms(
          "valid_pattern",
          "Valid Pattern",
          Core.EntityLabels.custom("VALID"),
          ["valid", "term"]
        );

        const validDefinition = Core.CustomEntityDefinition.create(
          "validation_test",
          "testing",
          "1.0.0",
          [validPattern]
        );

        // Effect operation: Validate definition
        const validationResult =
          yield* DocumentProcessor.validateEntityDefinition(
            validDefinition
          ).pipe(
            Effect.map(() => ({ isValid: true, definition: validDefinition })),
            Effect.catchAll((error) =>
              Effect.succeed({ isValid: false, error: error.message })
            )
          );

        // Data out: Verify validation success
        expect(validationResult.isValid).toBe(true);
        if (validationResult.isValid && "definition" in validationResult) {
          expect(validationResult.definition).toBe(validDefinition);
        }
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Real-World Usage Patterns", () => {
    it("should process financial document entities with Effect composition", () =>
      Effect.gen(function* () {
        // Data in: Financial entity patterns
        const currencyPattern = Core.EntityPattern.forTerms(
          "currencies",
          "Currencies",
          Core.EntityLabels.custom("CURRENCY"),
          ["USD", "EUR", "GBP", "JPY"]
        );

        const financialTermsPattern = Core.EntityPattern.forTerms(
          "financial_terms",
          "Financial Terms",
          Core.EntityLabels.custom("FINTERM"),
          ["portfolio", "dividend", "equity", "bond"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "financial_analysis",
          "finance",
          "1.0.0",
          [currencyPattern, financialTermsPattern]
        );

        const financialText =
          "The portfolio includes USD bonds and EUR equity positions with quarterly dividend payments.";

        // Effect composition: Process and analyze
        const analysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            definition
          )(financialText);

          const entityCounts = yield* Effect.sync(() =>
            pipe(entities, Core.E.countByLabel)
          );

          const uniqueLabels = yield* Effect.sync(() =>
            pipe(entities, Core.E.getUniqueLabels)
          );

          return {
            totalEntities: entities.length,
            entityCounts: HashMap.toEntries(entityCounts),
            uniqueLabels,
            entities: entities.map((e) => ({
              text: e.text,
              label: e.label,
              position: e.offset.char,
            })),
          };
        });

        // Data out: Verify comprehensive analysis
        expect(analysis.totalEntities).toBeGreaterThan(0);
        expect(analysis.uniqueLabels.length).toBeGreaterThan(0);
        expect(analysis.entityCounts.length).toBeGreaterThan(0);

        const hasFinancialTerms = analysis.entities.some(
          (e) => e.label === "CUSTOM_FINANCIAL_TERMS"
        );
        const hasCurrencies = analysis.entities.some(
          (e) => e.label === "CUSTOM_CURRENCIES"
        );

        expect(hasFinancialTerms || hasCurrencies).toBe(true);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle concurrent custom entity extraction with Effect.all", () =>
      Effect.gen(function* () {
        // Data in: Multiple text samples
        const pattern = Core.EntityPattern.forTerms(
          "colors",
          "Colors",
          Core.EntityLabels.custom("COLOR"),
          ["red", "blue", "green", "yellow"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "color_detection",
          "visual",
          "1.0.0",
          [pattern]
        );

        const textSamples = [
          "The red car is fast.",
          "Blue skies are beautiful.",
          "Green trees in the park.",
          "Yellow flowers bloom.",
        ];

        // Effect operation: Concurrent processing
        const allResults = yield* Effect.all(
          textSamples.map((text) =>
            DocumentProcessor.extractCustomEntities(definition)(text)
          ),
          { concurrency: 2 }
        );

        // Effect.sync for result aggregation
        const aggregatedResults = yield* Effect.sync(() => ({
          totalSamples: textSamples.length,
          totalEntities: allResults.reduce(
            (sum, entities) => sum + entities.length,
            0
          ),
          entitiesPerSample: allResults.map((entities) => entities.length),
          allEntityTexts: allResults.flatMap((entities) =>
            entities.map((e) => e.text)
          ),
        }));

        // Data out: Verify concurrent processing
        expect(aggregatedResults.totalSamples).toBe(4);
        expect(aggregatedResults.totalEntities).toBeGreaterThan(0);
        expect(aggregatedResults.allEntityTexts).toContain("red");
        expect(aggregatedResults.allEntityTexts).toContain("blue");
      }).pipe(Effect.provide(TestLayer)));

    it("should create domain-specific entity extraction pipeline", () =>
      Effect.gen(function* () {
        // Data in: Medical domain patterns
        const symptomsPattern = Core.EntityPattern.forTerms(
          "symptoms",
          "Medical Symptoms",
          Core.EntityLabels.custom("SYMPTOM"),
          ["fever", "cough", "headache", "nausea"]
        );

        const medicationsPattern = Core.EntityPattern.forTerms(
          "medications",
          "Medications",
          Core.EntityLabels.custom("MEDICATION"),
          ["aspirin", "ibuprofen", "acetaminophen"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "medical_nlp",
          "healthcare",
          "1.0.0",
          [symptomsPattern, medicationsPattern]
        );

        const medicalNote =
          "Patient reports fever and headache. Prescribed aspirin for pain relief.";

        // Effect pipeline: Extract and categorize
        const medicalAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            definition
          )(medicalNote);

          const symptoms = yield* Effect.sync(() =>
            pipe(
              entities,
              RA.filter((e) => e.label === "CUSTOM_SYMPTOMS"),
              RA.map((e) => e.text)
            )
          );

          const medications = yield* Effect.sync(() =>
            pipe(
              entities,
              RA.filter((e) => e.label === "CUSTOM_MEDICATIONS"),
              RA.map((e) => e.text)
            )
          );

          return {
            patientSymptoms: symptoms,
            prescribedMedications: medications,
            totalMedicalEntities: entities.length,
          };
        });

        // Data out: Verify domain-specific extraction
        expect(medicalAnalysis.totalMedicalEntities).toBeGreaterThan(0);
        expect(
          medicalAnalysis.patientSymptoms.length +
            medicalAnalysis.prescribedMedications.length
        ).toBe(medicalAnalysis.totalMedicalEntities);

        const allMedicalTerms = [
          ...medicalAnalysis.patientSymptoms,
          ...medicalAnalysis.prescribedMedications,
        ];
        expect(
          allMedicalTerms.some((term) =>
            ["fever", "headache", "aspirin"].includes(term)
          )
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });
});
