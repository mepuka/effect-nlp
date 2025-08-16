/**
 * Core Document Model
 * Using Data.case for simple document structure
 * @since 3.0.0
 */

import { Data, type Brand, Chunk, type Option, Schema } from "effect";
import type { Token, TokenIndex } from "./Token.js";
import type { Sentence, SentenceIndex } from "./Sentence.js";

/**
 * Branded document ID
 */
export type DocumentId = string & Brand.Brand<"DocumentId">;
export const DocumentId = Schema.String.pipe(Schema.brand("DocumentId"));

/**
 * Document properties interface - pure NLP properties only
 */
interface DocumentProps {
  readonly id: DocumentId;
  readonly text: string;
  readonly tokens: Chunk.Chunk<Token>;
  readonly sentences: Chunk.Chunk<Sentence>;
  readonly sentiment: Option.Option<number>;
}

/**
 * Document constructor using Data.case
 */
export const Document = Data.case<DocumentProps>();
export type Document = ReturnType<typeof Document>;

/**
 * Document helpers
 */
export const DocumentHelpers = {
  /**
   * Get token count
   */
  tokenCount: (doc: Document): number => Chunk.size(doc.tokens),

  /**
   * Get sentence count
   */
  sentenceCount: (doc: Document): number => Chunk.size(doc.sentences),

  /**
   * Get character count
   */
  characterCount: (doc: Document): number => doc.text.length,

  /**
   * Get tokens by character range
   */
  getTokensInRange: (
    doc: Document,
    start: number,
    end: number
  ): Chunk.Chunk<Token> =>
    Chunk.filter(
      doc.tokens,
      (token) => token.start >= start && token.end <= end
    ),

  /**
   * Get token by index (safe)
   */
  getToken: (doc: Document, index: number): Option.Option<Token> =>
    Chunk.get(doc.tokens, index),

  /**
   * Get token by branded index
   */
  getTokenByIndex: (doc: Document, index: TokenIndex): Option.Option<Token> =>
    Chunk.get(doc.tokens, index),

  /**
   * Get sentence by index (safe)
   */
  getSentence: (doc: Document, index: number): Option.Option<Sentence> =>
    Chunk.get(doc.sentences, index),

  /**
   * Get sentence by branded index
   */
  getSentenceByIndex: (
    doc: Document,
    index: SentenceIndex
  ): Option.Option<Sentence> => Chunk.get(doc.sentences, index),

  /**
   * Update tokens (returns new document)
   */
  withTokens: (doc: Document, tokens: Chunk.Chunk<Token>): Document =>
    Document({ ...doc, tokens }),

  /**
   * Update sentences (returns new document)
   */
  withSentences: (doc: Document, sentences: Chunk.Chunk<Sentence>): Document =>
    Document({ ...doc, sentences }),

  /**
   * Update sentiment (returns new document)
   */
  withSentiment: (doc: Document, sentiment: Option.Option<number>): Document =>
    Document({ ...doc, sentiment }),
};
