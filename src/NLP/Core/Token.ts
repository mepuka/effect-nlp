/**
 * Core Token Model
 * Pure token representation using Data.case for simple structure
 * @since 3.0.0
 */

import { Data, Brand, Option } from "effect";

/**
 * Branded token index for type safety
 */
export type TokenIndex = number & Brand.Brand<"TokenIndex">;
export const TokenIndex = Brand.nominal<TokenIndex>();

/**
 * Branded character position for type safety
 */
export type CharPosition = number & Brand.Brand<"CharPosition">;
export const CharPosition = Brand.nominal<CharPosition>();

/**
 * Token properties interface - using Option for optional values
 */
interface TokenProps {
  readonly text: string;
  readonly index: TokenIndex;
  readonly start: CharPosition;
  readonly end: CharPosition;
  readonly pos: Option.Option<string>;
  readonly lemma: Option.Option<string>;
  readonly stem: Option.Option<string>;
  readonly normal: Option.Option<string>;
  readonly shape: Option.Option<string>;
  readonly prefix: Option.Option<string>;
  readonly suffix: Option.Option<string>;
  readonly case: Option.Option<string>;
  readonly uniqueId: Option.Option<number>;
  readonly abbrevFlag: Option.Option<boolean>;
  readonly contractionFlag: Option.Option<boolean>;
  readonly stopWordFlag: Option.Option<boolean>;
  readonly negationFlag: Option.Option<boolean>;
  readonly precedingSpaces: Option.Option<string>;
  readonly tags: ReadonlyArray<string>;
}

/**
 * Token constructor using Data.case
 */
export class Token extends Data.TaggedClass("Token")<TokenProps> {}

/**
 * Token helpers
 */
export const TokenHelpers = {
  /**
   * Get token length
   */
  length: (token: Token): number => token.end - token.start,

  /**
   * Check if token contains position
   */
  containsPosition: (token: Token, pos: number): boolean =>
    pos >= token.start && pos < token.end,

  /**
   * Check if token is punctuation (based on shape)
   */
  isPunctuation: (token: Token): boolean =>
    Option.match(token.shape, {
      onNone: () => false,
      onSome: (shape) => !/[Xxd]/.test(shape),
    }),

  /**
   * Check if token is word (has letters)
   */
  isWord: (token: Token): boolean =>
    Option.match(token.shape, {
      onNone: () => true,
      onSome: (shape) => /[Xx]/.test(shape),
    }),
};
