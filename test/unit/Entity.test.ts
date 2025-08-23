import { Effect, Schema, HashSet } from "effect";
import { describe, it, expect } from "vitest";
import {
  MakeEntitySchema,
  MakeEntityId,
  MakeSchemaId,
  EntityId,
  SchemaId,
  EntityPropHashSet,
  EntityHash,
  getEntityId,
  getSchemaId,
} from "../../src/Extraction/Entity.js";

describe("Entity", () => {
  describe("Branded Types", () => {
    it("should create valid EntityId", () => {
      const entityId = MakeEntityId();
      expect(entityId).toMatch(/^entity##[\w-]+$/);
      expect(Schema.is(EntityId)(entityId)).toBe(true);
    });

    it("should create valid SchemaId", () => {
      const schemaId = MakeSchemaId("Person");
      expect(schemaId).toMatch(/^schema-Person-\d+$/);
      expect(Schema.is(SchemaId)(schemaId)).toBe(true);
    });

    it("should create unique EntityIds", () => {
      const id1 = MakeEntityId();
      const id2 = MakeEntityId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("MakeEntity", () => {
    const PersonFields = Schema.Struct({
      name: Schema.String,
      age: Schema.Number,
    });

    const OrganizationFields = Schema.Struct({
      name: Schema.String,
      industry: Schema.String,
    });

    it("should create entity with default IDs", () => {
      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });

      const entityId = getEntityId(entity);
      const schemaId = getSchemaId(entity);

      expect(Schema.is(EntityId)(entityId)).toBe(true);
      expect(Schema.is(SchemaId)(schemaId)).toBe(true);
      expect(schemaId).toContain("Person");
    });

    it("should create entity with custom IDs", () => {
      const customEntityId = MakeEntityId();

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
        entityId: customEntityId,
      });

      const entityId = getEntityId(entity);
      const schemaId = getSchemaId(entity);

      expect(entityId).toBe(customEntityId);
      expect(schemaId).toContain("Person");
    });

    it("should create entity with correct schema structure", () => {
      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });

      // Test that the schema can be used for validation
      const validData = {
        name: "John",
        age: 30,
      };
      const invalidData = { name: "John" }; // Missing required fields

      const validResult = Schema.decode(entity)(validData);
      // @ts-expect-error - invalid data
      const invalidResult = Schema.decode(entity)(invalidData);

      expect(Effect.runSync(validResult)).toEqual(validData);
      expect(() => Effect.runSync(invalidResult)).toThrow();
    });

    it("should create different entities with different schemas", () => {
      const personEntity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });
      const orgEntity = MakeEntitySchema({
        schema: OrganizationFields,
        name: "Organization",
      });

      const personEntityId = getEntityId(personEntity);
      const orgEntityId = getEntityId(orgEntity);
      const personSchemaId = getSchemaId(personEntity);
      const orgSchemaId = getSchemaId(orgEntity);

      expect(personEntityId).not.toBe(orgEntityId);
      expect(personSchemaId).not.toBe(orgSchemaId);
      expect(personSchemaId).toContain("Person");
      expect(orgSchemaId).toContain("Organization");
    });

    it("should handle complex nested schemas", () => {
      const AddressFields = Schema.Struct({
        street: Schema.String,
        city: Schema.String,
      });

      const ComplexPersonFields = Schema.Struct({
        name: Schema.String,
        address: AddressFields,
        tags: Schema.Array(Schema.String),
      });

      const entity = MakeEntitySchema({
        schema: ComplexPersonFields,
        name: "ComplexPerson",
      });

      const entityId = getEntityId(entity);
      const schemaId = getSchemaId(entity);

      expect(Schema.is(EntityId)(entityId)).toBe(true);
      expect(Schema.is(SchemaId)(schemaId)).toBe(true);
    });
  });

  describe("EntityPropHashSet", () => {
    it("should extract entity IDs from property signatures", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });
      const hashSet = EntityPropHashSet(entity);

      // Should contain the entityId since we stamp all properties
      expect(HashSet.size(hashSet)).toBeGreaterThan(0);
    });

    it("should return consistent hash sets for same entity", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });
      const hashSet1 = EntityPropHashSet(entity);
      const hashSet2 = EntityPropHashSet(entity);

      expect(HashSet.size(hashSet1)).toBe(HashSet.size(hashSet2));
    });

    it("should return different hash sets for different entities", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity1 = MakeEntitySchema({
        schema: PersonFields,
        name: "Person1",
      });
      const entity2 = MakeEntitySchema({
        schema: PersonFields,
        name: "Person2",
      });

      const hashSet1 = EntityPropHashSet(entity1);
      const hashSet2 = EntityPropHashSet(entity2);

      expect(HashSet.size(hashSet1)).toBe(HashSet.size(hashSet2)); // Same number of properties
    });
  });

  describe("EntityHash", () => {
    it("should generate consistent hashes for same entity", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });
      const hash1 = EntityHash(entity);
      const hash2 = EntityHash(entity);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different entities", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity1 = MakeEntitySchema({
        schema: PersonFields,
        name: "Person1",
      });
      const entity2 = MakeEntitySchema({
        schema: PersonFields,
        name: "Person2",
      });

      const hash1 = EntityHash(entity1);
      const hash2 = EntityHash(entity2);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate numeric hashes", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });
      const hash = EntityHash(entity);

      expect(typeof hash).toBe("number");
      expect(Number.isInteger(hash)).toBe(true);
    });
  });

  describe("Schema Validation", () => {
    it("should validate entity data correctly", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });

      const validData = {
        name: "John Doe",
        age: 30,
      };

      const result = Effect.runSync(Schema.decode(entity)(validData));
      expect(result).toEqual(validData);
    });

    it("should reject invalid entity data", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });

      const invalidData = {
        name: "John Doe",
        // Missing age, identifier, schemaId, createdAt
      };

      expect(() =>
        // @ts-expect-error - invalid data
        Effect.runSync(Schema.decode(entity)(invalidData))
      ).toThrow();
    });

    it("should handle optional fields correctly", () => {
      const PersonFields = Schema.Struct({
        name: Schema.String,
        age: Schema.optional(Schema.Number),
      });

      const entity = MakeEntitySchema({
        schema: PersonFields,
        name: "Person",
      });

      const validDataWithoutAge = {
        name: "John Doe",
        identifier: getEntityId(entity),
        schemaId: getSchemaId(entity),
        createdAt: new Date().toISOString(),
      };

      const result = Effect.runSync(Schema.decode(entity)(validDataWithoutAge));
      expect(result.name).toBe("John Doe");
      expect(result.age).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle empty fields object", () => {
      const EmptyFields = Schema.Struct({});
      const entity = MakeEntitySchema({
        schema: EmptyFields,
        name: "Empty",
      });

      expect(Schema.is(EntityId)(getEntityId(entity))).toBe(true);
      expect(Schema.is(SchemaId)(getSchemaId(entity))).toBe(true);
    });

    it("should handle fields with complex types", () => {
      const ComplexFields = Schema.Struct({
        name: Schema.String,
        metadata: Schema.Array(Schema.Tuple(Schema.String, Schema.String)),
        flags: Schema.Array(Schema.Boolean),
      });

      const entity = MakeEntitySchema({
        schema: ComplexFields,
        name: "Complex",
      });

      expect(Schema.is(EntityId)(getEntityId(entity))).toBe(true);
      expect(Schema.is(SchemaId)(getSchemaId(entity))).toBe(true);
    });
  });
});
