/**
 * Custom Entity Recognition Example
 *
 * Demonstrates how to use Effect-NLP's custom entity patterns to recognize
 * domain-specific entities in text using the wink-nlp engine.
 *
 * This example shows:
 * - Creating custom entity patterns with different approaches
 * - Validating entity definitions
 * - Learning custom entities
 * - Processing text with custom patterns
 * - Extracting specific entity types
 *
 * @since 2.0.0
 */

import { Effect, pipe, Console } from "effect";
import * as NLP from "../NLP/index.js";
import { DocumentProcessingLive } from "../NLP/DocumentProcessorLive.js";

// =============================================================================
// Example 1: Technology Company Recognition
// =============================================================================

const createTechCompanyPatterns = () => {
  // Create patterns for recognizing technology companies
  const techCompanies = NLP.Core.EntityPattern.forTerms(
    "tech_companies",
    "Technology Companies",
    "ORGANIZATION",
    [
      "Apple",
      "Microsoft",
      "Google",
      "Amazon",
      "Meta",
      "Tesla",
      "Netflix",
      "Adobe",
      "Salesforce",
      "Oracle",
    ]
  );

  // Create patterns for programming languages as MISC entities
  const programmingLanguages = NLP.Core.EntityPattern.forTerms(
    "programming_languages",
    "Programming Languages",
    "MISC",
    ["TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "C++", "Swift"]
  );

  // Create pattern for software products using regex
  const softwareProducts = NLP.Core.EntityPattern.forRegex(
    "software_products",
    "Software Products",
    "MISC",
    "\\b(VS Code|Visual Studio|IntelliJ|WebStorm|Docker|Kubernetes|React|Vue|Angular)\\b",
    ["VS Code", "Visual Studio", "Docker", "React"]
  );

  return [techCompanies, programmingLanguages, softwareProducts];
};

const techEntityExample = Effect.gen(function* () {
  yield* Console.log("=== Technology Entity Recognition ===");

  // Create custom entity definition for technology domain
  const patterns = createTechCompanyPatterns();
  const definition = yield* NLP.DocumentProcessor.createCustomEntityDefinition(
    "tech_domain",
    "technology",
    "1.0.0",
    patterns,
    {
      description: "Recognition patterns for technology companies and products",
      config: NLP.Core.CustomEntityConfig.create({
        matchValue: false,
        usePOS: true,
        useEntity: true,
      }),
    }
  );

  yield* Console.log(
    `Created definition with ${definition.patternCount} patterns`
  );

  // Sample text about technology
  const techText = `
    Apple and Microsoft are leading tech companies. Google's TypeScript team 
    works on VS Code integration with React. Tesla uses Python for their 
    autonomous driving systems, while Netflix relies on Java and Docker 
    for their streaming platform.
  `;

  // Process text with custom entities
  const document = yield* pipe(
    techText,
    NLP.DocumentProcessor.processWithCustomEntities(definition)
  );

  yield* Console.log(
    `Processed document with ${document.getEntities().length} entities`
  );

  // Extract and filter entities using Effect-style operations
  const allEntities = document.getEntities();

  // Use branded entity labels for type-safe filtering
  const techOrgs = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.ORGANIZATION)
  );

  const techMisc = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.MISC)
  );

  yield* Console.log("Technology Organizations found:");
  yield* Effect.forEach(techOrgs, (org) =>
    Console.log(`  - ${org.text} (${org.label})`)
  );

  yield* Console.log("Technology Products/Languages found:");
  yield* Effect.forEach(techMisc, (misc) =>
    Console.log(`  - ${misc.text} (${misc.label})`)
  );

  return { document, techOrgs, techMisc };
});

// =============================================================================
// Example 2: Medical Domain Recognition
// =============================================================================

const createMedicalPatterns = () => {
  // Medical conditions pattern
  const conditions = NLP.Core.EntityPattern.create(
    "medical_conditions",
    "Medical Conditions",
    "MISC",
    [
      "\\b(diabetes|hypertension|asthma|pneumonia|bronchitis)\\b",
      "\\b(heart disease|kidney disease|liver disease)\\b",
      "\\b(COVID-19|influenza|tuberculosis)\\b",
    ],
    {
      examples: ["diabetes", "heart disease", "COVID-19"],
      priority: 8,
    }
  );

  // Medication patterns
  const medications = NLP.Core.EntityPattern.forRegex(
    "medications",
    "Medications",
    "MISC",
    "\\b(aspirin|ibuprofen|acetaminophen|metformin|lisinopril|amoxicillin)\\b",
    ["aspirin", "metformin", "amoxicillin"]
  );

  // Medical professionals
  const professionals = NLP.Core.EntityPattern.forTerms(
    "medical_professionals",
    "Medical Professionals",
    "PERSON",
    [
      "Dr.",
      "Doctor",
      "Nurse",
      "Physician",
      "Surgeon",
      "Cardiologist",
      "Neurologist",
    ]
  );

  return [conditions, medications, professionals];
};

const medicalEntityExample = Effect.gen(function* () {
  yield* Console.log("\n=== Medical Domain Entity Recognition ===");

  const patterns = createMedicalPatterns();
  const definition = yield* NLP.DocumentProcessor.createCustomEntityDefinition(
    "medical_domain",
    "healthcare",
    "1.0.0",
    patterns,
    {
      description: "Medical terminology recognition patterns",
      config: NLP.Core.CustomEntityConfig.create({
        matchValue: false,
        usePOS: true,
        useEntity: true,
      }),
    }
  );

  const medicalText = `
    Dr. Smith diagnosed the patient with diabetes and prescribed metformin.
    The patient also has a history of hypertension and takes lisinopril daily.
    During the consultation, the physician recommended lifestyle changes
    and prescribed aspirin for heart disease prevention.
  `;

  // Process text and extract entities using Effect-style operations
  const document = yield* pipe(
    medicalText,
    NLP.DocumentProcessor.processWithCustomEntities(definition)
  );

  const allEntities = document.getEntities();

  // Group entities by type for better organization
  const entityGroups = pipe(allEntities, NLP.Core.E.groupByLabel);

  yield* Console.log("Medical entities found:");
  yield* Effect.forEach(allEntities, (entity) =>
    Console.log(`  - ${entity.text} (${entity.label})`)
  );

  return { definition, entities: allEntities, entityGroups };
});

// =============================================================================
// Example 3: Financial Domain Recognition
// =============================================================================

const createFinancialPatterns = () => {
  // Financial institutions
  const institutions = NLP.Core.EntityPattern.forTerms(
    "financial_institutions",
    "Financial Institutions",
    "ORGANIZATION",
    [
      "Goldman Sachs",
      "JPMorgan Chase",
      "Bank of America",
      "Wells Fargo",
      "Morgan Stanley",
      "Citigroup",
      "Federal Reserve",
    ]
  );

  // Financial instruments
  const instruments = NLP.Core.EntityPattern.create(
    "financial_instruments",
    "Financial Instruments",
    "MISC",
    [
      "\\b(stock|bond|ETF|mutual fund|derivative|option|future)s?\\b",
      "\\b(equity|debt|security|portfolio|asset)\\b",
      "\\b(S&P 500|NASDAQ|NYSE|Dow Jones)\\b",
    ],
    {
      examples: ["stocks", "bonds", "S&P 500"],
      priority: 7,
    }
  );

  // Currency patterns (enhanced MONEY detection)
  const currencies = NLP.Core.EntityPattern.forRegex(
    "currencies",
    "Currencies",
    "MONEY",
    "\\b(USD|EUR|GBP|JPY|CHF|CAD|AUD|bitcoin|ethereum)\\b",
    ["USD", "EUR", "bitcoin"]
  );

  return [institutions, instruments, currencies];
};

const financialEntityExample = Effect.gen(function* () {
  yield* Console.log("\n=== Financial Domain Entity Recognition ===");

  const patterns = createFinancialPatterns();
  const definition = yield* NLP.DocumentProcessor.createCustomEntityDefinition(
    "financial_domain",
    "finance",
    "1.0.0",
    patterns,
    {
      description: "Financial terminology and institution recognition",
      config: NLP.Core.CustomEntityConfig.create({
        matchValue: false,
        usePOS: true,
        useEntity: true,
      }),
    }
  );

  const financialText = `
    Goldman Sachs reported strong quarterly earnings from their equity trading division.
    The S&P 500 reached new highs as investors moved funds from bonds to stocks.
    JPMorgan Chase increased their bitcoin holdings while the Federal Reserve
    announced new monetary policy affecting USD exchange rates.
  `;

  // Process and extract financial entities
  const document = yield* pipe(
    financialText,
    NLP.DocumentProcessor.processWithCustomEntities(definition)
  );

  const stats = yield* NLP.DocumentProcessor.getStats(document);
  yield* Console.log(
    `Document stats: ${stats.tokenCount} tokens, ${stats.entityCount} entities`
  );

  // Use Effect-style entity operations with type inference
  const allEntities = document.getEntities();

  const organizations = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.ORGANIZATION),
    NLP.Core.E.sortByPosition
  );

  const financialTerms = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.MISC),
    NLP.Core.E.sortByPosition
  );

  const currencies = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.MONEY),
    NLP.Core.E.sortByPosition
  );

  yield* Console.log("Financial Organizations:");
  yield* Effect.forEach(organizations, (org) => Console.log(`  - ${org.text}`));

  yield* Console.log("Financial Instruments:");
  yield* Effect.forEach(financialTerms, (term) =>
    Console.log(`  - ${term.text}`)
  );

  yield* Console.log("Currencies:");
  yield* Effect.forEach(currencies, (currency) =>
    Console.log(`  - ${currency.text}`)
  );

  return { document, organizations, financialTerms, currencies };
});

// =============================================================================
// Example 4: Pattern Validation and Error Handling
// =============================================================================

const patternValidationExample = Effect.gen(function* () {
  yield* Console.log("\n=== Pattern Validation Example ===");

  // Create a pattern with invalid regex to demonstrate validation
  const invalidPattern = Effect.try({
    try: () =>
      NLP.Core.EntityPattern.create(
        "invalid_pattern",
        "Invalid Pattern",
        "MISC",
        ["[invalid regex pattern"] // Missing closing bracket
      ),
    catch: (error) =>
      new NLP.Core.EntityPatternError({
        message: `Failed to create pattern: ${error}`,
      }),
  });

  // Handle the validation error
  const validationResult = yield* pipe(
    invalidPattern,
    Effect.flatMap((pattern) => {
      const definition = NLP.Core.CustomEntityDefinition.create(
        "test_invalid",
        "test",
        "1.0.0",
        [pattern]
      );
      return NLP.DocumentProcessor.validateEntityDefinition(definition);
    }),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Console.log(`Validation failed as expected: ${error}`);
        return null;
      })
    )
  );

  if (validationResult === null) {
    yield* Console.log("✓ Pattern validation correctly caught invalid regex");
  }

  // Create a valid pattern to show successful validation
  const validPattern = NLP.Core.EntityPattern.forTerms(
    "valid_pattern",
    "Valid Pattern",
    "MISC",
    ["example", "test", "valid"]
  );

  const validDefinition = NLP.Core.CustomEntityDefinition.create(
    "test_valid",
    "test",
    "1.0.0",
    [validPattern]
  );

  const validatedDefinition =
    yield* NLP.DocumentProcessor.validateEntityDefinition(validDefinition);
  yield* Console.log(
    `✓ Valid definition has ${validatedDefinition.patternCount} patterns`
  );

  return validatedDefinition;
});

// =============================================================================
// Main Program
// =============================================================================

const customEntityProgram = Effect.gen(function* () {
  yield* Console.log("Custom Entity Recognition Examples\n");

  // Run all examples
  yield* techEntityExample;
  yield* medicalEntityExample;
  yield* financialEntityExample;
  yield* patternValidationExample;

  yield* Console.log("\n=== Custom Entity Examples Complete ===");
});

// Export the program for execution
export const program = customEntityProgram.pipe(
  Effect.provide(DocumentProcessingLive),
  Effect.runPromise
);

// Self-executing example (uncomment to run directly)
// Effect.runPromise(program).then(
//   () => console.log("✓ Custom entity examples completed successfully"),
//   (error) => console.error("✗ Example failed:", error)
// );
