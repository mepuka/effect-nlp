/**
 * End-to-end tests for complete custom entity workflows
 */

import { describe, it, expect } from "@effect/vitest";
import { Effect, pipe, Duration } from "effect";
import * as Core from "../../src/NLP/Core.js";
import * as DP from "../../src/NLP/DocumentProcessor.js";
import * as Live from "../../src/NLP/DocumentProcessorLive.js";

describe("Custom Entity E2E Workflows", () => {
  const TestLayer = Live.DocumentProcessingLive;

  describe("Technology Domain Analysis Workflow", () => {
    it("should perform complete tech entity analysis", () =>
      Effect.gen(function* () {
        // Step 1: Define comprehensive tech domain patterns
        const techCompanies = Core.EntityPattern.forTerms(
          "tech_companies",
          "Technology Companies",
          "ORGANIZATION",
          [
            "Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla",
            "Netflix", "Adobe", "Salesforce", "Oracle", "IBM", "Intel",
            "NVIDIA", "AMD", "Cisco", "VMware"
          ]
        );

        const programmingLanguages = Core.EntityPattern.forTerms(
          "programming_languages",
          "Programming Languages",
          "MISC",
          [
            "TypeScript", "JavaScript", "Python", "Java", "C++", "Rust",
            "Go", "Swift", "Kotlin", "C#", "Ruby", "PHP", "Scala"
          ]
        );

        const frameworks = Core.EntityPattern.forTerms(
          "frameworks",
          "Frameworks and Libraries",
          "MISC",
          [
            "React", "Vue", "Angular", "Node.js", "Express", "Django",
            "Flask", "Spring", "Laravel", "Rails", "TensorFlow", "PyTorch"
          ]
        );

        const cloudServices = Core.EntityPattern.forTerms(
          "cloud_services",
          "Cloud Services",
          "MISC",
          [
            "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
            "Firebase", "Heroku", "Vercel", "Netlify"
          ]
        );

        const techDefinition = Core.CustomEntityDefinition.create(
          "comprehensive_tech",
          "technology",
          "2.0.0",
          [techCompanies, programmingLanguages, frameworks, cloudServices],
          {
            description: "Comprehensive technology domain entity recognition",
            config: Core.CustomEntityConfig.create({
              matchValue: false,
              usePOS: true,
              useEntity: true
            })
          }
        );

        // Step 2: Process complex tech document
        const techDocument = `
          Apple announced new Swift programming language features at WWDC 2024.
          The company's iOS team, led by senior engineers from Cupertino,
          demonstrated React Native integration with TypeScript support.
          
          Microsoft Azure now offers enhanced Docker container orchestration
          through Kubernetes clusters. The $2.5 billion investment in cloud
          infrastructure includes partnerships with Google Cloud and AWS.
          
          Meta's AI research division released PyTorch 2.0 with improved
          TensorFlow compatibility. The framework supports both Python and
          JavaScript runtime environments on Node.js platforms.
          
          Netflix engineering teams migrated their Spring Boot microservices
          to Rust-based implementations, achieving 40% performance improvements.
          The transition involved Docker containerization and Vercel deployment.
        `;

        // Step 3: Learn custom entities and process document
        const processor = yield* DP.DocumentProcessorService;
        yield* processor.learnCustomEntities(techDefinition);
        
        const document = yield* processor.processWithCustomEntities(
          techDocument,
          techDefinition
        );

        // Step 4: Analyze entities using Effect-style operations
        const allEntities = document.getEntities();
        
        const techCompanyEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION),
          Core.E.sortByPosition
        );

        const programmingLangEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.MISC),
          Core.E.filterByTextPattern(/^(TypeScript|JavaScript|Python|Java|Swift|Rust)$/),
          Core.E.sortByTextLength
        );

        const frameworkEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.MISC),
          Core.E.filterByTextPattern(/^(React|Vue|Angular|Django|Spring|PyTorch|TensorFlow)/)
        );

        // Step 5: Generate comprehensive analysis
        const entityCounts = pipe(allEntities, Core.E.countByLabel);
        const uniqueLabels = pipe(allEntities, Core.E.getUniqueLabels);
        
        const analysis = {
          documentStats: {
            totalEntities: allEntities.length,
            uniqueEntityTypes: uniqueLabels.length,
            techCompanies: techCompanyEntities.length,
            programmingLanguages: programmingLangEntities.length,
            frameworks: frameworkEntities.length
          },
          discoveredTech: {
            companies: techCompanyEntities.map(e => e.text),
            languages: programmingLangEntities.map(e => e.text),
            frameworks: frameworkEntities.map(e => e.text)
          },
          entityDistribution: Object.fromEntries(entityCounts)
        };

        // Step 6: Validate comprehensive results
        expect(analysis.documentStats.totalEntities).toBeGreaterThan(10);
        expect(analysis.documentStats.techCompanies).toBeGreaterThanOrEqual(3);
        expect(analysis.documentStats.programmingLanguages).toBeGreaterThanOrEqual(3);
        expect(analysis.documentStats.frameworks).toBeGreaterThanOrEqual(2);

        expect(analysis.discoveredTech.companies).toContain("Apple");
        expect(analysis.discoveredTech.companies).toContain("Microsoft");
        expect(analysis.discoveredTech.companies).toContain("Meta");

        expect(analysis.discoveredTech.languages).toContain("Swift");
        expect(analysis.discoveredTech.languages).toContain("TypeScript");
        expect(analysis.discoveredTech.languages).toContain("Python");

        return analysis;
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Multi-Domain Entity Recognition Workflow", () => {
    it("should handle multiple domains simultaneously", () =>
      Effect.gen(function* () {
        // Define multiple domain patterns
        const medicalEntities = Core.CustomEntityDefinition.create(
          "medical_domain",
          "healthcare",
          "1.0.0",
          [
            Core.EntityPattern.forTerms("conditions", "Medical Conditions", "MISC",
              ["diabetes", "hypertension", "asthma", "COVID-19"]),
            Core.EntityPattern.forTerms("medications", "Medications", "MISC",
              ["aspirin", "metformin", "lisinopril", "insulin"]),
            Core.EntityPattern.forTerms("professionals", "Medical Professionals", "PERSON",
              ["Dr.", "Doctor", "Physician", "Nurse", "Surgeon"])
          ]
        );

        const financialEntities = Core.CustomEntityDefinition.create(
          "financial_domain",
          "finance",
          "1.0.0",
          [
            Core.EntityPattern.forTerms("institutions", "Financial Institutions", "ORGANIZATION",
              ["Goldman Sachs", "JPMorgan Chase", "Bank of America", "Wells Fargo"]),
            Core.EntityPattern.forRegex("instruments", "Financial Instruments", "MISC",
              "\\b(stock|bond|ETF|derivative|commodity)s?\\b", ["stocks", "bonds"]),
            Core.EntityPattern.forRegex("currencies", "Currencies", "MONEY",
              "\\b(USD|EUR|GBP|bitcoin|ethereum)\\b", ["USD", "bitcoin"])
          ]
        );

        const legalEntities = Core.CustomEntityDefinition.create(
          "legal_domain",
          "legal",
          "1.0.0",
          [
            Core.EntityPattern.forTerms("courts", "Courts", "ORGANIZATION",
              ["Supreme Court", "District Court", "Court of Appeals"]),
            Core.EntityPattern.forTerms("legal_terms", "Legal Terms", "MISC",
              ["contract", "litigation", "settlement", "injunction", "precedent"]),
            Core.EntityPattern.forTerms("legal_professionals", "Legal Professionals", "PERSON",
              ["Judge", "Attorney", "Lawyer", "Counsel", "Prosecutor"])
          ]
        );

        // Complex multi-domain document
        const multiDomainText = `
          Medical Breakthrough: Dr. Sarah Johnson, a leading physician at Johns Hopkins,
          announced breakthrough diabetes treatment using insulin-based therapy.
          The research, funded by Goldman Sachs healthcare investments worth $50 million USD,
          shows promising results for hypertension management.

          Legal Update: The Supreme Court ruling on healthcare litigation affects
          pharmaceutical contracts. Attorney Michael Chen represents patients in
          the settlement negotiations, while Judge Roberts oversees the proceedings.

          Financial Impact: JPMorgan Chase analysts predict healthcare stocks will
          rise 15% following the medical breakthrough. Bitcoin and ethereum markets
          also showed positive correlation with pharmaceutical bonds and derivatives.
        `;

        // Process with each domain
        const processor = yield* DP.DocumentProcessorService;
        
        // Learn all domain entities
        yield* processor.learnCustomEntities(medicalEntities);
        yield* processor.learnCustomEntities(financialEntities);
        yield* processor.learnCustomEntities(legalEntities);

        // Process document
        const document = yield* processor.process(multiDomainText);
        const allEntities = document.getEntities();

        // Analyze by domain using custom filtering
        const medicalTerms = pipe(
          allEntities,
          Core.E.filterByTextPattern(/(diabetes|insulin|hypertension|physician|Dr\.|Doctor)/i)
        );

        const financialTerms = pipe(
          allEntities,
          Core.E.filterByTextPattern(/(Goldman Sachs|JPMorgan|stocks|bitcoin|ethereum|USD)/i)
        );

        const legalTerms = pipe(
          allEntities,
          Core.E.filterByTextPattern(/(Supreme Court|litigation|settlement|Attorney|Judge)/i)
        );

        // Cross-domain analysis
        const organizationEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION)
        );

        const personEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.PERSON)
        );

        const moneyEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.MONEY)
        );

        const multiDomainAnalysis = {
          totalEntities: allEntities.length,
          domainBreakdown: {
            medical: medicalTerms.length,
            financial: financialTerms.length,
            legal: legalTerms.length
          },
          entityTypeBreakdown: {
            organizations: organizationEntities.length,
            people: personEntities.length,
            money: moneyEntities.length
          },
          crossDomainEntities: {
            medicalOrganizations: pipe(
              organizationEntities,
              Core.E.filterByTextPattern(/Hopkins|pharmaceutical/i)
            ).length,
            financialPeople: pipe(
              personEntities,
              Core.E.filterByTextPattern(/analyst|investor/i)
            ).length,
            legalMoney: pipe(
              moneyEntities,
              Core.E.filterByTextPattern(/settlement|damages/i)
            ).length
          }
        };

        // Validate multi-domain results
        expect(multiDomainAnalysis.totalEntities).toBeGreaterThan(15);
        expect(multiDomainAnalysis.domainBreakdown.medical).toBeGreaterThan(0);
        expect(multiDomainAnalysis.domainBreakdown.financial).toBeGreaterThan(0);
        expect(multiDomainAnalysis.domainBreakdown.legal).toBeGreaterThan(0);
        expect(multiDomainAnalysis.entityTypeBreakdown.organizations).toBeGreaterThan(0);
        expect(multiDomainAnalysis.entityTypeBreakdown.people).toBeGreaterThan(0);

        return multiDomainAnalysis;
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Real-World Document Processing Workflow", () => {
    it("should process realistic business document", () =>
      Effect.gen(function* () {
        // Create business-focused entity definition
        const businessDefinition = Core.CustomEntityDefinition.create(
          "business_analysis",
          "business",
          "1.0.0",
          [
            Core.EntityPattern.forTerms("tech_companies", "Technology Companies", "ORGANIZATION",
              ["Apple", "Microsoft", "Google", "Amazon", "Tesla", "Meta"]),
            Core.EntityPattern.forTerms("executives", "Business Executives", "PERSON",
              ["CEO", "CFO", "CTO", "President", "Chairman", "Director"]),
            Core.EntityPattern.forRegex("financial_metrics", "Financial Metrics", "MISC",
              "\\b(revenue|profit|EBITDA|market cap|valuation)\\b", ["revenue", "profit"]),
            Core.EntityPattern.forRegex("business_terms", "Business Terms", "MISC",
              "\\b(merger|acquisition|IPO|partnership|investment|funding)\\b", ["merger", "IPO"])
          ]
        );

        const businessDocument = `
          QUARTERLY BUSINESS REPORT - Q4 2024

          Executive Summary:
          Apple Inc. reported record quarterly revenue of $123.9 billion, exceeding
          analyst expectations by 8.2%. CEO Tim Cook highlighted strong iPhone sales
          in international markets, particularly in Europe and Asia.

          Strategic Developments:
          Microsoft announced a major acquisition of a cloud computing startup for
          $2.8 billion, expanding their Azure platform capabilities. The deal,
          approved by President Brad Smith, is expected to close in Q1 2025.

          Market Analysis:
          Tesla's market cap reached $800 billion following successful Model Y
          production milestones in Shanghai and Berlin facilities. CFO Zachary
          Kirkhorn reported 35% increase in automotive revenue year-over-year.

          Investment Activity:
          Google's parent company Alphabet invested $500 million in AI research
          partnerships. The funding round, led by CTO Sundar Pichai, focuses on
          machine learning applications for healthcare and finance sectors.

          Future Outlook:
          Amazon Web Services division plans major expansion with $1.2 billion
          investment in data center infrastructure. Chairman Jeff Bezos emphasized
          the strategic importance of cloud computing in the company's growth.
        `;

        // Process document with custom entities
        const processor = yield* DP.DocumentProcessorService;
        yield* processor.learnCustomEntities(businessDefinition);
        
        const document = yield* processor.processWithCustomEntities(
          businessDocument,
          businessDefinition
        );

        // Comprehensive business analysis
        const allEntities = document.getEntities();
        
        const companyEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.ORGANIZATION),
          Core.E.sortByPosition
        );

        const executiveEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.PERSON),
          Core.E.sortByPosition
        );

        const financialEntities = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.MONEY),
          Core.E.sortByTextLength
        );

        const businessMetrics = pipe(
          allEntities,
          Core.E.filterByLabel(Core.EntityLabels.MISC),
          Core.E.filterByTextPattern(/revenue|profit|market cap|acquisition|investment/i)
        );

        // Generate business intelligence report
        const businessIntelligence = {
          documentMetrics: {
            totalEntities: allEntities.length,
            companiesMentioned: companyEntities.length,
            executivesNamed: executiveEntities.length,
            financialFigures: financialEntities.length,
            businessTerms: businessMetrics.length
          },
          keyCompanies: companyEntities.map(e => e.text).filter((name, index, arr) => 
            arr.indexOf(name) === index // Remove duplicates
          ),
          seniorExecutives: executiveEntities.map(e => e.text).filter((name, index, arr) =>
            arr.indexOf(name) === index
          ),
          financialHighlights: financialEntities.map(e => e.text),
          strategicInitiatives: businessMetrics.map(e => e.text).filter((term, index, arr) =>
            arr.indexOf(term) === index
          )
        };

        // Validate comprehensive business analysis
        expect(businessIntelligence.documentMetrics.totalEntities).toBeGreaterThan(20);
        expect(businessIntelligence.keyCompanies).toContain("Apple");
        expect(businessIntelligence.keyCompanies).toContain("Microsoft");
        expect(businessIntelligence.keyCompanies).toContain("Tesla");
        expect(businessIntelligence.keyCompanies).toContain("Google");
        expect(businessIntelligence.keyCompanies).toContain("Amazon");

        expect(businessIntelligence.seniorExecutives.length).toBeGreaterThan(3);
        expect(businessIntelligence.financialHighlights.length).toBeGreaterThan(5);

        // Verify financial figures are properly extracted
        const hasLargeAmounts = businessIntelligence.financialHighlights.some(amount =>
          amount.includes("billion")
        );
        expect(hasLargeAmounts).toBe(true);

        return businessIntelligence;
      }).pipe(Effect.provide(TestLayer)));
  });

  describe("Performance and Scale Workflow", () => {
    it("should handle high-volume entity processing efficiently", () =>
      Effect.gen(function* () {
        // Create large-scale entity definition
        const patterns = [];
        
        // Add 20 different pattern categories
        const categories = [
          { name: "tech_companies", label: "ORGANIZATION", terms: ["Apple", "Microsoft", "Google", "Amazon", "Meta"] },
          { name: "auto_companies", label: "ORGANIZATION", terms: ["Tesla", "Ford", "BMW", "Toyota", "Honda"] },
          { name: "finance_companies", label: "ORGANIZATION", terms: ["Goldman Sachs", "JPMorgan", "Wells Fargo", "Citigroup"] },
          { name: "programming_languages", label: "MISC", terms: ["TypeScript", "Python", "Java", "Rust", "Go"] },
          { name: "frameworks", label: "MISC", terms: ["React", "Angular", "Vue", "Django", "Spring"] },
          { name: "databases", label: "MISC", terms: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"] },
          { name: "cloud_services", label: "MISC", terms: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes"] },
          { name: "cities", label: "LOCATION", terms: ["San Francisco", "New York", "London", "Tokyo", "Berlin"] },
          { name: "countries", label: "LOCATION", terms: ["United States", "Germany", "Japan", "United Kingdom"] },
          { name: "executives", label: "PERSON", terms: ["CEO", "CTO", "CFO", "President", "Chairman"] }
        ];

        categories.forEach((category, index) => {
          patterns.push(
            Core.EntityPattern.forTerms(
              `${category.name}_${index}`,
              category.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              category.label as any,
              category.terms
            )
          );
        });

        const largeScaleDefinition = Core.CustomEntityDefinition.create(
          "large_scale_test",
          "comprehensive",
          "1.0.0",
          patterns
        );

        // Generate large document with many entity mentions
        const documentSections = [];
        for (let i = 0; i < 50; i++) {
          documentSections.push(`
            Section ${i + 1}: Apple and Microsoft collaborate on TypeScript development.
            The CEO announced partnerships with Google Cloud and AWS for React applications.
            Tesla's CTO discussed PostgreSQL optimization in San Francisco offices.
            Goldman Sachs invested in Django-based fintech solutions in New York.
          `);
        }
        const largeDocument = documentSections.join("\n");

        // Measure processing performance
        const startTime = Date.now();
        
        const processor = yield* DP.DocumentProcessorService;
        yield* processor.learnCustomEntities(largeScaleDefinition);
        
        const entities = yield* pipe(
          largeDocument,
          DP.extractCustomEntities(largeScaleDefinition)
        );
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Analyze performance results
        const performanceMetrics = {
          documentSize: largeDocument.length,
          totalEntities: entities.length,
          processingTimeMs: processingTime,
          entitiesPerSecond: (entities.length / processingTime) * 1000,
          charactersPerSecond: (largeDocument.length / processingTime) * 1000,
          patternsUsed: largeScaleDefinition.patternCount
        };

        // Group entities for analysis
        const entityGroups = pipe(entities, Core.E.groupByLabel);
        const organizationCount = entityGroups.get("ORGANIZATION")?.value?.length || 0;
        const locationCount = entityGroups.get("LOCATION")?.value?.length || 0;
        const miscCount = entityGroups.get("MISC")?.value?.length || 0;
        const personCount = entityGroups.get("PERSON")?.value?.length || 0;

        // Performance validations
        expect(performanceMetrics.totalEntities).toBeGreaterThan(100);
        expect(performanceMetrics.processingTimeMs).toBeLessThan(10000); // Less than 10 seconds
        expect(performanceMetrics.entitiesPerSecond).toBeGreaterThan(10); // At least 10 entities/sec
        
        expect(organizationCount).toBeGreaterThan(0);
        expect(locationCount).toBeGreaterThan(0);
        expect(miscCount).toBeGreaterThan(0);
        expect(personCount).toBeGreaterThan(0);

        return performanceMetrics;
      }).pipe(
        Effect.provide(TestLayer),
        Effect.timeout(Duration.seconds(30)) // 30 second timeout
      ));
  });

  describe("Error Recovery and Resilience Workflow", () => {
    it("should handle various error conditions gracefully", () =>
      Effect.gen(function* () {
        const processor = yield* DP.DocumentProcessorService;

        // Test cases with different error conditions
        const errorTestCases = [
          {
            name: "Empty patterns",
            definition: Core.CustomEntityDefinition.create("empty", "test", "1.0.0", []),
            text: "Test text",
            expectedError: "EntityPatternError"
          },
          {
            name: "Invalid regex",
            definition: Core.CustomEntityDefinition.create(
              "invalid_regex",
              "test",
              "1.0.0",
              [Core.EntityPattern.forRegex("bad", "Bad Pattern", "MISC", "[unclosed", [])]
            ),
            text: "Test text",
            expectedError: "EntityPatternError"
          },
          {
            name: "Valid definition with empty text",
            definition: Core.CustomEntityDefinition.create(
              "valid",
              "test", 
              "1.0.0",
              [Core.EntityPattern.forTerms("test", "Test", "MISC", ["test"])]
            ),
            text: "",
            expectedError: null
          },
          {
            name: "Valid definition with special characters",
            definition: Core.CustomEntityDefinition.create(
              "special",
              "test",
              "1.0.0",
              [Core.EntityPattern.forTerms("special", "Special", "MISC", ["test"])]
            ),
            text: "Special characters: 北京 café résumé naïve Zürich",
            expectedError: null
          }
        ];

        const results = [];

        for (const testCase of errorTestCases) {
          const result = yield* Effect.gen(function* () {
            if (testCase.expectedError) {
              // Expect this to fail
              const validationResult = yield* processor.validateEntityDefinition(
                testCase.definition
              ).pipe(Effect.either);
              
              return {
                name: testCase.name,
                success: false,
                error: validationResult._tag === "Left" ? validationResult.left._tag : null,
                expectedError: testCase.expectedError
              };
            } else {
              // Expect this to succeed
              yield* processor.validateEntityDefinition(testCase.definition);
              const entities = yield* pipe(
                testCase.text,
                DP.extractCustomEntities(testCase.definition)
              );
              
              return {
                name: testCase.name,
                success: true,
                entitiesFound: entities.length,
                error: null,
                expectedError: null
              };
            }
          }).pipe(
            Effect.catchAll((error) => 
              Effect.succeed({
                name: testCase.name,
                success: false,
                error: error._tag,
                expectedError: testCase.expectedError,
                unexpectedError: true
              })
            )
          );

          results.push(result);
        }

        // Validate error handling
        const errorResults = results.filter(r => r.expectedError);
        const successResults = results.filter(r => !r.expectedError);

        // All expected errors should be caught correctly
        for (const errorResult of errorResults) {
          expect(errorResult.success).toBe(false);
          expect(errorResult.error).toBe(errorResult.expectedError);
          expect(errorResult.unexpectedError).toBeFalsy();
        }

        // All expected successes should work
        for (const successResult of successResults) {
          expect(successResult.success).toBe(true);
          expect(successResult.error).toBeNull();
          expect(successResult.unexpectedError).toBeFalsy();
        }

        const summary = {
          totalTests: results.length,
          expectedErrors: errorResults.length,
          expectedSuccesses: successResults.length,
          allErrorsHandledCorrectly: errorResults.every(r => r.error === r.expectedError),
          allSuccessesWorked: successResults.every(r => r.success)
        };

        expect(summary.allErrorsHandledCorrectly).toBe(true);
        expect(summary.allSuccessesWorked).toBe(true);

        return summary;
      }).pipe(Effect.provide(TestLayer)));
  });
});
