/**
 * ExtractEntities tool - extracts named entities from text with offsets.
 * @since 3.0.0
 */

import { Tool } from "@effect/ai"
import { Schema } from "effect"
import { AiEntitySchema } from "./_schemas.js"

export const ExtractEntities = Tool.make("ExtractEntities", {
  description:
    "Extract named entities (e.g. DATE, MONEY, PERSON, EMAIL, URL) from text using wink-nlp",
  parameters: {
    text: Schema.String.annotations({
      description: "The text to analyze for entities",
      examples: [
        "Email john@example.com by 2026-01-15. Budget is $1200 for New York."
      ]
    })
  },
  success: Schema.Struct({
    entities: Schema.Array(AiEntitySchema),
    entityCount: Schema.Number,
    entityTypes: Schema.Array(Schema.String)
  })
})
