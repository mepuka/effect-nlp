import {
  Context,
  Data,
  Effect,
  HashMap,
  Layer,
  Option,
  pipe,
  Array as RA,
} from "effect";
import winkNLP from "wink-nlp";
import type { ItemToken } from "wink-nlp";
import model from "wink-eng-lite-web-model";
import nlp from "compromise";
import type { TextDocument } from "./Document.js";

// =============================================================================
// Core Data Types
// =============================================================================

/**
 * Token with full linguistic analysis
 * @since 1.0.0
 */
export class Token extends Data.Class<{
  readonly value: string;
  readonly index: number;
  readonly charStart: number;
  readonly charEnd: number;
  readonly pos: string;
  readonly lemma: string;
  readonly stem: string;
  readonly type: string;
  readonly shape: string;
  readonly isNegated: boolean;
  readonly sentiment: number;
  readonly tags: ReadonlyArray<string>;
  readonly normal: string;
}> {}

/**
 * A view over tokens representing a linguistic unit
 * @since 1.0.0
 */
export class View extends Data.Class<{
  readonly id: string;
  readonly type: ViewType;
  readonly text: string;
  readonly tokenIndices: ReadonlyArray<number>;
  readonly charStart: number;
  readonly charEnd: number;
  readonly metadata: Record<string, any>;
}> {}

/**
 * Types of linguistic views
 * @since 1.0.0
 */
export type ViewType =
  | "sentence"
  | "term"
  | "verb"
  | "noun"
  | "adjective"
  | "adverb"
  | "person"
  | "place"
  | "organization"
  | "topic"
  | "custom"
  // Wink entity types
  | "date"
  | "ordinal"
  | "cardinal"
  | "money"
  | "percent"
  | "time"
  | "duration"
  | "hashtag"
  | "emoji"
  | "emoticon"
  | "email"
  | "url"
  | "mention";

/**
 * Document analysis containing tokens, views, and entities
 * @since 1.0.0
 */
export class DocumentAnalysis extends Data.Class<{
  readonly documentId: string;
  readonly tokens: ReadonlyArray<Token>;
  readonly views: ReadonlyArray<View>;
  readonly entities: ReadonlyArray<UnifiedEntity>;
  readonly tokenIndex: HashMap.HashMap<number, Token>;
  readonly viewsByType: HashMap.HashMap<ViewType, ReadonlyArray<View>>;
  readonly viewsByToken: HashMap.HashMap<number, ReadonlyArray<View>>;
  readonly entitiesByType: HashMap.HashMap<
    string,
    ReadonlyArray<UnifiedEntity>
  >;
}> {}

// =============================================================================
// Query Types (Data-First API)
// =============================================================================

/**
 * Query for finding views
 * @since 1.0.0
 */
export class ViewQuery extends Data.Class<{
  readonly type: Option.Option<ViewType>;
  readonly pattern: Option.Option<string>;
  readonly tags: Option.Option<ReadonlyArray<string>>;
  readonly tokenFilter: Option.Option<(token: Token) => boolean>;
}> {
  static readonly byType = (type: ViewType) =>
    new ViewQuery({
      type: Option.some(type),
      pattern: Option.none(),
      tags: Option.none(),
      tokenFilter: Option.none(),
    });

  static readonly byPattern = (pattern: string) =>
    new ViewQuery({
      type: Option.none(),
      pattern: Option.some(pattern),
      tags: Option.none(),
      tokenFilter: Option.none(),
    });

  static readonly byTags = (tags: ReadonlyArray<string>) =>
    new ViewQuery({
      type: Option.none(),
      pattern: Option.none(),
      tags: Option.some(tags),
      tokenFilter: Option.none(),
    });

  static readonly byTokenFilter = (filter: (token: Token) => boolean) =>
    new ViewQuery({
      type: Option.none(),
      pattern: Option.none(),
      tags: Option.none(),
      tokenFilter: Option.some(filter),
    });
}

/**
 * Text transformation
 * @since 1.0.0
 */
export type Transform = Data.TaggedEnum<{
  Tense: { readonly target: "past" | "present" | "future" };
  Number: { readonly target: "singular" | "plural" };
  Case: { readonly target: "upper" | "lower" | "title" | "camel" };
  Normalize: object;
  Contract: object;
  Expand: object;
}>;

export const Transform = Data.taggedEnum<Transform>();

/**
 * Custom entity pattern definition for wink-nlp
 * @since 1.0.0
 */
export class CustomEntityPattern extends Data.Class<{
  readonly name: string;
  readonly patterns: ReadonlyArray<string>;
}> {}

/**
 * Custom entity configuration
 * @since 1.0.0
 */
export class CustomEntityConfig extends Data.Class<{
  readonly matchValue: boolean;
  readonly usePOS: boolean;
  readonly useEntity: boolean;
}> {
  static readonly default = new CustomEntityConfig({
    matchValue: false,
    usePOS: true,
    useEntity: true,
  });
}

/**
 * Unified entity result from both wink and compromise
 * @since 1.0.0
 */
export class UnifiedEntity extends Data.Class<{
  readonly text: string;
  readonly type: string;
  readonly charStart: number;
  readonly charEnd: number;
  readonly source: "wink" | "compromise";
  readonly metadata: Record<string, any>;
}> {}

// =============================================================================
// Service Definition
// =============================================================================

/**
 * Document analysis service
 * @since 1.0.0
 */
export class AnalysisService extends Context.Tag("effect-nlp/AnalysisService")<
  AnalysisService,
  {
    /**
     * Analyze a document and return the full analysis
     */
    readonly analyze: (doc: TextDocument) => Effect.Effect<DocumentAnalysis>;

    /**
     * Query views from an analysis
     */
    readonly queryViews: (
      analysis: DocumentAnalysis,
      query: ViewQuery
    ) => ReadonlyArray<View>;

    /**
     * Get tokens for a view
     */
    readonly getViewTokens: (
      analysis: DocumentAnalysis,
      view: View
    ) => ReadonlyArray<Token>;

    /**
     * Transform text based on analysis
     */
    readonly transform: (
      analysis: DocumentAnalysis,
      transform: Transform
    ) => Effect.Effect<string>;

    /**
     * Get linguistic statistics
     */
    readonly getStats: (analysis: DocumentAnalysis) => Record<string, any>;

    /**
     * Learn custom entity patterns for extraction
     */
    readonly learnCustomEntities: (
      patterns: ReadonlyArray<CustomEntityPattern>,
      config?: CustomEntityConfig
    ) => Effect.Effect<void>;

    /**
     * Extract all entities (both wink built-in and custom) from a document
     */
    readonly extractEntities: (
      doc: TextDocument
    ) => Effect.Effect<ReadonlyArray<UnifiedEntity>>;

    /**
     * Get unified entities from an existing analysis
     */
    readonly getUnifiedEntities: (
      analysis: DocumentAnalysis
    ) => ReadonlyArray<UnifiedEntity>;

    /**
     * Extract entities of a specific type
     */
    readonly getEntitiesByType: (
      analysis: DocumentAnalysis,
      entityType: string
    ) => ReadonlyArray<UnifiedEntity>;
  }
>() {}

// =============================================================================
// Internal Implementation
// =============================================================================

class AnalysisEngine {
  private readonly wink: any;
  private readonly its: any;
  private customEntitiesLearned: boolean = false;

  constructor() {
    // Initialize wink-nlp without plugins to enable custom entity recognition
    // Note: Including plugins like ["sbd", "pos", "ner", "negation", "sentiment"]
    // breaks custom entity learning in wink-nlp
    this.wink = winkNLP(model);
    this.its = this.wink.its;
  }

  learnCustomEntities(
    patterns: ReadonlyArray<CustomEntityPattern>,
    config: CustomEntityConfig = CustomEntityConfig.default
  ): void {
    const winkPatterns = patterns.map((p) => ({
      name: p.name,
      patterns: [...p.patterns], // Convert ReadonlyArray to regular array
    }));

    this.wink.learnCustomEntities(winkPatterns, {
      matchValue: config.matchValue,
      usePOS: config.usePOS,
      useEntity: config.useEntity,
    });

    this.customEntitiesLearned = true;
  }

  extractWinkEntities(doc: any): ReadonlyArray<UnifiedEntity> {
    const entities: Array<UnifiedEntity> = [];

    // Extract built-in entities
    const winkEntities = doc.entities().out(this.its.detail);
    for (const entity of winkEntities) {
      entities.push(
        new UnifiedEntity({
          text: entity.value || "",
          type: entity.type?.toLowerCase() || "unknown",
          charStart: entity.pos || 0,
          charEnd: (entity.pos || 0) + (entity.value?.length || 0),
          source: "wink" as const,
          metadata: {
            winkType: entity.type,
            sourceEntity: entity,
          },
        })
      );
    }

    // Extract custom entities if learned
    if (this.customEntitiesLearned) {
      const customEntities = doc.customEntities().out(this.its.detail);
      for (const entity of customEntities) {
        entities.push(
          new UnifiedEntity({
            text: entity.value || "",
            type: `custom_${entity.type?.toLowerCase() || "unknown"}`,
            charStart: entity.pos || 0,
            charEnd: (entity.pos || 0) + (entity.value?.length || 0),
            source: "wink" as const,
            metadata: {
              customType: entity.type,
              sourceEntity: entity,
              isCustom: true,
            },
          })
        );
      }
    }

    return entities;
  }

  extractCompromiseEntities(
    compDoc: any,
    _originalText: string
  ): ReadonlyArray<UnifiedEntity> {
    const entities: Array<UnifiedEntity> = [];

    // Extract different entity types from compromise
    const entityExtractors: Array<[string, string]> = [
      ["person", "people"],
      ["place", "places"],
      ["organization", "organizations"],
      ["topic", "topics"],
    ];

    for (const [entityType, method] of entityExtractors) {
      const items = (compDoc as any)[method]();
      const itemsData = items.json({ offset: true });

      for (const item of itemsData) {
        if (item.offset) {
          entities.push(
            new UnifiedEntity({
              text: item.text || "",
              type: entityType,
              charStart: item.offset.start,
              charEnd: item.offset.start + item.offset.length,
              source: "compromise" as const,
              metadata: {
                tags: item.terms?.[0]?.tags || {},
                analysis: method,
                sourceItem: item,
              },
            })
          );
        }
      }
    }

    return entities;
  }

  analyzeDocument(doc: TextDocument): DocumentAnalysis {
    const documentId = doc.id;

    // Process with wink
    const winkDoc = this.wink.readDoc(doc.text);
    const winkTokens = winkDoc.tokens();

    // Process with compromise
    const compDoc = nlp(doc.text);

    // Build tokens functionally
    interface TokenState {
      tokens: Array<Token>;
      tokenIndex: HashMap.HashMap<number, Token>;
      charPos: number;
    }

    const compTerms = compDoc
      .terms()
      .json({ offset: true, terms: { tags: true, normal: true } });

    const buildToken = (
      winkToken: ItemToken,
      idx: number,
      charPos: number
    ): [Token, number] => {
      const precedingSpaces = winkToken.out(this.its.precedingSpaces) as string;
      const value = winkToken.out(this.its.value) as string;

      const charStart = charPos + precedingSpaces.length;
      const charEnd = charStart + value.length;

      // Get wink analysis
      const winkAnalysis = {
        pos: (winkToken.out(this.its.pos) as string) || "",
        lemma: (winkToken.out(this.its.lemma) as string) || "",
        stem: (winkToken.out(this.its.stem) as string) || "",
        type: (winkToken.out(this.its.type) as string) || "",
        shape: (winkToken.out(this.its.shape) as string) || "",
        isNegated: winkToken.out(this.its.negationFlag) === "true",
        sentiment: Number(winkToken.out(this.its.sentiment)) || 0,
      };

      // Get compromise analysis
      const compAnalysis = pipe(
        compTerms,
        RA.findFirst(
          (term: any) =>
            term.offset &&
            charStart >= term.offset.start &&
            charStart < term.offset.start + term.offset.length
        ),
        Option.match({
          onNone: () => ({
            tags: [] as ReadonlyArray<string>,
            normal: value.toLowerCase(),
          }),
          onSome: (term: any) => ({
            tags: term.terms?.[0]?.tags
              ? (Object.keys(term.terms[0].tags) as ReadonlyArray<string>)
              : ([] as ReadonlyArray<string>),
            normal: (term.terms?.[0]?.normal as string) || value.toLowerCase(),
          }),
        })
      );

      const token = new Token({
        value,
        index: idx,
        charStart,
        charEnd,
        ...winkAnalysis,
        ...compAnalysis,
      });

      return [token, charEnd];
    };

    const tokenState = pipe(
      winkTokens.out(),
      RA.reduce(
        {
          tokens: [],
          tokenIndex: HashMap.empty<number, Token>(),
          charPos: 0,
        } as TokenState,
        (state, _, idx) => {
          const winkToken = winkTokens.itemAt(idx);
          const [token, newCharPos] = buildToken(winkToken, idx, state.charPos);

          return {
            tokens: [...state.tokens, token],
            tokenIndex: HashMap.set(state.tokenIndex, idx, token),
            charPos: newCharPos,
          };
        }
      )
    );

    const { tokenIndex, tokens } = tokenState;

    // Build views using a state accumulator
    interface ViewState {
      views: Array<View>;
      viewsByType: HashMap.HashMap<ViewType, ReadonlyArray<View>>;
      viewsByToken: HashMap.HashMap<number, ReadonlyArray<View>>;
      viewId: number;
    }

    const initialViewState: ViewState = {
      views: [],
      viewsByType: HashMap.empty(),
      viewsByToken: HashMap.empty(),
      viewId: 0,
    };

    // Helper to add view in functional style
    const addView = (
      state: ViewState,
      type: ViewType,
      text: string,
      charStart: number,
      charEnd: number,
      metadata: Record<string, any> = {}
    ): ViewState => {
      const tokenIndices = pipe(
        tokens,
        RA.filter(
          (t) =>
            (t.charStart >= charStart && t.charStart < charEnd) ||
            (t.charEnd > charStart && t.charEnd <= charEnd)
        ),
        RA.map((t) => t.index)
      );

      const view = new View({
        id: `view-${state.viewId}`,
        type,
        text,
        tokenIndices,
        charStart,
        charEnd,
        metadata,
      });

      return {
        views: [...state.views, view],
        viewsByType: pipe(
          HashMap.get(state.viewsByType, type),
          Option.match({
            onNone: () =>
              HashMap.set(state.viewsByType, type, [
                view,
              ] as ReadonlyArray<View>),
            onSome: (views) =>
              HashMap.set(state.viewsByType, type, [
                ...views,
                view,
              ] as ReadonlyArray<View>),
          })
        ),
        viewsByToken: pipe(
          tokenIndices,
          RA.reduce(state.viewsByToken, (acc, tokenIdx) =>
            pipe(
              HashMap.get(acc, tokenIdx),
              Option.match({
                onNone: () =>
                  HashMap.set(acc, tokenIdx, [view] as ReadonlyArray<View>),
                onSome: (views) =>
                  HashMap.set(acc, tokenIdx, [
                    ...views,
                    view,
                  ] as ReadonlyArray<View>),
              })
            )
          )
        ),
        viewId: state.viewId + 1,
      };
    };

    // Process all views functionally
    const finalViewState = pipe(
      initialViewState,
      // Add sentence views
      (state) => {
        const sentences = compDoc.sentences().out();
        return RA.reduce(
          sentences,
          state,
          (acc: ViewState, _: any, idx: number) => {
            const sentView = compDoc.sentences().eq(idx);
            const sentData = sentView.json({ offset: true })[0];
            return sentData?.offset
              ? addView(
                  acc,
                  "sentence",
                  sentView.text(),
                  sentData.offset.start,
                  sentData.offset.start + sentData.offset.length
                )
              : acc;
          }
        );
      },
      // Add term views
      (state) => {
        const terms = compDoc.terms().out();
        return RA.reduce(
          terms,
          state,
          (acc: ViewState, _: any, idx: number) => {
            const termView = compDoc.terms().eq(idx);
            const termData = termView.json({ offset: true })[0];
            return termData?.offset
              ? addView(
                  acc,
                  "term",
                  termView.text(),
                  termData.offset.start,
                  termData.offset.start + termData.offset.length,
                  { tags: termData.terms?.[0]?.tags || {} }
                )
              : acc;
          }
        );
      },
      // Add specialized views
      (state) => {
        const viewExtractors: Array<[ViewType, string]> = [
          ["verb", "verbs"],
          ["noun", "nouns"],
          ["adjective", "adjectives"],
          ["adverb", "adverbs"],
          ["person", "people"],
          ["place", "places"],
          ["organization", "organizations"],
          ["topic", "topics"],
        ];

        return RA.reduce(viewExtractors, state, (acc, [viewType, method]) => {
          const items = (compDoc as any)[method]();
          const itemsOut = items.out();
          return RA.reduce(
            itemsOut,
            acc,
            (innerAcc: ViewState, _: any, idx: number) => {
              const item = items.eq(idx);
              const itemData = item.json({ offset: true });
              return RA.reduce(
                itemData,
                innerAcc,
                (dataAcc: ViewState, data: any) => {
                  return data?.offset
                    ? addView(
                        dataAcc,
                        viewType,
                        item.text(),
                        data.offset.start,
                        data.offset.start + data.offset.length,
                        {
                          tags: data.terms?.[0]?.tags || {},
                          analysis: method,
                        }
                      )
                    : dataAcc;
                }
              );
            }
          );
        });
      }
    );

    // Extract entities from both wink and compromise
    const winkEntities = this.extractWinkEntities(winkDoc);
    const compEntities = this.extractCompromiseEntities(compDoc, doc.text);
    const allEntities = [...winkEntities, ...compEntities];

    // Build entity index by type
    const entitiesByType = pipe(
      allEntities,
      RA.reduce(
        HashMap.empty<string, ReadonlyArray<UnifiedEntity>>(),
        (acc, entity) =>
          pipe(
            HashMap.get(acc, entity.type),
            Option.match({
              onNone: () =>
                HashMap.set(acc, entity.type, [
                  entity,
                ] as ReadonlyArray<UnifiedEntity>),
              onSome: (entities) =>
                HashMap.set(acc, entity.type, [
                  ...entities,
                  entity,
                ] as ReadonlyArray<UnifiedEntity>),
            })
          )
      )
    );

    return new DocumentAnalysis({
      documentId,
      tokens,
      views: finalViewState.views,
      entities: allEntities,
      tokenIndex,
      viewsByType: finalViewState.viewsByType,
      viewsByToken: finalViewState.viewsByToken,
      entitiesByType,
    });
  }

  getCompromiseDoc(text: string): any {
    return nlp(text);
  }
}

// =============================================================================
// Service Implementation
// =============================================================================

const make = Effect.sync(() => {
  const engine = new AnalysisEngine();
  const analysisCache = new WeakMap<TextDocument, DocumentAnalysis>();

  const analyze = (doc: TextDocument): Effect.Effect<DocumentAnalysis> =>
    Effect.sync(() => {
      let analysis = analysisCache.get(doc);
      if (!analysis) {
        analysis = engine.analyzeDocument(doc);
        analysisCache.set(doc, analysis);
      }
      return analysis;
    });

  const queryViews = (
    analysis: DocumentAnalysis,
    query: ViewQuery
  ): ReadonlyArray<View> =>
    pipe(
      analysis.views,
      // Filter by type
      (views) =>
        Option.match(query.type, {
          onNone: () => views,
          onSome: (type) =>
            pipe(
              HashMap.get(analysis.viewsByType, type),
              Option.match({
                onNone: () => [] as ReadonlyArray<View>,
                onSome: (typeViews) =>
                  views.filter((v) => typeViews.includes(v)),
              })
            ),
        }),
      // Filter by pattern
      (views) =>
        Option.match(query.pattern, {
          onNone: () => views,
          onSome: (pattern) => {
            const compDoc = engine.getCompromiseDoc(
              analysis.tokens.map((t) => t.value).join(" ")
            );
            const matches = compDoc.match(pattern).json({ offset: true });

            return views.filter((view) =>
              matches.some(
                (match: any) =>
                  match.offset &&
                  view.charStart === match.offset.start &&
                  view.charEnd === match.offset.start + match.offset.length
              )
            );
          },
        }),
      // Filter by tags
      (views) =>
        Option.match(query.tags, {
          onNone: () => views,
          onSome: (requiredTags) =>
            views.filter((view) => {
              const viewTokens = getViewTokens(analysis, view);
              return requiredTags.every((tag) =>
                viewTokens.some((token) => token.tags.includes(tag))
              );
            }),
        }),
      // Filter by token predicate
      (views) =>
        Option.match(query.tokenFilter, {
          onNone: () => views,
          onSome: (filter) =>
            views.filter((view) => {
              const viewTokens = getViewTokens(analysis, view);
              return viewTokens.some(filter);
            }),
        })
    );

  const getViewTokens = (
    analysis: DocumentAnalysis,
    view: View
  ): ReadonlyArray<Token> =>
    pipe(
      view.tokenIndices,
      RA.filterMap((idx) => HashMap.get(analysis.tokenIndex, idx))
    );

  const transform = (
    analysis: DocumentAnalysis,
    transform: Transform
  ): Effect.Effect<string> =>
    Effect.sync(() => {
      const text = analysis.tokens.map((t) => t.value).join(" ");
      const compDoc = engine.getCompromiseDoc(text);

      return Transform.$match(transform, {
        Tense: ({ target }) => {
          switch (target) {
            case "past":
              return compDoc.verbs().toPastTense().text();
            case "present":
              return compDoc.verbs().toPresentTense().text();
            case "future":
              return compDoc.verbs().toFutureTense().text();
          }
        },
        Number: ({ target }) => {
          switch (target) {
            case "singular":
              return compDoc.nouns().toSingular().text();
            case "plural":
              return compDoc.nouns().toPlural().text();
          }
        },
        Case: ({ target }) => {
          switch (target) {
            case "upper":
              return compDoc.toUpperCase().text();
            case "lower":
              return compDoc.toLowerCase().text();
            case "title":
              return compDoc.toTitleCase().text();
            case "camel":
              return compDoc.toCamelCase().text();
          }
        },
        Normalize: () => compDoc.normalize().text(),
        Contract: () => compDoc.contractions().contract().text(),
        Expand: () => compDoc.contractions().expand().text(),
      });
    });

  const getStats = (analysis: DocumentAnalysis): Record<string, any> => {
    const tokens = analysis.tokens;

    // POS distribution
    const posDistribution: Record<string, number> = {};
    for (const token of tokens) {
      posDistribution[token.pos] = (posDistribution[token.pos] || 0) + 1;
    }

    // Sentiment analysis
    const sentimentSum = tokens.reduce((sum, t) => sum + t.sentiment, 0);
    const avgSentiment = sentimentSum / tokens.length;

    // View counts by type
    const viewCounts: Record<string, number> = {};
    HashMap.forEach(analysis.viewsByType, (views, type) => {
      viewCounts[type] = views.length;
    });

    return {
      tokenCount: tokens.length,
      posDistribution,
      sentiment: {
        average: avgSentiment,
        positive: tokens.filter((t) => t.sentiment > 0).length,
        negative: tokens.filter((t) => t.sentiment < 0).length,
        neutral: tokens.filter((t) => t.sentiment === 0).length,
      },
      viewCounts,
      uniqueWords: new Set(tokens.map((t) => t.normal)).size,
    };
  };

  const learnCustomEntities = (
    patterns: ReadonlyArray<CustomEntityPattern>,
    config: CustomEntityConfig = CustomEntityConfig.default
  ): Effect.Effect<void> =>
    Effect.sync(() => {
      engine.learnCustomEntities(patterns, config);
    });

  const extractEntities = (
    doc: TextDocument
  ): Effect.Effect<ReadonlyArray<UnifiedEntity>> =>
    Effect.gen(function* () {
      const analysis = yield* analyze(doc);
      return analysis.entities;
    });

  const getUnifiedEntities = (
    analysis: DocumentAnalysis
  ): ReadonlyArray<UnifiedEntity> => analysis.entities;

  const getEntitiesByType = (
    analysis: DocumentAnalysis,
    entityType: string
  ): ReadonlyArray<UnifiedEntity> =>
    pipe(
      HashMap.get(analysis.entitiesByType, entityType),
      Option.getOrElse(() => [] as ReadonlyArray<UnifiedEntity>)
    );

  return {
    analyze,
    queryViews,
    getViewTokens,
    transform,
    getStats,
    learnCustomEntities,
    extractEntities,
    getUnifiedEntities,
    getEntitiesByType,
  };
});

// =============================================================================
// Layer
// =============================================================================

export const AnalysisServiceLive = Layer.effect(AnalysisService, make);

// =============================================================================
// Data-First API Functions
// =============================================================================

/**
 * Analyze a document
 * @since 1.0.0
 */
export const analyze = (doc: TextDocument) =>
  Effect.flatMap(AnalysisService, (service) => service.analyze(doc));

/**
 * Query views from an analysis
 * @since 1.0.0
 */
export const queryViews = (query: ViewQuery) => (analysis: DocumentAnalysis) =>
  Effect.map(AnalysisService, (service) => service.queryViews(analysis, query));

/**
 * Get all views of a specific type
 * @since 1.0.0
 */
export const getViewsByType =
  (type: ViewType) => (analysis: DocumentAnalysis) =>
    Effect.map(AnalysisService, (service) =>
      service.queryViews(analysis, ViewQuery.byType(type))
    );

/**
 * Get tokens for a view
 * @since 1.0.0
 */
export const getViewTokens = (view: View) => (analysis: DocumentAnalysis) =>
  Effect.map(AnalysisService, (service) =>
    service.getViewTokens(analysis, view)
  );

/**
 * Transform text
 * @since 1.0.0
 */
export const transform =
  (transform: Transform) => (analysis: DocumentAnalysis) =>
    Effect.flatMap(AnalysisService, (service) =>
      service.transform(analysis, transform)
    );

/**
 * Get statistics
 * @since 1.0.0
 */
export const getStats = (analysis: DocumentAnalysis) =>
  Effect.map(AnalysisService, (service) => service.getStats(analysis));

/**
 * Learn custom entity patterns
 * @since 1.0.0
 */
export const learnCustomEntities = (
  patterns: ReadonlyArray<CustomEntityPattern>,
  config?: CustomEntityConfig
) =>
  Effect.flatMap(AnalysisService, (service) =>
    service.learnCustomEntities(patterns, config)
  );

/**
 * Extract all entities from a document
 * @since 1.0.0
 */
export const extractEntities = (doc: TextDocument) =>
  Effect.flatMap(AnalysisService, (service) => service.extractEntities(doc));

/**
 * Get unified entities from an analysis
 * @since 1.0.0
 */
export const getUnifiedEntities = (analysis: DocumentAnalysis) =>
  Effect.map(AnalysisService, (service) =>
    service.getUnifiedEntities(analysis)
  );

/**
 * Get entities by type
 * @since 1.0.0
 */
export const getEntitiesByType =
  (entityType: string) => (analysis: DocumentAnalysis) =>
    Effect.map(AnalysisService, (service) =>
      service.getEntitiesByType(analysis, entityType)
    );
