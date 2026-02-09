/**
 * AI-facing output schemas for NLP tools.
 * These provide flat, annotated types suitable for LLM JSON output,
 * converting from internal Effect types (branded, Chunk, Option) to plain values.
 * @since 3.0.0
 */

import { Schema } from "effect"

export const AiTokenSchema = Schema.Struct({
  text: Schema.String.annotations({ description: "The token text" }),
  pos: Schema.String.annotations({
    description: "Part-of-speech tag (e.g. NOUN, VERB, ADJ)",
    examples: ["NOUN", "VERB", "ADJ", "DET", "ADP"]
  }),
  lemma: Schema.String.annotations({
    description: "Base/dictionary form of the word"
  }),
  stem: Schema.String.annotations({
    description: "Stemmed form of the word"
  }),
  isStopWord: Schema.Boolean.annotations({
    description: "Whether this is a common stop word"
  }),
  isPunctuation: Schema.Boolean.annotations({
    description: "Whether this token is punctuation"
  }),
  start: Schema.Number.annotations({
    description: "Character offset where token begins in the original text"
  }),
  end: Schema.Number.annotations({
    description: "Character offset where token ends in the original text"
  })
}).annotations({
  title: "Token",
  description: "A linguistic token with POS, lemma, and position"
})

export const AiSentenceSchema = Schema.Struct({
  text: Schema.String.annotations({ description: "The sentence text" }),
  tokenCount: Schema.Number.annotations({
    description: "Number of tokens in the sentence"
  }),
  index: Schema.Number.annotations({
    description: "Zero-based sentence index in the document"
  }),
  start: Schema.Number.annotations({
    description: "Character offset where sentence begins"
  }),
  end: Schema.Number.annotations({
    description: "Character offset where sentence ends"
  })
}).annotations({
  title: "Sentence",
  description: "A sentence with token count and character positions"
})

export const AiKeywordSchema = Schema.Struct({
  term: Schema.String.annotations({ description: "The keyword term" }),
  score: Schema.Number.annotations({
    description: "TF-IDF importance score"
  })
}).annotations({
  title: "Keyword",
  description: "A keyword with TF-IDF importance score"
})

export const AiDocumentStatsSchema = Schema.Struct({
  wordCount: Schema.Number.annotations({
    description: "Approximate count of word-like tokens (excluding punctuation)"
  }),
  sentenceCount: Schema.Number.annotations({
    description: "Number of sentences in the text"
  }),
  avgSentenceLength: Schema.Number.annotations({
    description: "Average number of word-like tokens per sentence"
  }),
  charCount: Schema.Number.annotations({
    description: "Character count of the input text"
  })
}).annotations({
  title: "DocumentStats",
  description: "High-level statistics describing a text document"
})

export const AiSentenceChunkSchema = Schema.Struct({
  text: Schema.String.annotations({
    description: "Chunk text built from one or more complete sentences"
  }),
  sentenceCount: Schema.Number.annotations({
    description: "Number of sentences in the chunk"
  }),
  charCount: Schema.Number.annotations({
    description: "Character count of this chunk"
  }),
  startSentenceIndex: Schema.Number.annotations({
    description: "Inclusive sentence index where this chunk starts"
  }),
  endSentenceIndex: Schema.Number.annotations({
    description: "Inclusive sentence index where this chunk ends"
  })
}).annotations({
  title: "SentenceChunk",
  description: "A sentence-aligned chunk of text with boundary metadata"
})

export const AiRankedTextSchema = Schema.Struct({
  index: Schema.Number.annotations({
    description: "Index of the original input text in the `texts` array"
  }),
  score: Schema.Number.annotations({
    description: "Relevance score (higher means more relevant to the query)"
  })
}).annotations({
  title: "RankedText",
  description: "A text index with a relevance score"
})

export const AiEntitySchema = Schema.Struct({
  value: Schema.String.annotations({
    description: "The extracted entity text"
  }),
  type: Schema.String.annotations({
    description:
      "Entity type label from wink-nlp (e.g. PERSON, DATE, MONEY, EMAIL, URL)"
  }),
  start: Schema.Number.annotations({
    description: "Character offset where the entity begins"
  }),
  end: Schema.Number.annotations({
    description: "Character offset where the entity ends"
  }),
  startTokenIndex: Schema.Number.annotations({
    description: "Inclusive token index where the entity begins"
  }),
  endTokenIndex: Schema.Number.annotations({
    description: "Inclusive token index where the entity ends"
  })
}).annotations({
  title: "Entity",
  description: "A named entity with type and source offsets"
})
