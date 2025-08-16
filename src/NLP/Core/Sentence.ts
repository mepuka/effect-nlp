/**
 * Core Sentence Model
 * Using Data.tagged for pattern matching capabilities
 * @since 3.0.0
 */

import { Data, Brand, Option, Chunk } from "effect";
import type { Token, TokenIndex } from "./Token.js";

/**
 * Branded sentence index
 */
export type SentenceIndex = number & Brand.Brand<"SentenceIndex">;
export const SentenceIndex = Brand.nominal<SentenceIndex>();

/**
 * Sentence properties interface - using Option for optional values
 */
interface SentenceProps {
  readonly text: string;
  readonly index: SentenceIndex;
  readonly tokens: Chunk.Chunk<Token>;
  readonly start: TokenIndex;
  readonly end: TokenIndex;
  readonly sentiment: Option.Option<number>;
  readonly importance: Option.Option<number>;
  readonly negationFlag: Option.Option<boolean>;
  readonly markedUpText: Option.Option<string>;
}

/**
 * Sentence using Data.tagged for pattern matching
 */
export class Sentence extends Data.TaggedClass("Sentence")<SentenceProps> {
  /**
   * Get sentence length in tokens
   */
  get tokenCount(): number {
    return Chunk.size(this.tokens);
  }

  /**
   * Get sentence length in characters
   */
  get characterCount(): number {
    return this.text.length;
  }

  /**
   * Get tokens in range
   */
  getTokensInRange(startIdx: number, endIdx: number): Chunk.Chunk<Token> {
    return Chunk.take(Chunk.drop(this.tokens, startIdx), endIdx - startIdx);
  }
}

/**
 * Sentence helpers and pattern matchers
 */
export const SentenceHelpers = {
  /**
   * Check if sentence has sentiment
   */
  hasSentiment: (sentence: Sentence): boolean =>
    Option.isSome(sentence.sentiment),
};
