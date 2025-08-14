/**
 * Unit tests for Effect-style entity operations with branded types
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, pipe, HashMap, Option } from "effect";
import * as Core from "../../src/NLP/Core.js";

describe("EntityOperations", () => {
  // Test data setup
  const createTestEntities = () => {
    const apple = Core.Entity.create(
      "e1",
      "Apple Inc.",
      "ORGANIZATION",
      0,
      10,
      ["t1", "t2"]
    );
    
    const timCook = Core.Entity.create(
      "e2", 
      "Tim Cook",
      "PERSON",
      15,
      23,
      ["t3", "t4"]
    );
    
    const cupertino = Core.Entity.create(
      "e3",
      "Cupertino",
      "LOCATION", 
      28,
      37,
      ["t5"]
    );
    
    const money = Core.Entity.create(
      "e4",
      "$50 billion",
      "MONEY",
      42,
      53,
      ["t6", "t7"]
    );
    
    const percent = Core.Entity.create(
      "e5",
      "25%",
      "PERCENT",
      58,
      61,
      ["t8"]
    );

    const customTech = Core.Entity.create(
      "e6",
      "AI Assistant",
      "CUSTOM_TECH" as any,
      66,
      78,
      ["t9", "t10"]
    );

    return [apple, timCook, cupertino, money, percent, customTech];
  };

  describe("filterByLabel", () => {
    it("should filter entities by specific label with type narrowing", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const organizations = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION)
        );
        
        expect(organizations).toHaveLength(1);
        expect(organizations[0].text).toBe("Apple Inc.");
        expect(organizations[0].label).toBe("ORGANIZATION");
        
        // Type should be narrowed to Entity & { label: OrganizationLabel }
        const orgLabel: string = organizations[0].label;
        expect(orgLabel).toBe("ORGANIZATION");
      }));

    it("should return empty array for non-existent labels", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const emails = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.EMAIL)
        );
        
        expect(emails).toHaveLength(0);
      }));

    it("should handle custom entity labels", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const techEntities = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.custom("TECH"))
        );
        
        expect(techEntities).toHaveLength(1);
        expect(techEntities[0].text).toBe("AI Assistant");
        expect(techEntities[0].label).toBe("CUSTOM_TECH");
      }));
  });

  describe("filterByLabels", () => {
    it("should filter entities by multiple labels", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const businessEntities = pipe(
          entities,
          Core.E.filterByLabels([
            Core.EntityLabels.ORGANIZATION,
            Core.EntityLabels.PERSON,
            Core.EntityLabels.MONEY
          ])
        );
        
        expect(businessEntities).toHaveLength(3);
        
        const labels = businessEntities.map(e => e.label).sort();
        expect(labels).toEqual(["MONEY", "ORGANIZATION", "PERSON"]);
      }));

    it("should return empty array when no labels match", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const noMatch = pipe(
          entities,
          Core.E.filterByLabels([
            Core.EntityLabels.EMAIL,
            Core.EntityLabels.URL
          ])
        );
        
        expect(noMatch).toHaveLength(0);
      }));
  });

  describe("filterStandard", () => {
    it("should filter only standard entity types", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const standardEntities = pipe(entities, Core.E.filterStandard);
        
        expect(standardEntities).toHaveLength(5);
        
        // Should not include custom entities
        const hasCustom = standardEntities.some(e => e.label.startsWith("CUSTOM_"));
        expect(hasCustom).toBe(false);
      }));
  });

  describe("filterCustom", () => {
    it("should filter only custom entity types", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const customEntities = pipe(entities, Core.E.filterCustom);
        
        expect(customEntities).toHaveLength(1);
        expect(customEntities[0].text).toBe("AI Assistant");
        expect(customEntities[0].label).toBe("CUSTOM_TECH");
      }));

    it("should return empty array when no custom entities exist", () =>
      Effect.sync(() => {
        const entities = createTestEntities().slice(0, 5); // Remove custom entity
        
        const customEntities = pipe(entities, Core.E.filterCustom);
        
        expect(customEntities).toHaveLength(0);
      }));
  });

  describe("filterByDomain", () => {
    it("should filter custom entities by domain", () =>
      Effect.sync(() => {
        const entities = [
          ...createTestEntities(),
          Core.Entity.create("e7", "Medical Device", "CUSTOM_MEDICAL" as any, 80, 94, ["t11", "t12"]),
          Core.Entity.create("e8", "Financial Report", "CUSTOM_FINANCE" as any, 95, 110, ["t13", "t14"])
        ];
        
        const techEntities = pipe(entities, Core.E.filterByDomain("TECH"));
        const medicalEntities = pipe(entities, Core.E.filterByDomain("MEDICAL"));
        const financeEntities = pipe(entities, Core.E.filterByDomain("FINANCE"));
        
        expect(techEntities).toHaveLength(1);
        expect(techEntities[0].text).toBe("AI Assistant");
        
        expect(medicalEntities).toHaveLength(1);
        expect(medicalEntities[0].text).toBe("Medical Device");
        
        expect(financeEntities).toHaveLength(1);
        expect(financeEntities[0].text).toBe("Financial Report");
      }));
  });

  describe("groupByLabel", () => {
    it("should group entities by their labels", () =>
      Effect.sync(() => {
        const entities = [
          ...createTestEntities(),
          Core.Entity.create("e7", "Microsoft", "ORGANIZATION", 80, 89, ["t11"])
        ];
        
        const grouped = pipe(entities, Core.E.groupByLabel);
        
        expect(HashMap.size(grouped)).toBe(6); // 6 unique labels
        
        const organizations = HashMap.get(grouped, "ORGANIZATION");
        expect(Option.isSome(organizations)).toBe(true);
        if (Option.isSome(organizations)) {
          expect(organizations.value).toHaveLength(2);
          const orgNames = organizations.value.map(e => e.text).sort();
          expect(orgNames).toEqual(["Apple Inc.", "Microsoft"]);
        }
      }));
  });

  describe("findByLabel", () => {
    it("should find first entity with specific label", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const firstOrg = pipe(
          entities,
          Core.E.findByLabel(Core.EntityLabels.ORGANIZATION)
        );
        
        expect(Option.isSome(firstOrg)).toBe(true);
        if (Option.isSome(firstOrg)) {
          expect(firstOrg.value.text).toBe("Apple Inc.");
          expect(firstOrg.value.label).toBe("ORGANIZATION");
        }
      }));

    it("should return None when label not found", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const notFound = pipe(
          entities,
          Core.E.findByLabel(Core.EntityLabels.EMAIL)
        );
        
        expect(Option.isNone(notFound)).toBe(true);
      }));
  });

  describe("hasLabel", () => {
    it("should return true when label exists", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const hasPerson = pipe(
          entities,
          Core.E.hasLabel(Core.EntityLabels.PERSON)
        );
        
        expect(hasPerson).toBe(true);
      }));

    it("should return false when label does not exist", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const hasEmail = pipe(
          entities,
          Core.E.hasLabel(Core.EntityLabels.EMAIL)
        );
        
        expect(hasEmail).toBe(false);
      }));
  });

  describe("countByLabel", () => {
    it("should count entities by label", () =>
      Effect.sync(() => {
        const entities = [
          ...createTestEntities(),
          Core.Entity.create("e7", "Microsoft", "ORGANIZATION", 80, 89, ["t11"]),
          Core.Entity.create("e8", "Satya Nadella", "PERSON", 90, 103, ["t12", "t13"])
        ];
        
        const counts = pipe(entities, Core.E.countByLabel);
        
        expect(HashMap.get(counts, "ORGANIZATION")).toEqual(Option.some(2));
        expect(HashMap.get(counts, "PERSON")).toEqual(Option.some(2));
        expect(HashMap.get(counts, "LOCATION")).toEqual(Option.some(1));
        expect(HashMap.get(counts, "MONEY")).toEqual(Option.some(1));
        expect(HashMap.get(counts, "PERCENT")).toEqual(Option.some(1));
        expect(HashMap.get(counts, "CUSTOM_TECH")).toEqual(Option.some(1));
      }));
  });

  describe("getUniqueLabels", () => {
    it("should return unique labels from entities", () =>
      Effect.sync(() => {
        const entities = [
          ...createTestEntities(),
          Core.Entity.create("e7", "Microsoft", "ORGANIZATION", 80, 89, ["t11"])
        ];
        
        const uniqueLabels = pipe(entities, Core.E.getUniqueLabels);
        
        expect(uniqueLabels).toHaveLength(6);
        expect(uniqueLabels.sort()).toEqual([
          "CUSTOM_TECH", "LOCATION", "MONEY", "ORGANIZATION", "PERCENT", "PERSON"
        ]);
      }));
  });

  describe("filterByTextPattern", () => {
    it("should filter entities by regex pattern", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const moneyPattern = /\$[\d.,]+/;
        const moneyEntities = pipe(entities, Core.E.filterByTextPattern(moneyPattern));
        
        expect(moneyEntities).toHaveLength(1);
        expect(moneyEntities[0].text).toBe("$50 billion");
      }));

    it("should filter entities by word pattern", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const wordPattern = /\b\w+\s+Inc\./;
        const incEntities = pipe(entities, Core.E.filterByTextPattern(wordPattern));
        
        expect(incEntities).toHaveLength(1);
        expect(incEntities[0].text).toBe("Apple Inc.");
      }));
  });

  describe("filterByTextLength", () => {
    it("should filter entities by minimum text length", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const longEntities = pipe(entities, Core.E.filterByTextLength(8));
        
        expect(longEntities).toHaveLength(3);
        const texts = longEntities.map(e => e.text).sort();
        expect(texts).toEqual(["AI Assistant", "Apple Inc.", "Cupertino"]);
      }));

    it("should filter entities by text length range", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const mediumEntities = pipe(entities, Core.E.filterByTextLength(3, 10));
        
        expect(mediumEntities).toHaveLength(4);
        const texts = mediumEntities.map(e => e.text).sort();
        expect(texts).toEqual(["25%", "Cupertino", "Tim Cook"]);
      }));
  });

  describe("sortByPosition", () => {
    it("should sort entities by character position", () =>
      Effect.sync(() => {
        const entities = createTestEntities().reverse(); // Start with reversed order
        
        const sorted = pipe(entities, Core.E.sortByPosition);
        
        const positions = sorted.map(e => e.offset.char.start);
        expect(positions).toEqual([0, 15, 28, 42, 58, 66]);
        
        const texts = sorted.map(e => e.text);
        expect(texts).toEqual([
          "Apple Inc.", "Tim Cook", "Cupertino", "$50 billion", "25%", "AI Assistant"
        ]);
      }));
  });

  describe("sortByTextLength", () => {
    it("should sort entities by text length", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        const sorted = pipe(entities, Core.E.sortByTextLength);
        
        const lengths = sorted.map(e => e.text.length);
        expect(lengths).toEqual([3, 8, 9, 10, 11, 12]); // Sorted by length
        
        const texts = sorted.map(e => e.text);
        expect(texts).toEqual([
          "25%", "Tim Cook", "Cupertino", "Apple Inc.", "$50 billion", "AI Assistant"
        ]);
      }));
  });

  describe("Composition and Chaining", () => {
    it("should allow complex operation chaining", () =>
      Effect.sync(() => {
        const entities = [
          ...createTestEntities(),
          Core.Entity.create("e7", "Microsoft Corporation", "ORGANIZATION", 100, 121, ["t15", "t16"]),
          Core.Entity.create("e8", "Google LLC", "ORGANIZATION", 122, 132, ["t17", "t18"]),
          Core.Entity.create("e9", "Jeff Bezos", "PERSON", 133, 143, ["t19", "t20"])
        ];
        
        // Complex pipeline: filter organizations, sort by position, filter by length
        const result = pipe(
          entities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION),
          Core.E.sortByPosition,
          Core.E.filterByTextLength(10) // Only orgs with names >= 10 chars
        );
        
        expect(result).toHaveLength(2);
        expect(result[0].text).toBe("Apple Inc."); // Position 0, length 10
        expect(result[1].text).toBe("Microsoft Corporation"); // Position 100, length 20
      }));

    it("should work with functional composition patterns", () =>
      Effect.sync(() => {
        const entities = createTestEntities();
        
        // Create reusable filters
        const isBusinessEntity = (entities: ReadonlyArray<Core.Entity>) =>
          pipe(
            entities,
            Core.E.filterByLabels([
              Core.EntityLabels.ORGANIZATION,
              Core.EntityLabels.PERSON,
              Core.EntityLabels.MONEY
            ])
          );
        
        const sortedByPosition = Core.E.sortByPosition;
        
        // Compose operations
        const businessEntitiesSorted = pipe(
          entities,
          isBusinessEntity,
          sortedByPosition
        );
        
        expect(businessEntitiesSorted).toHaveLength(3);
        expect(businessEntitiesSorted[0].text).toBe("Apple Inc.");
        expect(businessEntitiesSorted[1].text).toBe("Tim Cook");
        expect(businessEntitiesSorted[2].text).toBe("$50 billion");
      }));
  });

  describe("Edge Cases", () => {
    it("should handle empty entity arrays", () =>
      Effect.sync(() => {
        const emptyEntities: ReadonlyArray<Core.Entity> = [];
        
        const filtered = pipe(emptyEntities, Core.E.filterByLabel(Core.EntityLabels.PERSON));
        const grouped = pipe(emptyEntities, Core.E.groupByLabel);
        const counts = pipe(emptyEntities, Core.E.countByLabel);
        const unique = pipe(emptyEntities, Core.E.getUniqueLabels);
        const sorted = pipe(emptyEntities, Core.E.sortByPosition);
        
        expect(filtered).toHaveLength(0);
        expect(HashMap.size(grouped)).toBe(0);
        expect(HashMap.size(counts)).toBe(0);
        expect(unique).toHaveLength(0);
        expect(sorted).toHaveLength(0);
      }));

    it("should handle single entity arrays", () =>
      Effect.sync(() => {
        const singleEntity = [createTestEntities()[0]];
        
        const filtered = pipe(singleEntity, Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION));
        const grouped = pipe(singleEntity, Core.E.groupByLabel);
        const sorted = pipe(singleEntity, Core.E.sortByPosition);
        
        expect(filtered).toHaveLength(1);
        expect(HashMap.size(grouped)).toBe(1);
        expect(sorted).toHaveLength(1);
      }));

    it("should maintain immutability", () =>
      Effect.sync(() => {
        const originalEntities = createTestEntities();
        const originalLength = originalEntities.length;
        
        // Perform various operations
        pipe(originalEntities, Core.E.filterByLabel(Core.EntityLabels.PERSON));
        pipe(originalEntities, Core.E.sortByPosition);
        pipe(originalEntities, Core.E.filterByTextLength(5));
        
        // Original array should be unchanged
        expect(originalEntities).toHaveLength(originalLength);
        expect(originalEntities[0].text).toBe("Apple Inc.");
      }));
  });
});
