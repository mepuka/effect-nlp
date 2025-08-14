/**
 * Typed Entity API Demonstration
 *
 * Shows the new Effect-style entity operations with branded types and type inference.
 * Demonstrates how to avoid imperative loops and use functional composition.
 *
 * @since 2.0.0
 */

import { Effect, pipe, Console } from "effect";
import * as NLP from "../NLP/index.js";
import { DocumentProcessingLive } from "../NLP/DocumentProcessorLive.js";

// =============================================================================
// Demonstration of Effect-Style Entity Operations
// =============================================================================

const typedEntityDemo = Effect.gen(function* () {
  yield* Console.log("=== Typed Entity API Demonstration ===\n");

  // Sample text with various entity types
  const sampleText = `
    Apple Inc. and Microsoft Corporation are major tech companies based in California.
    CEO Tim Cook announced a $50 billion investment plan on January 15, 2024.
    The meeting will be held at 3:00 PM PST. Contact info@apple.com for details.
    Visit https://apple.com or call +1-800-APL-CARE for more information.
  `;

  // Process the text
  const document = yield* NLP.DocumentProcessor.process(sampleText);
  const allEntities = document.getEntities();

  yield* Console.log(`Found ${allEntities.length} entities total\n`);

  // =============================================================================
  // Example 1: Type-Safe Entity Filtering with Branded Types
  // =============================================================================

  yield* Console.log("1. Type-Safe Entity Filtering:");

  // Filter organizations with compile-time type safety
  const organizations = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.ORGANIZATION)
  );
  // Type: ReadonlyArray<Entity & { label: OrganizationLabel }>

  const _persons = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.PERSON)
  );

  const money = pipe(
    allEntities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.MONEY)
  );

  yield* Console.log(`  Organizations: ${organizations.length}`);
  yield* Effect.forEach(organizations, (org) =>
    Console.log(`    - ${org.text} (confidence: type-safe!)`)
  );

  yield* Console.log(`  Money entities: ${money.length}`);
  yield* Effect.forEach(money, (m) => Console.log(`    - ${m.text}`));

  // =============================================================================
  // Example 2: Functional Composition (No Imperative Loops)
  // =============================================================================

  yield* Console.log(
    "\n2. Functional Composition - Entity Processing Pipeline:"
  );

  const processedEntities = pipe(
    allEntities,
    // Filter by multiple types
    NLP.Core.E.filterByLabels([
      NLP.Core.EntityLabels.ORGANIZATION,
      NLP.Core.EntityLabels.MONEY,
      NLP.Core.EntityLabels.DATE,
    ]),
    // Sort by position in text
    NLP.Core.E.sortByPosition,
    // Filter by text length (get substantial entities)
    NLP.Core.E.filterByTextLength(3)
  );

  yield* Console.log(
    `  Filtered and sorted entities: ${processedEntities.length}`
  );
  yield* Effect.forEach(processedEntities, (entity) =>
    Console.log(
      `    - "${entity.text}" (${entity.label}) at position ${entity.offset.char.start}`
    )
  );

  // =============================================================================
  // Example 3: Entity Analysis with HashMap Operations
  // =============================================================================

  yield* Console.log("\n3. Entity Analysis:");

  // Group entities by label
  const _entityGroups = pipe(allEntities, NLP.Core.E.groupByLabel);

  // Count entities by label
  const entityCounts = pipe(allEntities, NLP.Core.E.countByLabel);

  // Get unique labels
  const uniqueLabels = pipe(allEntities, NLP.Core.E.getUniqueLabels);

  yield* Console.log(`  Unique entity types found: ${uniqueLabels.length}`);
  yield* Console.log(`  Entity types: ${uniqueLabels.join(", ")}`);

  // Display counts using HashMap operations
  yield* Console.log("  Entity counts:");
  const countEntries = Array.from(entityCounts);
  yield* Effect.forEach(countEntries, ([label, count]) =>
    Console.log(`    - ${label}: ${count}`)
  );

  // =============================================================================
  // Example 4: Advanced Pattern Matching
  // =============================================================================

  yield* Console.log("\n4. Advanced Pattern Matching:");

  // Find entities matching text patterns
  const emailPattern = /\S+@\S+\.\S+/;
  const urlPattern = /https?:\/\/\S+/;
  const phonePattern = /\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;

  const emailEntities = pipe(
    allEntities,
    NLP.Core.E.filterByTextPattern(emailPattern)
  );

  const urlEntities = pipe(
    allEntities,
    NLP.Core.E.filterByTextPattern(urlPattern)
  );

  const _phoneEntities = pipe(
    allEntities,
    NLP.Core.E.filterByTextPattern(phonePattern)
  );

  yield* Console.log(`  Email-like entities: ${emailEntities.length}`);
  yield* Effect.forEach(emailEntities, (entity) =>
    Console.log(`    - ${entity.text} (${entity.label})`)
  );

  yield* Console.log(`  URL-like entities: ${urlEntities.length}`);
  yield* Effect.forEach(urlEntities, (entity) =>
    Console.log(`    - ${entity.text} (${entity.label})`)
  );

  // =============================================================================
  // Example 5: Option-Based Entity Search
  // =============================================================================

  yield* Console.log("\n5. Option-Based Entity Search:");

  // Find first organization (returns Option)
  const firstOrg = pipe(
    allEntities,
    NLP.Core.E.findByLabel(NLP.Core.EntityLabels.ORGANIZATION)
  );

  // Check if specific entity type exists
  const hasDateEntities = pipe(
    allEntities,
    NLP.Core.E.hasLabel(NLP.Core.EntityLabels.DATE)
  );

  const hasPersonEntities = pipe(
    allEntities,
    NLP.Core.E.hasLabel(NLP.Core.EntityLabels.PERSON)
  );

  if (firstOrg._tag === "Some") {
    yield* Console.log(`  First organization found: "${firstOrg.value.text}"`);
  } else {
    yield* Console.log("  No organizations found");
  }

  yield* Console.log(`  Has date entities: ${hasDateEntities}`);
  yield* Console.log(`  Has person entities: ${hasPersonEntities}`);

  // =============================================================================
  // Example 6: Custom Entity Labels (Branded Types)
  // =============================================================================

  yield* Console.log("\n6. Custom Entity Labels:");

  // Create custom entity labels for specific domains
  const techLabel = NLP.Core.EntityLabels.custom("TECH");
  const financeLabel = NLP.Core.EntityLabels.custom("FINANCE");

  yield* Console.log(`  Tech domain label: ${techLabel}`);
  yield* Console.log(`  Finance domain label: ${financeLabel}`);

  // These are type-safe and can be used in filtering operations
  // const techEntities = pipe(allEntities, NLP.Core.E.filterByLabel(techLabel));

  yield* Console.log("\n✓ Typed Entity API demonstration completed!");

  return {
    totalEntities: allEntities.length,
    organizations: organizations.length,
    processedEntities: processedEntities.length,
    uniqueLabels: uniqueLabels.length,
    hasDateEntities,
    hasPersonEntities,
  };
});

// =============================================================================
// Comparison: Old Imperative vs New Functional Style
// =============================================================================

const comparisonDemo = Effect.gen(function* () {
  yield* Console.log("\n=== Imperative vs Functional Style Comparison ===\n");

  const sampleText =
    "Apple, Microsoft, and Google are tech companies. John works at Meta.";
  const document = yield* NLP.DocumentProcessor.process(sampleText);
  const entities = document.getEntities();

  yield* Console.log("OLD IMPERATIVE STYLE (❌ Avoid):");
  yield* Console.log("```typescript");
  yield* Console.log("// Imperative loops and mutations");
  yield* Console.log("const orgs = [];");
  yield* Console.log("for (const entity of entities) {");
  yield* Console.log("  if (entity.label === 'ORGANIZATION') {");
  yield* Console.log("    orgs.push(entity);");
  yield* Console.log("  }");
  yield* Console.log("}");
  yield* Console.log(
    "orgs.sort((a, b) => a.offset.char.start - b.offset.char.start);"
  );
  yield* Console.log("```\n");

  yield* Console.log("NEW FUNCTIONAL STYLE (✅ Preferred):");
  yield* Console.log("```typescript");
  yield* Console.log("// Functional composition with type safety");
  yield* Console.log("const orgs = pipe(");
  yield* Console.log("  entities,");
  yield* Console.log(
    "  E.filterByLabel(EntityLabels.ORGANIZATION('ORGANIZATION')),"
  );
  yield* Console.log("  E.sortByPosition");
  yield* Console.log(");");
  yield* Console.log("```\n");

  // Demonstrate the functional approach
  const orgs = pipe(
    entities,
    NLP.Core.E.filterByLabel(NLP.Core.EntityLabels.ORGANIZATION),
    NLP.Core.E.sortByPosition
  );

  yield* Console.log("Results (functional approach):");
  yield* Effect.forEach(orgs, (org) =>
    Console.log(`  - ${org.text} at position ${org.offset.char.start}`)
  );

  yield* Console.log("\n✓ Functional style provides:");
  yield* Console.log("  • Type safety with branded labels");
  yield* Console.log("  • Immutable operations");
  yield* Console.log("  • Composable transformations");
  yield* Console.log("  • No imperative loops");
  yield* Console.log("  • Better readability and maintainability");
});

// =============================================================================
// Main Program
// =============================================================================

const program = Effect.gen(function* () {
  yield* typedEntityDemo;
  yield* comparisonDemo;
});

// Export the program for execution
export const typedApiDemo = program.pipe(
  Effect.provide(DocumentProcessingLive),
  Effect.runPromise
);

// Self-executing example (uncomment to run directly)
// Effect.runPromise(typedApiDemo).then(
//   () => console.log("✓ Typed Entity API demo completed successfully"),
//   (error) => console.error("✗ Demo failed:", error)
// );
