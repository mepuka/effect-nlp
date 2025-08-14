/**
 * End-to-End tests for real-world custom entity extraction scenarios
 * Tests complete workflows with realistic data and proper Effect patterns
 */

import { describe, it, expect } from "vitest";
import { Effect, pipe, Array as RA, HashMap } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DocumentProcessor from "../../src/NLP/DocumentProcessor.js";
import { DocumentProcessingLive } from "../../src/NLP/DocumentProcessorLive.js";

const TestLayer = DocumentProcessingLive;

describe("Real-World Custom Entity Extraction E2E", () => {
  describe("Legal Document Processing", () => {
    it("should extract legal entities from contract documents", () =>
      Effect.gen(function* () {
        // Legal domain entity patterns
        const legalPatterns = yield* Effect.sync(() => [
          Core.EntityPattern.forTerms(
            "legal_entities",
            "Legal Entities",
            Core.EntityLabels.custom("LEGAL_ENTITY"),
            ["Corporation", "LLC", "Partnership", "Trust", "Foundation"]
          ),
          Core.EntityPattern.forTerms(
            "legal_actions",
            "Legal Actions",
            Core.EntityLabels.custom("LEGAL_ACTION"),
            ["hereby", "whereas", "therefore", "notwithstanding", "pursuant"]
          ),
          Core.EntityPattern.forShorthand(
            "contract_sections",
            "Contract Sections",
            Core.EntityLabels.custom("SECTION"),
            "[Article|Section|Clause|Paragraph|Exhibit]"
          ),
        ]);

        const legalDefinition = Core.CustomEntityDefinition.create(
          "legal_document_analysis",
          "legal",
          "1.0.0",
          legalPatterns
        );

        const contractText = `
          This Agreement is entered into by TechCorp LLC and InnovateCorp Corporation.
          Article 3 hereby establishes the terms, whereas Section 5 defines obligations.
          The Partnership shall, pursuant to Clause 7, maintain the Trust as specified.
        `;

        // Process legal document with Effect error handling
        const legalAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            legalDefinition
          )(contractText).pipe(
            Effect.catchAll((error) =>
              Effect.fail(new Error(`Legal analysis failed: ${error.message}`))
            )
          );

          // Categorize legal entities using Effect.sync
          const categorization = yield* Effect.sync(() => {
            const legalEntities = entities.filter(
              (e) => e.label === "CUSTOM_LEGAL_ENTITIES"
            );
            const legalActions = entities.filter(
              (e) => e.label === "CUSTOM_LEGAL_ACTIONS"
            );
            const sections = entities.filter(
              (e) => e.label === "CUSTOM_CONTRACT_SECTIONS"
            );

            return {
              entityTypes: legalEntities.map((e) => e.text),
              legalLanguage: legalActions.map((e) => e.text),
              documentStructure: sections.map((e) => e.text),
              totalLegalElements: entities.length,
              entityPositions: entities.map((e) => ({
                text: e.text,
                type: e.label,
                position: e.offset.char,
              })),
            };
          });

          return categorization;
        });

        // Verify legal document processing
        expect(legalAnalysis.totalLegalElements).toBeGreaterThan(0);
        expect(
          legalAnalysis.entityTypes.some((entity) =>
            ["LLC", "Corporation", "Partnership", "Trust"].includes(entity)
          )
        ).toBe(true);
        expect(
          legalAnalysis.documentStructure.some((section) =>
            ["Article", "Section", "Clause"].includes(section)
          )
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Medical Report Processing", () => {
    it("should extract medical entities from clinical notes", () =>
      Effect.gen(function* () {
        // Medical domain patterns with proper Effect construction
        const createMedicalPatterns = Effect.gen(function* () {
          const symptoms = yield* Effect.sync(() =>
            Core.EntityPattern.forTerms(
              "symptoms",
              "Medical Symptoms",
              Core.EntityLabels.custom("SYMPTOM"),
              ["fever", "cough", "headache", "nausea", "fatigue", "dizziness"]
            )
          );

          const medications = yield* Effect.sync(() =>
            Core.EntityPattern.forTerms(
              "medications",
              "Medications",
              Core.EntityLabels.custom("MEDICATION"),
              [
                "aspirin",
                "ibuprofen",
                "acetaminophen",
                "amoxicillin",
                "prednisone",
              ]
            )
          );

          const procedures = yield* Effect.sync(() =>
            Core.EntityPattern.forTerms(
              "procedures",
              "Medical Procedures",
              Core.EntityLabels.custom("PROCEDURE"),
              ["X-ray", "MRI", "CT scan", "blood test", "biopsy", "ultrasound"]
            )
          );

          return [symptoms, medications, procedures];
        });

        const medicalPatterns = yield* createMedicalPatterns;

        const medicalDefinition = Core.CustomEntityDefinition.create(
          "clinical_note_analysis",
          "healthcare",
          "1.0.0",
          medicalPatterns
        );

        const clinicalNote = `
          Patient presents with fever and persistent cough. Medical history includes headache 
          and occasional nausea. Prescribed aspirin for pain relief and amoxicillin for infection.
          Ordered blood test and chest X-ray to rule out complications. Follow-up MRI if symptoms persist.
        `;

        // Extract medical entities with comprehensive analysis
        const medicalAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            medicalDefinition
          )(clinicalNote);

          // Process medical data using Effect operations
          const clinicalSummary = yield* Effect.sync(() => {
            const symptoms = entities.filter(
              (e) => e.label === "CUSTOM_SYMPTOMS"
            );
            const medications = entities.filter(
              (e) => e.label === "CUSTOM_MEDICATIONS"
            );
            const procedures = entities.filter(
              (e) => e.label === "CUSTOM_PROCEDURES"
            );

            return {
              patientSymptoms: symptoms.map((e) => e.text),
              prescribedMedications: medications.map((e) => e.text),
              orderedProcedures: procedures.map((e) => e.text),
              clinicalComplexity: entities.length,
              symptomSeverity:
                symptoms.length > 3
                  ? "high"
                  : symptoms.length > 1
                  ? "moderate"
                  : "low",
            };
          });

          // Generate clinical insights
          const insights = yield* Effect.sync(() => ({
            hasAcuteSymptoms: clinicalSummary.patientSymptoms.includes("fever"),
            requiresAntibiotics:
              clinicalSummary.prescribedMedications.includes("amoxicillin"),
            needsImaging: clinicalSummary.orderedProcedures.some((proc) =>
              ["X-ray", "MRI", "CT scan"].includes(proc)
            ),
            treatmentPlan: {
              symptoms: clinicalSummary.patientSymptoms.length,
              medications: clinicalSummary.prescribedMedications.length,
              procedures: clinicalSummary.orderedProcedures.length,
            },
          }));

          return { clinicalSummary, insights };
        });

        // Verify medical analysis
        expect(
          medicalAnalysis.clinicalSummary.clinicalComplexity
        ).toBeGreaterThan(0);
        expect(
          medicalAnalysis.clinicalSummary.patientSymptoms.length
        ).toBeGreaterThan(0);
        expect(medicalAnalysis.insights.hasAcuteSymptoms).toBe(true);
        expect(medicalAnalysis.insights.requiresAntibiotics).toBe(true);
        expect(medicalAnalysis.insights.needsImaging).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Financial News Analysis", () => {
    it("should extract financial entities from market news", () =>
      Effect.gen(function* () {
        // Financial news entity patterns
        const financialPatterns = yield* Effect.all([
          Effect.sync(() =>
            Core.EntityPattern.forTerms(
              "market_indicators",
              "Market Indicators",
              Core.EntityLabels.custom("INDICATOR"),
              [
                "bull market",
                "bear market",
                "volatility",
                "liquidity",
                "momentum",
              ]
            )
          ),
          Effect.sync(() =>
            Core.EntityPattern.forTerms(
              "financial_instruments",
              "Financial Instruments",
              Core.EntityLabels.custom("INSTRUMENT"),
              [
                "stocks",
                "bonds",
                "derivatives",
                "commodities",
                "futures",
                "options",
              ]
            )
          ),
          Effect.sync(() =>
            Core.EntityPattern.forShorthand(
              "market_movements",
              "Market Movements",
              Core.EntityLabels.custom("MOVEMENT"),
              "[surge|plunge|rally|decline|rebound|correction]"
            )
          ),
        ]);

        const financialDefinition = Core.CustomEntityDefinition.create(
          "financial_news_analysis",
          "finance",
          "1.0.0",
          financialPatterns
        );

        const marketNews = `
          The stock market experienced a significant surge today as commodities showed strong momentum.
          Bond yields declined amid volatility concerns, while derivatives trading saw increased liquidity.
          Analysts predict a potential market correction following the recent rally in tech stocks.
          Options trading volume spiked as investors sought protection against further market plunge.
        `;

        // Comprehensive financial analysis with Effect patterns
        const financialAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            financialDefinition
          )(marketNews);

          // Market sentiment analysis using Effect.sync
          const sentimentAnalysis = yield* Effect.sync(() => {
            const indicators = entities.filter(
              (e) => e.label === "CUSTOM_MARKET_INDICATORS"
            );
            const instruments = entities.filter(
              (e) => e.label === "CUSTOM_FINANCIAL_INSTRUMENTS"
            );
            const movements = entities.filter(
              (e) => e.label === "CUSTOM_MARKET_MOVEMENTS"
            );

            const positiveMovements = movements.filter((e) =>
              ["surge", "rally", "rebound"].includes(e.text)
            ).length;

            const negativeMovements = movements.filter((e) =>
              ["plunge", "decline", "correction"].includes(e.text)
            ).length;

            return {
              marketIndicators: indicators.map((e) => e.text),
              tradedInstruments: instruments.map((e) => e.text),
              marketMovements: movements.map((e) => e.text),
              sentimentScore: positiveMovements - negativeMovements,
              marketActivity:
                entities.length > 10
                  ? "high"
                  : entities.length > 5
                  ? "moderate"
                  : "low",
            };
          });

          // Risk assessment
          const riskAssessment = yield* Effect.sync(() => ({
            volatilityMentioned:
              sentimentAnalysis.marketIndicators.includes("volatility"),
            hasNegativeMovements: negativeMovements > 0,
            diversifiedInstruments:
              sentimentAnalysis.tradedInstruments.length > 3,
            overallRisk:
              sentimentAnalysis.sentimentScore < 0
                ? "high"
                : sentimentAnalysis.sentimentScore === 0
                ? "moderate"
                : "low",
          }));

          return { sentimentAnalysis, riskAssessment };
        });

        // Verify financial news analysis
        expect(
          financialAnalysis.sentimentAnalysis.marketActivity
        ).toBeDefined();
        expect(
          financialAnalysis.sentimentAnalysis.tradedInstruments.length
        ).toBeGreaterThan(0);
        expect(financialAnalysis.riskAssessment.volatilityMentioned).toBe(true);
        expect(
          financialAnalysis.sentimentAnalysis.marketMovements.some((movement) =>
            ["surge", "decline", "rally", "correction", "plunge"].includes(
              movement
            )
          )
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Academic Research Paper Analysis", () => {
    it("should extract research entities from academic abstracts", () =>
      Effect.gen(function* () {
        // Academic research patterns with Effect error handling
        const createResearchPatterns = Effect.gen(function* () {
          const methodologies = yield* Effect.try({
            try: () =>
              Core.EntityPattern.forTerms(
                "research_methods",
                "Research Methodologies",
                Core.EntityLabels.custom("METHOD"),
                [
                  "regression",
                  "classification",
                  "clustering",
                  "optimization",
                  "simulation",
                ]
              ),
            catch: (error) =>
              new Error(`Failed to create methodology pattern: ${error}`),
          });

          const metrics = yield* Effect.try({
            try: () =>
              Core.EntityPattern.forTerms(
                "performance_metrics",
                "Performance Metrics",
                Core.EntityLabels.custom("METRIC"),
                ["accuracy", "precision", "recall", "F1-score", "AUC", "RMSE"]
              ),
            catch: (error) =>
              new Error(`Failed to create metrics pattern: ${error}`),
          });

          const domains = yield* Effect.try({
            try: () =>
              Core.EntityPattern.forShorthand(
                "research_domains",
                "Research Domains",
                Core.EntityLabels.custom("DOMAIN"),
                "[machine learning|deep learning|natural language processing|computer vision|robotics]"
              ),
            catch: (error) =>
              new Error(`Failed to create domain pattern: ${error}`),
          });

          return [methodologies, metrics, domains];
        });

        const researchPatterns = yield* createResearchPatterns;

        const researchDefinition = Core.CustomEntityDefinition.create(
          "academic_paper_analysis",
          "research",
          "1.0.0",
          researchPatterns
        );

        const academicAbstract = `
          This paper presents a novel deep learning approach for natural language processing tasks.
          Our methodology combines regression and classification techniques with advanced optimization algorithms.
          Experimental results show improved accuracy and precision compared to baseline methods.
          The proposed clustering algorithm achieves superior F1-score and AUC metrics in machine learning benchmarks.
        `;

        // Academic analysis with Effect composition
        const academicAnalysis = yield* Effect.gen(function* () {
          const entities = yield* DocumentProcessor.extractCustomEntities(
            researchDefinition
          )(academicAbstract);

          // Research paper insights
          const researchInsights = yield* Effect.sync(() => {
            const methods = entities.filter(
              (e) => e.label === "CUSTOM_RESEARCH_METHODS"
            );
            const metrics = entities.filter(
              (e) => e.label === "CUSTOM_PERFORMANCE_METRICS"
            );
            const domains = entities.filter(
              (e) => e.label === "CUSTOM_RESEARCH_DOMAINS"
            );

            return {
              researchMethodologies: methods.map((e) => e.text),
              evaluationMetrics: metrics.map((e) => e.text),
              researchDomains: domains.map((e) => e.text),
              methodologyComplexity: methods.length,
              evaluationRigor: metrics.length,
              interdisciplinary: domains.length > 1,
            };
          });

          // Academic quality assessment
          const qualityAssessment = yield* Effect.sync(() => ({
            hasQuantitativeMetrics:
              researchInsights.evaluationMetrics.length > 2,
            usesMultipleMethods:
              researchInsights.researchMethodologies.length > 1,
            domainSpecific: researchInsights.researchDomains.length > 0,
            researchQuality:
              researchInsights.methodologyComplexity +
                researchInsights.evaluationRigor >
              4
                ? "high"
                : "moderate",
          }));

          return { researchInsights, qualityAssessment };
        });

        // Verify academic analysis
        expect(
          academicAnalysis.researchInsights.methodologyComplexity
        ).toBeGreaterThan(0);
        expect(
          academicAnalysis.researchInsights.evaluationRigor
        ).toBeGreaterThan(0);
        expect(academicAnalysis.qualityAssessment.hasQuantitativeMetrics).toBe(
          true
        );
        expect(academicAnalysis.researchInsights.researchDomains).toContain(
          "deep learning"
        );
        expect(academicAnalysis.researchInsights.researchDomains).toContain(
          "natural language processing"
        );
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("E-commerce Product Analysis", () => {
    it("should extract product entities from e-commerce descriptions", () =>
      Effect.gen(function* () {
        // E-commerce entity patterns
        const ecommercePatterns = yield* Effect.all([
          Effect.succeed(
            Core.EntityPattern.forShorthand(
              "product_attributes",
              "Product Attributes",
              Core.EntityLabels.custom("ATTRIBUTE"),
              "[wireless|waterproof|lightweight|portable|durable|eco-friendly]"
            )
          ),
          Effect.succeed(
            Core.EntityPattern.forShorthand(
              "product_categories",
              "Product Categories",
              Core.EntityLabels.custom("CATEGORY"),
              "[electronics|clothing|home|sports|automotive|books]"
            )
          ),
          Effect.succeed(
            Core.EntityPattern.forTerms(
              "brand_indicators",
              "Brand Indicators",
              Core.EntityLabels.custom("BRAND"),
              [
                "premium",
                "luxury",
                "budget",
                "professional",
                "consumer",
                "enterprise",
              ]
            )
          ),
        ]);

        const ecommerceDefinition = Core.CustomEntityDefinition.create(
          "product_catalog_analysis",
          "ecommerce",
          "1.0.0",
          ecommercePatterns
        );

        const productDescriptions = [
          "Premium wireless headphones with waterproof design for sports enthusiasts.",
          "Lightweight portable electronics perfect for professional use.",
          "Eco-friendly home products with durable construction and luxury finish.",
          "Budget-friendly clothing line featuring portable and comfortable designs.",
        ];

        // Process multiple product descriptions concurrently
        const ecommerceAnalysis = yield* Effect.gen(function* () {
          const allProductAnalyses = yield* Effect.all(
            productDescriptions.map((description) =>
              Effect.gen(function* () {
                const entities = yield* DocumentProcessor.extractCustomEntities(
                  ecommerceDefinition
                )(description);

                return yield* Effect.sync(() => ({
                  description,
                  attributes: entities
                    .filter((e) => e.label === "CUSTOM_PRODUCT_ATTRIBUTES")
                    .map((e) => e.text),
                  categories: entities
                    .filter((e) => e.label === "CUSTOM_PRODUCT_CATEGORIES")
                    .map((e) => e.text),
                  brandLevel: entities
                    .filter((e) => e.label === "CUSTOM_BRAND_INDICATORS")
                    .map((e) => e.text),
                  totalFeatures: entities.length,
                }));
              })
            ),
            { concurrency: 2 }
          );

          // Aggregate e-commerce insights
          const aggregatedInsights = yield* Effect.sync(() => {
            const allAttributes = allProductAnalyses.flatMap(
              (p) => p.attributes
            );
            const allCategories = allProductAnalyses.flatMap(
              (p) => p.categories
            );
            const allBrandLevels = allProductAnalyses.flatMap(
              (p) => p.brandLevel
            );

            return {
              totalProducts: productDescriptions.length,
              uniqueAttributes: [...new Set(allAttributes)],
              uniqueCategories: [...new Set(allCategories)],
              brandDistribution: allBrandLevels.reduce((acc, brand) => {
                acc[brand] = (acc[brand] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              avgFeaturesPerProduct:
                allProductAnalyses.reduce(
                  (sum, p) => sum + p.totalFeatures,
                  0
                ) / allProductAnalyses.length,
            };
          });

          return { productAnalyses: allProductAnalyses, aggregatedInsights };
        });

        // Verify e-commerce analysis
        expect(ecommerceAnalysis.aggregatedInsights.totalProducts).toBe(4);
        expect(
          ecommerceAnalysis.aggregatedInsights.uniqueAttributes.length
        ).toBeGreaterThan(0);
        expect(ecommerceAnalysis.aggregatedInsights.uniqueAttributes).toContain(
          "wireless"
        );
        expect(ecommerceAnalysis.aggregatedInsights.uniqueAttributes).toContain(
          "waterproof"
        );
        expect(
          ecommerceAnalysis.productAnalyses.every((p) => p.totalFeatures >= 0)
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Social Media Content Analysis", () => {
    it("should extract sentiment and topic entities from social posts", () =>
      Effect.gen(function* () {
        // Social media patterns with proper Effect construction
        const socialPatterns = yield* Effect.sync(() => [
          Core.EntityPattern.forTerms(
            "sentiment_indicators",
            "Sentiment Indicators",
            Core.EntityLabels.custom("SENTIMENT"),
            [
              "amazing",
              "terrible",
              "love",
              "hate",
              "excited",
              "disappointed",
              "awesome",
              "awful",
            ]
          ),
          Core.EntityPattern.forTerms(
            "social_topics",
            "Social Topics",
            Core.EntityLabels.custom("TOPIC"),
            [
              "technology",
              "politics",
              "sports",
              "entertainment",
              "food",
              "travel",
              "health",
              "education",
            ]
          ),
          Core.EntityPattern.forShorthand(
            "engagement_terms",
            "Engagement Terms",
            Core.EntityLabels.custom("ENGAGEMENT"),
            "[like|share|comment|retweet|follow|subscribe]"
          ),
        ]);

        const socialDefinition = Core.CustomEntityDefinition.create(
          "social_media_analysis",
          "social_media",
          "1.0.0",
          socialPatterns
        );

        const socialPosts = [
          "Amazing new technology! Love this innovation. Please like and share!",
          "Terrible experience with this food delivery. Really disappointed. Won't retweet.",
          "Excited about the sports game tonight! Awesome entertainment. Follow for updates!",
          "The travel experience was awful. Hate when things go wrong. Comment below.",
        ];

        // Social media sentiment analysis
        const socialAnalysis = yield* Effect.gen(function* () {
          const postAnalyses = yield* Effect.all(
            socialPosts.map((post, index) =>
              Effect.gen(function* () {
                const entities = yield* DocumentProcessor.extractCustomEntities(
                  socialDefinition
                )(post);

                const sentimentAnalysis = yield* Effect.sync(() => {
                  const sentiments = entities.filter(
                    (e) => e.label === "CUSTOM_SENTIMENT_INDICATORS"
                  );
                  const topics = entities.filter(
                    (e) => e.label === "CUSTOM_SOCIAL_TOPICS"
                  );
                  const engagement = entities.filter(
                    (e) => e.label === "CUSTOM_ENGAGEMENT_TERMS"
                  );

                  const positiveWords = sentiments.filter((s) =>
                    ["amazing", "love", "excited", "awesome"].includes(s.text)
                  ).length;

                  const negativeWords = sentiments.filter((s) =>
                    ["terrible", "hate", "disappointed", "awful"].includes(
                      s.text
                    )
                  ).length;

                  return {
                    postIndex: index,
                    sentimentWords: sentiments.map((s) => s.text),
                    topicWords: topics.map((t) => t.text),
                    engagementCalls: engagement.map((e) => e.text),
                    sentimentScore: positiveWords - negativeWords,
                    overallSentiment:
                      positiveWords > negativeWords
                        ? "positive"
                        : negativeWords > positiveWords
                        ? "negative"
                        : "neutral",
                  };
                });

                return sentimentAnalysis;
              })
            )
          );

          // Aggregate social media insights
          const socialInsights = yield* Effect.sync(() => {
            const totalPosts = postAnalyses.length;
            const positivePosts = postAnalyses.filter(
              (p) => p.overallSentiment === "positive"
            ).length;
            const negativePosts = postAnalyses.filter(
              (p) => p.overallSentiment === "negative"
            ).length;

            const allTopics = postAnalyses.flatMap((p) => p.topicWords);
            const allEngagement = postAnalyses.flatMap(
              (p) => p.engagementCalls
            );

            return {
              totalPosts,
              sentimentDistribution: {
                positive: positivePosts,
                negative: negativePosts,
                neutral: totalPosts - positivePosts - negativePosts,
              },
              popularTopics: [...new Set(allTopics)],
              engagementTypes: [...new Set(allEngagement)],
              avgSentimentScore:
                postAnalyses.reduce((sum, p) => sum + p.sentimentScore, 0) /
                totalPosts,
            };
          });

          return { postAnalyses, socialInsights };
        });

        // Verify social media analysis
        expect(socialAnalysis.socialInsights.totalPosts).toBe(4);
        expect(
          socialAnalysis.socialInsights.sentimentDistribution.positive
        ).toBeGreaterThan(0);
        expect(
          socialAnalysis.socialInsights.sentimentDistribution.negative
        ).toBeGreaterThan(0);
        expect(
          socialAnalysis.socialInsights.popularTopics.some((topic) =>
            ["technology", "food", "sports", "travel"].includes(topic)
          )
        ).toBe(true);
        expect(
          socialAnalysis.postAnalyses.every(
            (p) => typeof p.sentimentScore === "number"
          )
        ).toBe(true);
      }).pipe(Effect.provide(TestLayer)));
  });
});
