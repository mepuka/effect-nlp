import { assert, describe, it } from "@effect/vitest";
import { Chunk, Effect, Option } from "effect";
import {
  WinkTokenizer,
  WinkTokenizerLive,
} from "../../src/NLP/Wink/WinkTokenizer.js";

describe("WinkTokenizer", () => {
  it.effect("computes correct character offsets", () =>
    Effect.gen(function* () {
      const tokenizer = yield* WinkTokenizer;
      const text = "  Hello  world!";

      const tokens = yield* tokenizer.tokenize(text);
      const tokenList = Chunk.toReadonlyArray(tokens);

      assert.strictEqual(tokenList.length, 3);

      const [helloToken, worldToken, exclamationToken] = tokenList;

      assert.strictEqual(helloToken.text, "Hello");
      assert.strictEqual(Number(helloToken.start), 2);
      assert.strictEqual(Number(helloToken.end), 7);
      assert.strictEqual(
        Option.getOrElse(helloToken.precedingSpaces, () => ""),
        "  "
      );

      assert.strictEqual(worldToken.text, "world");
      assert.strictEqual(Number(worldToken.start), 9);
      assert.strictEqual(Number(worldToken.end), 14);
      assert.strictEqual(
        Option.getOrElse(worldToken.precedingSpaces, () => ""),
        "  "
      );

      assert.strictEqual(exclamationToken.text, "!");
      assert.strictEqual(Number(exclamationToken.start), 14);
      assert.strictEqual(Number(exclamationToken.end), 15);
    }).pipe(Effect.provide(WinkTokenizerLive))
  );
});
