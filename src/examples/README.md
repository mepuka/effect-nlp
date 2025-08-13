# Effect-NLP Examples

This directory contains production-ready examples demonstrating academic-level natural language processing using the Effect-NLP library.

## 🎓 Academic-Level NLP Analysis

### Running the Example

```bash
# Run the comprehensive academic analysis
npx tsx src/examples/academic-nlp-analysis.ts

# Or use the npm script
npm run start
```

### What It Demonstrates

The `academic-nlp-analysis.ts` example showcases **Stanford NLP-level rigor** with:

#### 🔬 Comprehensive Linguistic Analysis
- **Lexical Diversity Metrics**: Type-Token Ratio (TTR), Root TTR for vocabulary richness
- **Morphological Analysis**: POS distribution, proper noun detection, negation analysis
- **Semantic Density**: Content word ratios and semantic complexity scoring
- **Syntactic Structure**: Sentence complexity, verb/noun ratios, structural analysis

#### 🏷️ Academic-Quality Entity Recognition  
- **Multi-Engine Validation**: Combines wink-nlp (statistical) + compromise.js (rule-based)
- **Standard NER Labels**: PERSON, ORGANIZATION, LOCATION, DATE, MONEY, PERCENT, etc.
- **Entity Overlap Detection**: Cross-validation between NLP engines
- **Named Entity Density**: Entities per 100 tokens (academic standard metric)
- **Span Analysis**: Entity length distribution and boundary validation

#### 📊 Corpus Linguistics Features
- **Cross-Document Comparison**: Comparative analysis across document types
- **Statistical Reporting**: Academic-standard metrics and distributions  
- **Text Preprocessing Variants**: Normalized, title-case, and original text comparison
- **Performance Profiling**: Processing time analysis for optimization

#### ⚡ Effect-Native Implementation
- **Schema Validation**: Runtime type safety with Effect Schema
- **Error Handling**: Type-safe error management with Data.TaggedError
- **Functional Composition**: Effect.gen patterns for readable async code
- **Service Architecture**: Clean separation of concerns with DocumentProcessor services
- **Concurrent Processing**: Parallel document analysis with controlled concurrency

## 📚 Research Corpus

The example analyzes four distinct academic text types:

1. **Computational Linguistics**: Neural networks, attention mechanisms, benchmarks
2. **Medical Research**: Clinical trials, statistical analysis, regulatory approval  
3. **Financial Analysis**: Earnings reports, market data, analyst recommendations
4. **Legal Documents**: Court cases, regulatory compliance, citation analysis

Each document type demonstrates different linguistic patterns and entity distributions.

## 🔧 Architecture

### Core Types (Effect Schema-based)
```typescript
import * as Core from "../NLP/Core.js";

// All types use Schema.Class for validation
Core.Document   // Document with HashMap storage
Core.Entity     // Named entities with EntityLabel enum
Core.Token      // Tokens with POS tags and features  
Core.Span       // Position spans with validation
Core.Offset     // Character and token positions
```

### Service Layer
```typescript
import * as DP from "../NLP/DocumentProcessor.js";

// Clean service interfaces
DP.DocumentProcessorService  // Core NLP processing
DP.DocumentQueryService     // Entity and token queries
DP.TextTransformerService   // Text normalization
```

### Implementation Bridge
```typescript
import * as Live from "../NLP/DocumentProcessorLive.js";

// Hides wink-nlp + compromise.js implementation details
Live.DocumentProcessorLive  // Complete service layer
```

## 📈 Sample Output

The analysis produces comprehensive academic reports including:

```
📚 ACADEMIC NLP ANALYSIS REPORT: COMP_LING
================================================================================

📄 DOCUMENT OVERVIEW
----------------------------------------
Document ID: COMP_LING
Processing Time: 245ms
Total Tokens: 156
Total Entities: 23
Total Sentences: 8
Average Sentence Length: 19.50 tokens
Average Token Length: 5.23 characters

🔬 LINGUISTIC FEATURES ANALYSIS
----------------------------------------
Type-Token Ratio (TTR): 0.7179
Root TTR: 8.9705
Semantic Density: 47.44%
Content Word Ratio: 52.56%

📊 PART-OF-SPEECH DISTRIBUTION
----------------------------------------
NOUN    :   42 (26.9%)
PROPN   :   18 (11.5%)
VERB    :   15 (9.6%)
DET     :   12 (7.7%)
...

🏷️ NAMED ENTITY ANALYSIS  
----------------------------------------
Named Entity Density: 14.74 entities/100 tokens
Entity Overlaps Detected: 2
Unique Entity Texts: 21
Average Entity Span: 12.35 characters

📋 ENTITY CLASSIFICATION BY TYPE
----------------------------------------
ORGANIZATION:   8 entities
               Examples: "University of Montreal", "Google Research"
PERSON      :   6 entities  
               Examples: "Yoshua Bengio", "Geoffrey Hinton"
PERCENT     :   4 entities
               Examples: "99.2%", "15.7%"
...
```

## 🎯 Academic Standards

This implementation meets academic research standards:

- **Reproducible Results**: Deterministic processing with Schema validation
- **Statistical Rigor**: Standard corpus linguistics metrics (TTR, entity density)
- **Multi-Engine Validation**: Cross-validation between statistical and rule-based NLP
- **Error Transparency**: No fake confidence scores - honest API
- **Type Safety**: Runtime validation prevents data corruption
- **Performance Profiling**: Timing analysis for scalability assessment
- **Documentation**: Comprehensive inline documentation and examples

## 🚀 Next Steps

For production deployment:

1. **Custom Entity Training**: Add domain-specific entity patterns
2. **Batch Processing**: Scale to large document collections  
3. **Export Formats**: JSON, CSV, XML output for research tools
4. **API Integration**: REST/GraphQL endpoints for web applications
5. **Database Storage**: Persist analysis results with proper indexing
6. **Visualization**: Charts and graphs for linguistic analysis

This example serves as a foundation for academic research, production NLP applications, and computational linguistics studies requiring Stanford NLP-level functionality with modern Effect patterns.