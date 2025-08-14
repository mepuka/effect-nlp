import { Console, Effect } from "effect";
import * as DP from "../NLP/DocumentProcessor.js";
import * as Live from "../NLP/DocumentProcessorLive.js";

const text = "John Roberts said hello, world!";

const program = Effect.gen(function* () {
  const processor = yield* DP.DocumentProcessorService;
  const _query = yield* DP.DocumentQueryService;
  const _transformer = yield* DP.TextTransformerService;

  const document = yield* processor
    .process(text)
    .pipe(
      Effect.tapError((error) =>
        Console.error(`Document processing failed:`, error)
      )
    );

  const entity = document.getEntities()[0];

  // get text before after entity by slicing with offset
  const textBefore = text.slice(0, entity.offset.char.start);
  const textAfter = text.slice(entity.offset.char.end);

  console.log("textBefore", textBefore);
  console.log("entity", entity.text);
  console.log("textAfter", textAfter);
});

program.pipe(Effect.provide(Live.DocumentProcessingLive), Effect.runPromise);
