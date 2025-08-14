/**
 * Integration tests for custom entity functionality with DocumentProcessorLive
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, pipe, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DP from "../../src/NLP/DocumentProcessor.js";
import * as Live from "../../src/NLP/DocumentProcessorLive.js";

describe("Custom Entity Integration", () => {
  const TestLayer = Live.DocumentProcessingLive;

  describe("EntityPattern Creation and Validation", () => {
    it("should create valid entity patterns", () =>
      Effect.gen(function* () {
        const _processor = yield* DP.DocumentProcessorService;
        // Test different pattern creation methods
        const techCompanies = Core.EntityPattern.forTerms(
          "tech_companies",
          "Technology Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google", "Meta"]
        );

        const emailPattern = Core.EntityPattern.forRegex(
          "email_pattern",
          "Email Addresses",
          "EMAIL",
          "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
          ["user@example.com", "test@domain.org"]
        );

        const posPattern = Core.EntityPattern.forPosSequence(
          "noun_phrase",
          "Noun Phrases",
          "MISC",
          ["ADJ", "NOUN"]
        );

        expect(techCompanies.id).toBe("tech_companies");
        expect(techCompanies.name).toBe("Technology Companies");
        expect(techCompanies.label).toBe("ORGANIZATION");
        expect(techCompanies.patterns).toHaveLength(4);
        expect(techCompanies.examples).toHaveLength(4);
        expect(techCompanies.priority).toBe(5);

        expect(emailPattern.patterns).toHaveLength(1);
        expect(emailPattern.examples).toHaveLength(2);

        expect(posPattern.patterns).toHaveLength(1);
        expect(posPattern.patterns[0]).toContain("[pos=ADJ] [pos=NOUN]");
      }).pipe(Effect.provide(TestLayer)));

    it("should validate entity patterns", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        // Valid pattern
        const validPattern = Core.EntityPattern.forTerms(
          "valid_test",
          "Valid Test Pattern",
          "ORGANIZATION",
          ["TestCorp", "ValidCompany"]
        );

        const validDefinition = Core.CustomEntityDefinition.create(
          "valid_test_def",
          "test",
          "1.0.0",
          [validPattern]
        );

        const validatedDef = yield* processor.validateEntityDefinition(
          validDefinition
        );
        expect(validatedDef.id).toBe("valid_test_def");
        expect(validatedDef.patternCount).toBe(1);

        // Invalid regex pattern
        const invalidPattern = Core.EntityPattern.forRegex(
          "invalid_test",
          "Invalid Test Pattern",
          "MISC",
          "[unclosed bracket", // Invalid regex
          []
        );

        const invalidDefinition = Core.CustomEntityDefinition.create(
          "invalid_test_def",
          "test",
          "1.0.0",
          [invalidPattern]
        );

        const validationResult = yield* processor
          .validateEntityDefinition(invalidDefinition)
          .pipe(Effect.either);

        expect(validationResult._tag).toBe("Left");
        if (validationResult._tag === "Left") {
          expect(validationResult.left._tag).toBe("EntityPatternError");
        }
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("CustomEntityDefinition Management", () => {
    it("should create and manage custom entity definitions", () =>
      Effect.gen(function* () {
        const _processor = yield* DP.DocumentProcessorService;
        const techPattern = Core.EntityPattern.forTerms(
          "tech_companies",
          "Tech Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google"]
        );

        const languagePattern = Core.EntityPattern.forTerms(
          "programming_languages",
          "Programming Languages",
          "MISC",
          ["TypeScript", "Python", "Rust"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_domain",
          "technology",
          "1.0.0",
          [techPattern, languagePattern],
          {
            description: "Technology domain entities",
            config: Core.CustomEntityConfig.create({
              matchValue: false,
              usePOS: true,
              useEntity: true,
            }),
          }
        );

        expect(definition.id).toBe("tech_domain");
        expect(definition.domain).toBe("technology");
        expect(definition.version).toBe("1.0.0");
        expect(definition.patternCount).toBe(2);
        expect(definition.description).toBe("Technology domain entities");

        // Test pattern retrieval
        const orgPatterns = definition.getPatternsByLabel("ORGANIZATION");
        const miscPatterns = definition.getPatternsByLabel("MISC");

        expect(orgPatterns).toHaveLength(1);
        expect(miscPatterns).toHaveLength(1);
        expect(orgPatterns[0].name).toBe("Tech Companies");
        expect(miscPatterns[0].name).toBe("Programming Languages");

        // Test pattern management
        const newPattern = Core.EntityPattern.forTerms(
          "frameworks",
          "Frameworks",
          "MISC",
          ["React", "Vue", "Angular"]
        );

        const updatedDefinition = definition.addPattern(newPattern);
        expect(updatedDefinition.patternCount).toBe(3);

        const removedDefinition = updatedDefinition.removePattern("frameworks");
        expect(removedDefinition.patternCount).toBe(2);
      }).pipe(Effect.provide(TestLayer)));

    it("should convert to wink-compatible format", () =>
      Effect.gen(function* () {
        const _processor = yield* DP.DocumentProcessorService;
        const pattern1 = Core.EntityPattern.forTerms(
          "companies",
          "Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft"]
        );

        const pattern2 = Core.EntityPattern.forRegex(
          "emails",
          "Email Addresses",
          "EMAIL",
          "\\S+@\\S+\\.\\S+",
          []
        );

        const definition = Core.CustomEntityDefinition.create(
          "test_def",
          "test",
          "1.0.0",
          [pattern1, pattern2]
        );

        const winkFormat = definition.toWinkFormat();

        expect(winkFormat).toHaveLength(2);
        expect(winkFormat[0].name).toBe("Companies");
        expect(winkFormat[0].patterns).toEqual(pattern1.patterns);
        expect(winkFormat[1].name).toBe("Email Addresses");
        expect(winkFormat[1].patterns).toEqual(pattern2.patterns);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Custom Entity Learning and Processing", () => {
    it("should learn custom entities and process text", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        // Create custom entity definition
        const techPattern = Core.EntityPattern.forTerms(
          "tech_companies",
          "Tech Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google", "Meta"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_domain",
          "technology",
          "1.0.0",
          [techPattern]
        );

        // Learn custom entities
        yield* processor.learnCustomEntities(definition);

        // Process text with custom entities
        const testText =
          "Apple and Microsoft are leading tech companies. Google also competes in this space.";
        const document = yield* processor.processWithCustomEntities(
          testText,
          definition
        );

        expect(document.text).toBe(testText);
        expect(document.getEntities().length).toBeGreaterThan(0);

        // Should find the tech companies
        const organizations = pipe(
          document.getEntities(),
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION)
        );

        expect(organizations.length).toBeGreaterThanOrEqual(2);

        const orgNames = organizations.map((org) => org.text).sort();
        expect(orgNames).toContain("Apple");
        expect(orgNames).toContain("Microsoft");
      }).pipe(Effect.provide(TestLayer)));

    it("should extract custom entities with label filtering", () =>
      Effect.gen(function* () {
        const _processor = yield* DP.DocumentProcessorService;

        // Create multi-domain definition
        const techCompanies = Core.EntityPattern.forTerms(
          "tech_companies",
          "Tech Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google"]
        );

        const programmingLangs = Core.EntityPattern.forTerms(
          "programming_languages",
          "Programming Languages",
          "MISC",
          ["TypeScript", "Python", "Rust", "JavaScript"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_domain",
          "technology",
          "1.0.0",
          [techCompanies, programmingLangs]
        );

        const testText =
          "Apple uses TypeScript and Python for development. Microsoft prefers JavaScript and Rust.";

        // Extract only organizations
        const organizations = yield* pipe(
          testText,
          DP.extractCustomEntities(definition, [Core.EntityLabels.ORGANIZATION])
        );

        expect(organizations.length).toBeGreaterThanOrEqual(2);
        organizations.forEach((org) => {
          expect(org.label).toBe("ORGANIZATION");
        });

        // Extract only programming languages (MISC)
        const languages = yield* pipe(
          testText,
          DP.extractCustomEntities(definition, [Core.EntityLabels.MISC])
        );

        expect(languages.length).toBeGreaterThanOrEqual(2);
        languages.forEach((lang) => {
          expect(lang.label).toBe("MISC");
        });

        // Extract all custom entities
        const allEntities = yield* pipe(
          testText,
          DP.extractCustomEntities(definition)
        );

        expect(allEntities.length).toBe(
          organizations.length + languages.length
        );
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Domain-Specific Entity Recognition", () => {
    it("should handle medical domain entities", () =>
      Effect.gen(function* () {
        const conditions = Core.EntityPattern.forTerms(
          "medical_conditions",
          "Medical Conditions",
          "MISC",
          ["diabetes", "hypertension", "asthma", "pneumonia"]
        );

        const medications = Core.EntityPattern.forTerms(
          "medications",
          "Medications",
          "MISC",
          ["aspirin", "metformin", "lisinopril", "albuterol"]
        );

        const professionals = Core.EntityPattern.forTerms(
          "medical_professionals",
          "Medical Professionals",
          "PERSON",
          ["Dr.", "Doctor", "Physician", "Nurse"]
        );

        const medicalDefinition = Core.CustomEntityDefinition.create(
          "medical_domain",
          "healthcare",
          "1.0.0",
          [conditions, medications, professionals],
          {
            description: "Medical terminology recognition",
          }
        );

        const medicalText = `
          Dr. Smith diagnosed the patient with diabetes and prescribed metformin.
          The patient also has hypertension and takes lisinopril daily.
          Nurse Johnson recommended lifestyle changes for asthma management.
        `;

        const entities = yield* pipe(
          medicalText,
          DP.extractCustomEntities(medicalDefinition)
        );

        expect(entities.length).toBeGreaterThan(0);

        // Group by label
        const grouped = pipe(entities, Core.E.groupByLabel);
        const miscEntities = HashMap.get(grouped, "MISC");
        const personEntities = HashMap.get(grouped, "PERSON");

        expect(miscEntities._tag).toBe("Some");
        expect(personEntities._tag).toBe("Some");

        if (miscEntities._tag === "Some") {
          expect(miscEntities.value.length).toBeGreaterThan(0);
        }

        if (personEntities._tag === "Some") {
          expect(personEntities.value.length).toBeGreaterThan(0);
        }
      }).pipe(Effect.provide(TestLayer)));

    it("should handle financial domain entities", () =>
      Effect.gen(function* () {
        const institutions = Core.EntityPattern.forTerms(
          "financial_institutions",
          "Financial Institutions",
          "ORGANIZATION",
          ["Goldman Sachs", "JPMorgan Chase", "Bank of America", "Wells Fargo"]
        );

        const instruments = Core.EntityPattern.forRegex(
          "financial_instruments",
          "Financial Instruments",
          "MISC",
          "\\b(stock|bond|ETF|mutual fund|derivative)s?\\b",
          ["stocks", "bonds", "ETF"]
        );

        const currencies = Core.EntityPattern.forRegex(
          "currencies",
          "Currencies",
          "MONEY",
          "\\b(USD|EUR|GBP|JPY|bitcoin|ethereum)\\b",
          ["USD", "EUR", "bitcoin"]
        );

        const financialDefinition = Core.CustomEntityDefinition.create(
          "financial_domain",
          "finance",
          "1.0.0",
          [institutions, instruments, currencies]
        );

        const financialText = `
          Goldman Sachs reported strong earnings from equity trading.
          The bank increased exposure to bitcoin while reducing bond holdings.
          JPMorgan Chase announced new ETF offerings for institutional clients.
        `;

        const entities = yield* pipe(
          financialText,
          DP.extractCustomEntities(financialDefinition)
        );

        expect(entities.length).toBeGreaterThan(0);

        const organizations = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION)
        );

        const miscEntities = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.MISC)
        );

        expect(organizations.length).toBeGreaterThan(0);
        expect(miscEntities.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty pattern definitions", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        const emptyDefinition = Core.CustomEntityDefinition.create(
          "empty_def",
          "test",
          "1.0.0",
          [] // No patterns
        );

        const validationResult = yield* processor
          .validateEntityDefinition(emptyDefinition)
          .pipe(Effect.either);

        expect(validationResult._tag).toBe("Left");
        if (validationResult._tag === "Left") {
          expect(validationResult.left._tag).toBe("EntityPatternError");
          expect(validationResult.left.message).toContain(
            "must have at least one pattern"
          );
        }
      }).pipe(Effect.provide(TestLayer)));

    it("should handle invalid regex patterns", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        const invalidPattern = Core.EntityPattern.forRegex(
          "invalid_regex",
          "Invalid Regex",
          "MISC",
          "[unclosed bracket", // Invalid regex
          []
        );

        const definition = Core.CustomEntityDefinition.create(
          "invalid_def",
          "test",
          "1.0.0",
          [invalidPattern]
        );

        const validationResult = yield* processor
          .validateEntityDefinition(definition)
          .pipe(Effect.either);

        expect(validationResult._tag).toBe("Left");
        if (validationResult._tag === "Left") {
          expect(validationResult.left._tag).toBe("EntityPatternError");
          expect(validationResult.left.message).toContain(
            "Invalid regex pattern"
          );
        }
      }).pipe(Effect.provide(TestLayer)));

    it("should handle empty text processing", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        const pattern = Core.EntityPattern.forTerms(
          "test_pattern",
          "Test Pattern",
          "MISC",
          ["test"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "test_def",
          "test",
          "1.0.0",
          [pattern]
        );

        // Process empty text
        const document = yield* processor.processWithCustomEntities(
          "",
          definition
        );
        expect(document.text).toBe("");
        expect(document.getEntities()).toHaveLength(0);

        // Extract entities from empty text
        const entities = yield* pipe("", DP.extractCustomEntities(definition));
        expect(entities).toHaveLength(0);
      }).pipe(Effect.provide(TestLayer)));

    it("should handle text with no matching entities", () =>
      Effect.gen(function* () {
        const pattern = Core.EntityPattern.forTerms(
          "tech_companies",
          "Tech Companies",
          "ORGANIZATION",
          ["Apple", "Microsoft", "Google"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_def",
          "technology",
          "1.0.0",
          [pattern]
        );

        const textWithoutMatches =
          "The weather is nice today. I like cats and dogs.";

        const entities = yield* pipe(
          textWithoutMatches,
          DP.extractCustomEntities(definition, [Core.EntityLabels.ORGANIZATION])
        );

        expect(entities).toHaveLength(0);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Performance and Scalability", () => {
    it("should handle large custom entity definitions efficiently", () =>
      Effect.gen(function* () {
        // Create a large definition with many patterns
        const patterns = [];
        for (let i = 0; i < 50; i++) {
          patterns.push(
            Core.EntityPattern.forTerms(
              `pattern_${i}`,
              `Pattern ${i}`,
              "MISC",
              [`term${i}`, `item${i}`, `entity${i}`]
            )
          );
        }

        const largeDefinition = Core.CustomEntityDefinition.create(
          "large_def",
          "test",
          "1.0.0",
          patterns
        );

        expect(largeDefinition.patternCount).toBe(50);

        // Should validate efficiently
        const startTime = Date.now();
        const processor = yield* DP.DocumentProcessorService;
        const validated = yield* processor.validateEntityDefinition(
          largeDefinition
        );
        const endTime = Date.now();

        expect(validated.patternCount).toBe(50);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      }).pipe(Effect.provide(TestLayer)));

    it("should process long text with custom entities efficiently", () =>
      Effect.gen(function* () {
        const pattern = Core.EntityPattern.forTerms(
          "tech_terms",
          "Tech Terms",
          "MISC",
          ["technology", "innovation", "digital", "software", "hardware"]
        );

        const definition = Core.CustomEntityDefinition.create(
          "tech_def",
          "technology",
          "1.0.0",
          [pattern]
        );

        // Create long text with repeated terms
        const longText = Array(100)
          .fill(
            "Technology drives innovation in digital software and hardware solutions."
          )
          .join(" ");

        const startTime = Date.now();
        const entities = yield* pipe(
          longText,
          DP.extractCustomEntities(definition)
        );
        const endTime = Date.now();

        expect(entities.length).toBeGreaterThan(0);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      }).pipe(Effect.provide(TestLayer)));
  });
});
