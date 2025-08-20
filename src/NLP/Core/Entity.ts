import { Schema } from "effect";

export const EntityId = Schema.String.pipe(Schema.brand("EntityId"));

export class Entity extends Schema.TaggedClass<Entity>("Entity")("Entity", {
  id: EntityId,
  text: Schema.String,
  type: Schema.String,
  start: Schema.Number,
  end: Schema.Number,
}) {}
