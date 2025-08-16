/**
 * Wink NLP Utils Pipeline Demo
 * Demonstrates fully typed, data-first, pipeable transformations
 * Based on https://winkjs.org/wink-nlp-utils/
 */

import { Effect, Chunk, Option, pipe } from "effect";
import * as NLP from "../NLP/index.js";

const program = Effect.gen(function* () {
  console.log("=== Wink NLP Utils Pipeline Demo ===\n");

  // Sample text with various challenges
  const rawText = `  Dr. Sarah Connor M.Tech., PhD. - AI Inc. is focussing on AI. 
  I work for AI Inc.! My email is r2d2@yahoo.com. 
  Check out http://winkjs.org/ for more info. 
  Someone's wallet, isn't it? Can't wait to see the results!  `;

  console.log("1. Raw Input Text:");
  console.log(`"${rawText}"`);
  console.log();

  // Create input
  const textInput = NLP.TextInput({ text: rawText });

  // Build a complete text processing pipeline
  console.log("2. Text Processing Pipeline:");

  // Step 1: Clean HTML and extra spaces
  const cleaned = yield* pipe(
    textInput,
    NLP.removeHTMLTags,
    Effect.flatMap((result) =>
      NLP.removeExtraSpaces(NLP.TextInput({ text: result.text }))
    ),
    Effect.flatMap((result) => NLP.trim(NLP.TextInput({ text: result.text })))
  );
  console.log(`  Cleaned: "${cleaned.text}"`);

  // Step 2: Amplify elisions (isn't -> is not)
  const amplified = yield* NLP.amplifyNotElision(
    NLP.TextInput({ text: cleaned.text })
  );
  console.log(`  Amplified: "${amplified.text}"`);

  // Step 3: Extract person's name
  const personName = yield* NLP.extractPersonsName(textInput);
  console.log(`  Person's Name: "${personName.text}"`);

  // Step 4: Extract capital word runs
  const capitalWords = yield* NLP.extractRunOfCapitalWords(textInput);
  console.log(`  Capital Words: "${capitalWords.text}"`);
  console.log();

  // Tokenization pipeline
  console.log("3. Tokenization Pipeline:");

  // Basic tokenization
  const tokens = yield* NLP.utilsTokenize(
    NLP.TextInput({ text: amplified.text })
  );
  console.log(
    `  Basic Tokens (${tokens.transformedCount}): [${Chunk.toReadonlyArray(
      tokens.tokens
    )
      .slice(0, 8)
      .join(", ")}...]`
  );

  // Detailed tokenization with tags
  const detailedTokens = yield* NLP.utilsTokenizeDetailed(
    NLP.TextInput({ text: cleaned.text })
  );
  console.log(`  Detailed Tokens:`);
  console.log(
    `    Words: ${detailedTokens.wordCount}, Punctuation: ${detailedTokens.punctuationCount}, Total: ${detailedTokens.totalCount}`
  );

  const sampleDetailedTokens = Chunk.toReadonlyArray(
    detailedTokens.tokens
  ).slice(0, 6);
  sampleDetailedTokens.forEach((token) => {
    console.log(`    "${token.value}" (${token.tag})`);
  });

  // Alternative tokenization (tokenize0)
  const tokens0 = yield* NLP.utilsTokenize0(
    NLP.TextInput({ text: amplified.text })
  );
  console.log(
    `  Tokenize0 (${tokens0.transformedCount}): [${Chunk.toReadonlyArray(
      tokens0.tokens
    )
      .slice(0, 8)
      .join(", ")}...]`
  );
  console.log();

  // Token processing pipeline
  console.log("4. Token Processing Pipeline:");
  const tokensInput = NLP.TokensInput({ tokens: tokens.tokens });

  // Remove stop words
  const filteredTokens = yield* NLP.removeWords(
    tokensInput,
    NLP.StopWordsConfig({ customStopWords: Option.none() })
  );
  console.log(
    `  After stop word removal (${filteredTokens.originalCount} -> ${filteredTokens.transformedCount}):`
  );
  console.log(
    `    [${Chunk.toReadonlyArray(filteredTokens.tokens)
      .slice(0, 10)
      .join(", ")}...]`
  );

  // Stem tokens
  const stemmedTokens = yield* NLP.stem(
    NLP.TokensInput({ tokens: filteredTokens.tokens })
  );
  console.log(
    `  Stemmed tokens: [${Chunk.toReadonlyArray(stemmedTokens.tokens)
      .slice(0, 8)
      .join(", ")}...]`
  );

  // Phonetic codes
  const phoneticTokens = yield* NLP.phonetize(
    NLP.TokensInput({ tokens: filteredTokens.tokens })
  );
  console.log(
    `  Phonetic codes: [${Chunk.toReadonlyArray(phoneticTokens.tokens)
      .slice(0, 8)
      .join(", ")}...]`
  );

  // Soundex codes
  const soundexTokens = yield* NLP.soundex(
    NLP.TokensInput({ tokens: filteredTokens.tokens })
  );
  console.log(
    `  Soundex codes: [${Chunk.toReadonlyArray(soundexTokens.tokens)
      .slice(0, 8)
      .join(", ")}...]`
  );

  // Propagate negations
  const negatedTokens = yield* NLP.propagateNegations(tokensInput);
  console.log(
    `  Negation propagation: [${Chunk.toReadonlyArray(negatedTokens.tokens)
      .slice(0, 10)
      .join(", ")}...]`
  );
  console.log();

  // N-gram analysis
  console.log("5. N-gram Analysis:");

  // Bag of bigrams
  const bigrams = yield* NLP.bagOfNGrams(
    NLP.TextInput({ text: cleaned.text }),
    NLP.NGramConfig({ size: 2 })
  );
  const topBigrams = Object.entries(bigrams.ngrams)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  console.log(
    `  Bag of Bigrams (${bigrams.uniqueNGrams} unique, ${bigrams.totalNGrams} total):`
  );
  topBigrams.forEach(([ngram, count]) => {
    console.log(`    "${ngram}": ${count}`);
  });

  // Bag of trigrams
  const trigrams = yield* NLP.bagOfNGrams(
    NLP.TextInput({ text: cleaned.text }),
    NLP.NGramConfig({ size: 3 })
  );
  const topTrigrams = Object.entries(trigrams.ngrams)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  console.log(
    `  Bag of Trigrams (${trigrams.uniqueNGrams} unique): [${topTrigrams
      .map(([ngram]) => `"${ngram}"`)
      .join(", ")}...]`
  );

  // Edge n-grams
  const edgeNGrams = yield* NLP.edgeNGrams(
    NLP.TextInput({ text: "processing" }),
    NLP.NGramConfig({ size: 3 })
  );
  console.log(
    `  Edge 3-grams of "processing": ${JSON.stringify(edgeNGrams.ngrams)}`
  );
  console.log();

  // Sentence detection
  console.log("6. Sentence Detection:");
  const sentences = yield* NLP.sentences(NLP.TextInput({ text: cleaned.text }));
  console.log(`  Detected ${sentences.count} sentences:`);
  Chunk.toReadonlyArray(sentences.sentences).forEach((sentence, i) => {
    console.log(`    ${i + 1}. "${sentence}"`);
  });
  console.log();

  // Corpus composition
  console.log("7. Corpus Composition:");
  const corpusTemplate =
    "[I] [am having|have] [a] [problem|question] [with AI|with ML]";
  const corpus = yield* NLP.composeCorpus(
    NLP.CorpusTemplate({ template: corpusTemplate })
  );
  console.log(`  Template: "${corpusTemplate}"`);
  console.log(`  Generated ${corpus.combinations} combinations:`);
  Chunk.toReadonlyArray(corpus.sentences).forEach((sentence, i) => {
    console.log(`    ${i + 1}. "${sentence}"`);
  });
  console.log();

  // Token analysis
  console.log("8. Token Analysis:");

  // Bag of words
  const bow = yield* NLP.bagOfWords(
    NLP.TokensInput({ tokens: filteredTokens.tokens })
  );
  const topWords = Object.entries(bow.ngrams)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  console.log(`  Bag of Words (${bow.uniqueNGrams} unique words):`);
  topWords.forEach(([word, count]) => {
    console.log(`    "${word}": ${count}`);
  });

  // Bigrams from tokens
  const tokenBigrams = yield* NLP.bigrams(
    NLP.TokensInput({ tokens: filteredTokens.tokens })
  );
  console.log(
    `  Token Bigrams: [${Chunk.toReadonlyArray(tokenBigrams.tokens)
      .slice(0, 6)
      .join(", ")}...]`
  );

  // Append bigrams
  const appendedBigrams = yield* NLP.appendBigrams(
    NLP.TokensInput({ tokens: Chunk.take(filteredTokens.tokens, 6) })
  );
  console.log(
    `  Original + Bigrams (${appendedBigrams.originalCount} -> ${appendedBigrams.transformedCount}):`
  );
  console.log(
    `    [${Chunk.toReadonlyArray(appendedBigrams.tokens).join(", ")}]`
  );
  console.log();

  // Complex pipeline composition
  console.log("9. Complex Pipeline Composition:");
  const complexResult = yield* pipe(
    NLP.TextInput({ text: "  Dr. John's AI research isn't complete!  " }),
    NLP.removeExtraSpaces,
    Effect.flatMap((result) => NLP.trim(NLP.TextInput({ text: result.text }))),
    Effect.flatMap((result) =>
      NLP.amplifyNotElision(NLP.TextInput({ text: result.text }))
    ),
    Effect.flatMap((result) =>
      NLP.lowerCase(NLP.TextInput({ text: result.text }))
    ),
    Effect.flatMap((result) =>
      NLP.utilsTokenize(NLP.TextInput({ text: result.text }))
    ),
    Effect.flatMap((tokens) =>
      NLP.removeWords(
        NLP.TokensInput({ tokens: tokens.tokens }),
        NLP.StopWordsConfig({ customStopWords: Option.none() })
      )
    ),
    Effect.flatMap((tokens) =>
      NLP.stem(NLP.TokensInput({ tokens: tokens.tokens }))
    )
  );

  console.log(
    `  Pipeline: trim -> amplify -> lowercase -> tokenize -> remove stopwords -> stem`
  );
  console.log(`  Input: "  Dr. John's AI research isn't complete!  "`);
  console.log(
    `  Output: [${Chunk.toReadonlyArray(complexResult.tokens).join(", ")}]`
  );
  console.log(
    `  Reduction: ${complexResult.originalCount} -> ${complexResult.transformedCount} tokens`
  );
  console.log();

  console.log("✅ Wink NLP Utils Pipeline Demo Complete!");
  console.log("   - Fully typed, data-first transformations");
  console.log("   - Pipeable composition with Effect.pipe");
  console.log("   - Clean input/output data structures");
  console.log("   - Comprehensive text preprocessing capabilities");
  console.log("   - Token analysis and n-gram generation");
  console.log("   - Sentence detection and corpus composition");
  console.log("   - Pure functional transformations with Effect");
}).pipe(Effect.provide(NLP.WinkUtilsLive));

// Run the program
Effect.runPromise(program).catch(console.error);
