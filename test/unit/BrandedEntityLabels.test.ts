/**
 * Unit tests for branded entity label system and type safety
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect } from "effect";
import * as Core from "../../src/NLP/Core.js";

describe("Branded Entity Labels", () => {
  describe("EntityLabels Constructors", () => {
    it("should create standard entity labels", () =>
      Effect.sync(() => {
        const personLabel = Core.EntityLabels.PERSON;
        const orgLabel = Core.EntityLabels.ORGANIZATION;
        const locationLabel = Core.EntityLabels.LOCATION;
        const dateLabel = Core.EntityLabels.DATE;
        const timeLabel = Core.EntityLabels.TIME;
        const moneyLabel = Core.EntityLabels.MONEY;
        const percentLabel = Core.EntityLabels.PERCENT;
        const emailLabel = Core.EntityLabels.EMAIL;
        const urlLabel = Core.EntityLabels.URL;
        const phoneLabel = Core.EntityLabels.PHONE;
        const miscLabel = Core.EntityLabels.MISC;

        expect(personLabel).toBe("PERSON");
        expect(orgLabel).toBe("ORGANIZATION");
        expect(locationLabel).toBe("LOCATION");
        expect(dateLabel).toBe("DATE");
        expect(timeLabel).toBe("TIME");
        expect(moneyLabel).toBe("MONEY");
        expect(percentLabel).toBe("PERCENT");
        expect(emailLabel).toBe("EMAIL");
        expect(urlLabel).toBe("URL");
        expect(phoneLabel).toBe("PHONE");
        expect(miscLabel).toBe("MISC");
      }));

    it("should create custom entity labels", () =>
      Effect.sync(() => {
        const techLabel = Core.EntityLabels.custom("TECH");
        const medicalLabel = Core.EntityLabels.custom("MEDICAL");
        const financeLabel = Core.EntityLabels.custom("FINANCE");
        const legalLabel = Core.EntityLabels.custom("LEGAL");

        expect(techLabel).toBe("CUSTOM_TECH");
        expect(medicalLabel).toBe("CUSTOM_MEDICAL");
        expect(financeLabel).toBe("CUSTOM_FINANCE");
        expect(legalLabel).toBe("CUSTOM_LEGAL");
      }));

    it("should create domain-specific custom labels", () =>
      Effect.sync(() => {
        const aiLabel = Core.EntityLabels.custom("AI");
        const blockchainLabel = Core.EntityLabels.custom("BLOCKCHAIN");
        const bioLabel = Core.EntityLabels.custom("BIOTECH");

        expect(aiLabel).toBe("CUSTOM_AI");
        expect(blockchainLabel).toBe("CUSTOM_BLOCKCHAIN");
        expect(bioLabel).toBe("CUSTOM_BIOTECH");

        // Test that they're distinct types
        expect(aiLabel).not.toBe(blockchainLabel);
        expect(blockchainLabel).not.toBe(bioLabel);
      }));
  });

  describe("Type Guards", () => {
    it("should identify standard entity labels", () =>
      Effect.sync(() => {
        const standardLabels = [
          "PERSON", "ORGANIZATION", "LOCATION", "DATE", "TIME",
          "MONEY", "PERCENT", "EMAIL", "URL", "PHONE", "MISC"
        ] as const;

        for (const label of standardLabels) {
          expect(Core.isStandardEntityLabel(label as Core.EntityLabel)).toBe(true);
          expect(Core.isCustomEntityLabel(label as Core.EntityLabel)).toBe(false);
        }
      }));

    it("should identify custom entity labels", () =>
      Effect.sync(() => {
        const customLabels = [
          "CUSTOM_TECH", "CUSTOM_MEDICAL", "CUSTOM_FINANCE", 
          "CUSTOM_LEGAL", "CUSTOM_AI", "CUSTOM_BLOCKCHAIN"
        ] as Core.CustomEntityLabel[];

        for (const label of customLabels) {
          expect(Core.isCustomEntityLabel(label)).toBe(true);
          expect(Core.isStandardEntityLabel(label)).toBe(false);
        }
      }));

    it("should handle edge cases in type guards", () =>
      Effect.sync(() => {
        // Invalid labels should return false for both
        const invalidLabels = ["CUSTOM", "INVALID", "", "PERSON_CUSTOM"];
        
        for (const label of invalidLabels) {
          expect(Core.isStandardEntityLabel(label as Core.EntityLabel)).toBe(false);
          expect(Core.isCustomEntityLabel(label as Core.EntityLabel)).toBe(false);
        }
      }));
  });

  describe("Custom Label Domain Extraction", () => {
    it("should extract domain from custom entity labels", () =>
      Effect.sync(() => {
        const techLabel = Core.EntityLabels.custom("TECH");
        const medicalLabel = Core.EntityLabels.custom("MEDICAL");
        const financeLabel = Core.EntityLabels.custom("FINANCE");

        expect(Core.getCustomLabelDomain(techLabel)).toBe("TECH");
        expect(Core.getCustomLabelDomain(medicalLabel)).toBe("MEDICAL");
        expect(Core.getCustomLabelDomain(financeLabel)).toBe("FINANCE");
      }));

    it("should handle complex domain names", () =>
      Effect.sync(() => {
        const multiWordLabel = Core.EntityLabels.custom("AI_RESEARCH");
        const numberLabel = Core.EntityLabels.custom("WEB3");
        const specialLabel = Core.EntityLabels.custom("HEALTH_CARE");

        expect(Core.getCustomLabelDomain(multiWordLabel)).toBe("AI_RESEARCH");
        expect(Core.getCustomLabelDomain(numberLabel)).toBe("WEB3");
        expect(Core.getCustomLabelDomain(specialLabel)).toBe("HEALTH_CARE");
      }));
  });

  describe("Entity Class Integration", () => {
    it("should work with Entity.hasLabel method", () =>
      Effect.sync(() => {
        const orgEntity = Core.Entity.create(
          "e1", "Apple Inc.", "ORGANIZATION", 0, 10, ["t1", "t2"]
        );

        // Test type-safe label checking
        expect(orgEntity.hasLabel("ORGANIZATION")).toBe(true);
        expect(orgEntity.hasLabel("PERSON")).toBe(false);
        expect(orgEntity.hasLabel("LOCATION")).toBe(false);
      }));

    it("should identify standard vs custom entities", () =>
      Effect.sync(() => {
        const standardEntity = Core.Entity.create(
          "e1", "Apple Inc.", "ORGANIZATION", 0, 10, ["t1"]
        );

        const customEntity = Core.Entity.create(
          "e2", "Neural Network", "CUSTOM_AI" as any, 15, 28, ["t2", "t3"]
        );

        expect(standardEntity.isStandardEntity).toBe(true);
        expect(standardEntity.isCustomEntity).toBe(false);

        expect(customEntity.isStandardEntity).toBe(false);
        expect(customEntity.isCustomEntity).toBe(true);
      }));

    it("should extract custom domain from entities", () =>
      Effect.sync(() => {
        const customEntity = Core.Entity.create(
          "e1", "Machine Learning", "CUSTOM_AI" as any, 0, 16, ["t1", "t2"]
        );

        const standardEntity = Core.Entity.create(
          "e2", "Apple Inc.", "ORGANIZATION", 20, 30, ["t3"]
        );

        // Custom entity should have domain
        expect(customEntity.customDomain._tag).toBe("Some");
        if (customEntity.customDomain._tag === "Some") {
          expect(customEntity.customDomain.value).toBe("AI");
        }

        // Standard entity should not have domain
        expect(standardEntity.customDomain._tag).toBe("None");
      }));
  });

  describe("Schema Validation", () => {
    it("should validate standard entity labels in schema", () =>
      Effect.sync(() => {
        const standardLabels = [
          "PERSON", "ORGANIZATION", "LOCATION", "DATE", "TIME",
          "MONEY", "PERCENT", "EMAIL", "URL", "PHONE", "MISC"
        ];

        for (const label of standardLabels) {
          const result = Core.EntityLabelSchema.safeParse(label);
          expect(result.success).toBe(true);
        }
      }));

    it("should validate custom entity labels in schema", () =>
      Effect.sync(() => {
        const customLabels = [
          "CUSTOM_TECH", "CUSTOM_MEDICAL", "CUSTOM_AI", 
          "CUSTOM_BLOCKCHAIN", "CUSTOM_FINANCE"
        ];

        for (const label of customLabels) {
          const result = Core.EntityLabelSchema.safeParse(label);
          expect(result.success).toBe(true);
        }
      }));

    it("should reject invalid entity labels in schema", () =>
      Effect.sync(() => {
        const invalidLabels = [
          "INVALID", "CUSTOM", "PERSON_CUSTOM", "", "123", 
          "custom_tech", "CUSTOM_", "_CUSTOM_TECH"
        ];

        for (const label of invalidLabels) {
          const result = Core.EntityLabelSchema.safeParse(label);
          expect(result.success).toBe(false);
        }
      }));
  });

  describe("Type Safety and Compilation", () => {
    it("should provide compile-time type safety", () =>
      Effect.sync(() => {
        // These should compile without errors and provide proper types
        const personLabel: Core.PersonLabel = Core.EntityLabels.PERSON;
        const orgLabel: Core.OrganizationLabel = Core.EntityLabels.ORGANIZATION;
        const customLabel: Core.CustomEntityLabel<"TECH"> = Core.EntityLabels.custom("TECH");

        // Runtime checks
        expect(personLabel).toBe("PERSON");
        expect(orgLabel).toBe("ORGANIZATION");  
        expect(customLabel).toBe("CUSTOM_TECH");

        // Type assertions to verify branded types work
        const genericLabel: Core.EntityLabel = personLabel;
        expect(genericLabel).toBe("PERSON");
      }));

    it("should work with entity filtering type narrowing", () =>
      Effect.sync(() => {
        const entities = [
          Core.Entity.create("e1", "Apple Inc.", "ORGANIZATION", 0, 10, ["t1"]),
          Core.Entity.create("e2", "Tim Cook", "PERSON", 15, 23, ["t2"]),
          Core.Entity.create("e3", "Cupertino", "LOCATION", 28, 37, ["t3"])
        ];

        // Type-safe filtering with branded labels
        const organizations = entities.filter((entity): entity is Core.Entity & { label: Core.OrganizationLabel } => 
          entity.hasLabel(Core.EntityLabels.ORGANIZATION)
        );

        expect(organizations).toHaveLength(1);
        expect(organizations[0].text).toBe("Apple Inc.");
        
        // The filtered result should have narrowed type
        const orgLabel: Core.OrganizationLabel = organizations[0].label as Core.OrganizationLabel;
        expect(orgLabel).toBe("ORGANIZATION");
      }));
  });

  describe("Legacy Compatibility", () => {
    it("should maintain compatibility with legacy entity labels", () =>
      Effect.sync(() => {
        const legacyLabels: Core.LegacyEntityLabel[] = [
          "PERSON", "ORGANIZATION", "LOCATION", "DATE", "TIME",
          "MONEY", "PERCENT", "EMAIL", "URL", "PHONE", "MISC"
        ];

        for (const label of legacyLabels) {
          // Should be valid in both old and new systems
          const legacyResult = Core.LegacyEntityLabel.safeParse(label);
          const newResult = Core.EntityLabelSchema.safeParse(label);

          expect(legacyResult.success).toBe(true);
          expect(newResult.success).toBe(true);
        }
      }));

    it("should allow migration from legacy to branded labels", () =>
      Effect.sync(() => {
        // Legacy usage
        const legacyLabel: Core.LegacyEntityLabel = "ORGANIZATION";
        
        // Migration to branded
        const brandedLabel = Core.EntityLabels.ORGANIZATION(legacyLabel);
        
        expect(brandedLabel).toBe("ORGANIZATION");
        expect(Core.isStandardEntityLabel(brandedLabel)).toBe(true);
      }));
  });

  describe("Performance and Memory", () => {
    it("should create labels efficiently", () =>
      Effect.sync(() => {
        const startTime = performance.now();
        
        // Create many labels
        const labels = [];
        for (let i = 0; i < 1000; i++) {
          labels.push(Core.EntityLabels.PERSON);
          labels.push(Core.EntityLabels.ORGANIZATION);
          labels.push(Core.EntityLabels.custom(`DOMAIN_${i}`));
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(labels).toHaveLength(3000);
        expect(duration).toBeLessThan(100); // Should be very fast
      }));

    it("should handle label comparison efficiently", () =>
      Effect.sync(() => {
        const label1 = Core.EntityLabels.ORGANIZATION;
        const label2 = Core.EntityLabels.ORGANIZATION;
        const label3 = Core.EntityLabels.PERSON;

        // String comparison should work efficiently
        expect(label1 === label2).toBe(true);
        expect(label1 === label3).toBe(false);
        
        // Type guards should be fast
        const startTime = performance.now();
        for (let i = 0; i < 1000; i++) {
          Core.isStandardEntityLabel(label1);
          Core.isCustomEntityLabel(label1);
        }
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(10);
      }));
  });
});
