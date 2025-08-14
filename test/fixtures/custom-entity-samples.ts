/**
 * Test fixtures specifically for custom entity functionality
 */

import * as Core from "../../src/NLP/Core.js";

// =============================================================================
// Sample Entity Patterns for Testing
// =============================================================================

export const SAMPLE_PATTERNS = {
  TECH_COMPANIES: Core.EntityPattern.forTerms(
    "tech_companies",
    "Technology Companies",
    "ORGANIZATION",
    [
      "Apple",
      "Microsoft",
      "Google",
      "Amazon",
      "Meta",
      "Tesla",
      "Netflix",
      "Adobe",
      "Salesforce",
      "Oracle",
      "IBM",
      "Intel",
      "NVIDIA",
      "AMD",
      "Cisco",
      "VMware",
      "Uber",
      "Airbnb",
    ],
    ["Apple Inc.", "Microsoft Corporation", "Google LLC"],
    8
  ),

  PROGRAMMING_LANGUAGES: Core.EntityPattern.forTerms(
    "programming_languages",
    "Programming Languages",
    "MISC",
    [
      "TypeScript",
      "JavaScript",
      "Python",
      "Java",
      "C++",
      "Rust",
      "Go",
      "Swift",
      "Kotlin",
      "C#",
      "Ruby",
      "PHP",
      "Scala",
      "Dart",
    ],
    ["TypeScript 5.0", "Python 3.11", "Rust 1.70"],
    7
  ),

  EMAIL_ADDRESSES: Core.EntityPattern.forRegex(
    "email_addresses",
    "Email Addresses",
    "EMAIL",
    "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
    ["user@example.com", "test@domain.org", "admin@company.co.uk"],
    9
  ),

  PHONE_NUMBERS: Core.EntityPattern.forRegex(
    "phone_numbers",
    "Phone Numbers",
    "PHONE",
    "\\+?1?[-\\s]?\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4}",
    ["+1-555-123-4567", "(555) 987-6543", "555.555.5555"],
    6
  ),

  MEDICAL_CONDITIONS: Core.EntityPattern.forTerms(
    "medical_conditions",
    "Medical Conditions",
    "MISC",
    [
      "diabetes",
      "hypertension",
      "asthma",
      "pneumonia",
      "COVID-19",
      "influenza",
      "bronchitis",
      "arthritis",
      "migraine",
      "depression",
    ],
    ["Type 2 diabetes", "chronic asthma", "seasonal influenza"],
    8
  ),

  MEDICATIONS: Core.EntityPattern.forTerms(
    "medications",
    "Medications",
    "MISC",
    [
      "aspirin",
      "metformin",
      "lisinopril",
      "albuterol",
      "insulin",
      "ibuprofen",
      "acetaminophen",
      "prednisone",
      "warfarin",
    ],
    ["aspirin 325mg", "metformin XR", "insulin glargine"],
    7
  ),

  FINANCIAL_INSTITUTIONS: Core.EntityPattern.forTerms(
    "financial_institutions",
    "Financial Institutions",
    "ORGANIZATION",
    [
      "Goldman Sachs",
      "JPMorgan Chase",
      "Bank of America",
      "Wells Fargo",
      "Citigroup",
      "Morgan Stanley",
      "Credit Suisse",
      "Deutsche Bank",
    ],
    ["Goldman Sachs Group", "JPMorgan Chase & Co"],
    9
  ),

  CRYPTOCURRENCIES: Core.EntityPattern.forRegex(
    "cryptocurrencies",
    "Cryptocurrencies",
    "MONEY",
    "\\b(bitcoin|ethereum|litecoin|cardano|polkadot|chainlink|BTC|ETH|LTC|ADA|DOT)\\b",
    ["bitcoin", "ethereum", "BTC", "ETH"],
    8
  ),

  LEGAL_TERMS: Core.EntityPattern.forTerms(
    "legal_terms",
    "Legal Terms",
    "MISC",
    [
      "contract",
      "litigation",
      "settlement",
      "injunction",
      "precedent",
      "jurisdiction",
      "arbitration",
      "mediation",
      "deposition",
      "subpoena",
    ],
    ["breach of contract", "class action litigation", "preliminary injunction"],
    6
  ),

  CLOUD_SERVICES: Core.EntityPattern.forTerms(
    "cloud_services",
    "Cloud Services",
    "MISC",
    [
      "AWS",
      "Azure",
      "Google Cloud",
      "Docker",
      "Kubernetes",
      "Firebase",
      "Heroku",
      "Vercel",
      "Netlify",
      "DigitalOcean",
    ],
    ["Amazon Web Services", "Microsoft Azure", "Google Cloud Platform"],
    7
  ),
} as const;

// =============================================================================
// Sample Entity Definitions for Testing
// =============================================================================

export const SAMPLE_DEFINITIONS = {
  TECHNOLOGY_DOMAIN: Core.CustomEntityDefinition.create(
    "technology_domain",
    "technology",
    "1.0.0",
    [
      SAMPLE_PATTERNS.TECH_COMPANIES,
      SAMPLE_PATTERNS.PROGRAMMING_LANGUAGES,
      SAMPLE_PATTERNS.CLOUD_SERVICES,
    ],
    {
      description: "Comprehensive technology domain entity recognition",
      config: Core.CustomEntityConfig.create({
        matchValue: false,
        usePOS: true,
        useEntity: true,
      }),
    }
  ),

  MEDICAL_DOMAIN: Core.CustomEntityDefinition.create(
    "medical_domain",
    "healthcare",
    "1.0.0",
    [
      SAMPLE_PATTERNS.MEDICAL_CONDITIONS,
      SAMPLE_PATTERNS.MEDICATIONS,
      Core.EntityPattern.forTerms(
        "medical_professionals",
        "Medical Professionals",
        "PERSON",
        ["Dr.", "Doctor", "Physician", "Nurse", "Surgeon", "Specialist"],
        ["Dr. Smith", "Nurse Johnson", "Surgeon Williams"]
      ),
    ],
    {
      description: "Medical and healthcare entity recognition",
      config: Core.CustomEntityConfig.create({
        matchValue: true,
        usePOS: true,
        useEntity: false,
      }),
    }
  ),

  FINANCIAL_DOMAIN: Core.CustomEntityDefinition.create(
    "financial_domain",
    "finance",
    "1.0.0",
    [
      SAMPLE_PATTERNS.FINANCIAL_INSTITUTIONS,
      SAMPLE_PATTERNS.CRYPTOCURRENCIES,
      Core.EntityPattern.forRegex(
        "financial_instruments",
        "Financial Instruments",
        "MISC",
        "\\b(stock|bond|ETF|mutual fund|derivative|commodity)s?\\b",
        ["stocks", "corporate bonds", "index ETF"]
      ),
    ],
    {
      description: "Financial services and instruments recognition",
    }
  ),

  CONTACT_INFO_DOMAIN: Core.CustomEntityDefinition.create(
    "contact_info_domain",
    "contact",
    "1.0.0",
    [
      SAMPLE_PATTERNS.EMAIL_ADDRESSES,
      SAMPLE_PATTERNS.PHONE_NUMBERS,
      Core.EntityPattern.forRegex(
        "websites",
        "Website URLs",
        "URL",
        "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&=]*)",
        [
          "https://example.com",
          "http://www.company.org",
          "https://api.service.io",
        ]
      ),
    ],
    {
      description: "Contact information extraction",
    }
  ),

  LEGAL_DOMAIN: Core.CustomEntityDefinition.create(
    "legal_domain",
    "legal",
    "1.0.0",
    [
      SAMPLE_PATTERNS.LEGAL_TERMS,
      Core.EntityPattern.forTerms(
        "courts",
        "Courts and Legal Institutions",
        "ORGANIZATION",
        ["Supreme Court", "District Court", "Court of Appeals", "High Court"],
        ["U.S. Supreme Court", "Federal District Court"]
      ),
      Core.EntityPattern.forTerms(
        "legal_professionals",
        "Legal Professionals",
        "PERSON",
        ["Judge", "Attorney", "Lawyer", "Counsel", "Prosecutor", "Barrister"],
        ["Chief Judge", "District Attorney", "Defense Counsel"]
      ),
    ],
    {
      description: "Legal terminology and professional recognition",
    }
  ),
} as const;

// =============================================================================
// Sample Test Documents
// =============================================================================

export const SAMPLE_DOCUMENTS = {
  TECHNOLOGY_HEAVY: `
    Apple Inc. announced new Swift programming language features at WWDC 2024.
    The iOS development team demonstrated TypeScript integration with React Native.
    Microsoft Azure now supports Docker containerization through Kubernetes orchestration.
    Google Cloud Platform offers enhanced Python runtime environments for TensorFlow applications.
    Amazon Web Services launched new Java-based microservices architecture.
    Meta's engineering division migrated from PHP to Rust for improved performance.
    Netflix implemented Go-based streaming protocols with Redis caching layers.
  `,

  MEDICAL_COMPREHENSIVE: `
    Dr. Sarah Johnson, a leading cardiologist at Johns Hopkins Hospital,
    published groundbreaking research on diabetes management using metformin therapy.
    The study involved 500 patients with Type 2 diabetes and hypertension.
    
    Nurse Patricia Williams administered insulin injections and monitored
    blood glucose levels throughout the clinical trial. Patients also received
    aspirin for cardiovascular protection and lisinopril for blood pressure control.
    
    The research showed significant improvement in patients with chronic asthma
    who were treated with albuterol inhalers alongside their diabetes medications.
    Dr. Michael Chen, the study's lead physician, noted reduced pneumonia
    complications in patients receiving comprehensive care.
  `,

  FINANCIAL_COMPLEX: `
    Goldman Sachs Group reported record quarterly earnings of $4.2 billion,
    driven by strong performance in investment banking and trading divisions.
    The firm's cryptocurrency trading desk generated $500 million in bitcoin
    and ethereum transaction revenues.
    
    JPMorgan Chase announced a $2.8 billion acquisition of a fintech startup
    specializing in blockchain-based payment solutions. The deal includes
    significant investments in Cardano and Polkadot ecosystem projects.
    
    Bank of America's wealth management division increased exposure to
    technology stocks and corporate bonds, while reducing positions in
    traditional commodities and derivatives markets.
  `,

  CONTACT_INFORMATION: `
    For business inquiries, please contact our sales team at sales@company.com
    or call our main office at +1-555-123-4567. Our customer support can be
    reached at support@company.com or (555) 987-6543 during business hours.
    
    Visit our website at https://www.company.com for more information, or
    check our developer documentation at https://docs.company.com/api.
    The technical support team is available at tech-support@company.org
    and can be reached at 1-800-TECH-HELP.
    
    Regional offices:
    - New York: ny-office@company.com, (212) 555-0123
    - San Francisco: sf@company.com, +1.415.555.9876
    - London: uk-office@company.co.uk, +44-20-7555-0199
  `,

  LEGAL_DOCUMENT: `
    The Supreme Court of the United States heard oral arguments in the landmark
    contract litigation case between TechCorp and DataSystems Inc. Chief Judge
    Roberts presided over the proceedings, with Attorney General Smith
    representing the government's position.
    
    The dispute centers on a breach of contract claim involving a $50 million
    software licensing agreement. District Attorney Johnson filed an injunction
    to prevent further damages, while Defense Counsel Williams argued for
    arbitration under the original settlement terms.
    
    The Court of Appeals previously ruled that the jurisdiction clause in the
    contract was valid, setting an important precedent for similar litigation.
    Legal experts predict the Supreme Court's decision will impact future
    mediation and deposition procedures in technology disputes.
  `,

  MULTI_DOMAIN_COMPLEX: `
    HEALTHCARE TECHNOLOGY MERGER ANNOUNCEMENT
    
    Goldman Sachs advised on the $12.5 billion acquisition of MedTech Solutions
    by Google Health, creating the largest healthcare technology platform.
    The deal was approved by Federal District Court Judge Martinez following
    extensive antitrust litigation.
    
    Dr. Jennifer Adams, former Chief Medical Officer at Johns Hopkins, will
    lead the combined entity's artificial intelligence research division.
    The platform will integrate Python-based machine learning algorithms
    with existing diabetes and hypertension monitoring systems.
    
    Microsoft Azure will provide cloud infrastructure for the new platform,
    supporting Docker-containerized applications processing patient data.
    The system will analyze medical conditions using advanced TypeScript
    applications and Rust-based data processing engines.
    
    Legal counsel from Supreme Court Bar attorney Michael Chen negotiated
    the complex contract terms, including intellectual property rights
    for insulin delivery algorithms and aspirin effectiveness studies.
    
    For investor relations, contact ir@medtech-google.com or call
    +1-650-555-HEALTH. Technical documentation is available at
    https://developers.google-health.com/api-docs.
  `,
} as const;

// =============================================================================
// Expected Entity Counts for Validation
// =============================================================================

export const EXPECTED_ENTITY_COUNTS = {
  TECHNOLOGY_HEAVY: {
    totalEntities: { min: 15, max: 25 },
    organizations: { min: 5, max: 10 },
    programmingLanguages: { min: 6, max: 12 },
    cloudServices: { min: 3, max: 8 },
  },

  MEDICAL_COMPREHENSIVE: {
    totalEntities: { min: 12, max: 20 },
    medicalConditions: { min: 4, max: 8 },
    medications: { min: 4, max: 8 },
    medicalProfessionals: { min: 3, max: 6 },
  },

  FINANCIAL_COMPLEX: {
    totalEntities: { min: 10, max: 18 },
    financialInstitutions: { min: 3, max: 6 },
    cryptocurrencies: { min: 4, max: 8 },
    financialInstruments: { min: 2, max: 6 },
  },

  CONTACT_INFORMATION: {
    totalEntities: { min: 8, max: 15 },
    emailAddresses: { min: 4, max: 8 },
    phoneNumbers: { min: 4, max: 8 },
    websites: { min: 2, max: 4 },
  },

  LEGAL_DOCUMENT: {
    totalEntities: { min: 8, max: 16 },
    legalTerms: { min: 4, max: 10 },
    courts: { min: 2, max: 5 },
    legalProfessionals: { min: 3, max: 7 },
  },

  MULTI_DOMAIN_COMPLEX: {
    totalEntities: { min: 25, max: 45 },
    organizations: { min: 3, max: 8 },
    people: { min: 3, max: 8 },
    technology: { min: 6, max: 12 },
    medical: { min: 4, max: 10 },
    financial: { min: 2, max: 6 },
    legal: { min: 3, max: 8 },
    contact: { min: 2, max: 4 },
  },
} as const;

// =============================================================================
// Performance Test Data
// =============================================================================

export const PERFORMANCE_TEST_DATA = {
  LARGE_TECH_DOCUMENT: Array(100)
    .fill(
      `
    Apple and Microsoft collaborate on TypeScript development.
    Google Cloud supports Python applications with Docker containers.
    Amazon Web Services offers Java-based microservices architecture.
    Meta implements React Native with JavaScript runtime environments.
  `
    )
    .join(" "),

  MEDIUM_MEDICAL_DOCUMENT: Array(50)
    .fill(
      `
    Dr. Smith treats diabetes patients with metformin and insulin therapy.
    Nurse Johnson monitors hypertension using lisinopril medication.
    The clinic specializes in asthma treatment with albuterol inhalers.
  `
    )
    .join(" "),

  SMALL_FINANCIAL_DOCUMENT: Array(25)
    .fill(
      `
    Goldman Sachs trades bitcoin and ethereum cryptocurrencies.
    JPMorgan Chase invests in technology stocks and corporate bonds.
  `
    )
    .join(" "),
} as const;

// =============================================================================
// Edge Case Test Data
// =============================================================================

export const EDGE_CASE_DATA = {
  EMPTY_TEXT: "",

  WHITESPACE_ONLY: "   \n\t   \r\n   ",

  SINGLE_WORD: "Apple",

  NUMBERS_ONLY: "123 456 789 $1000 25% 2024",

  PUNCTUATION_HEAVY:
    "Hello, world! How are you? I'm fine... Really? Yes!!! Okay.",

  SPECIAL_CHARACTERS: "café résumé naïve Zürich 北京 москва العربية हिन्दी",

  HTML_CONTENT: `
    <div class="content">
      <h1>Apple Inc.</h1>
      <p>Contact us at <a href="mailto:info@apple.com">info@apple.com</a></p>
      <p>Visit <a href="https://apple.com">our website</a></p>
    </div>
  `,

  JSON_CONTENT: `{
    "company": "Apple Inc.",
    "contact": {
      "email": "info@apple.com",
      "phone": "+1-555-123-4567",
      "website": "https://apple.com"
    },
    "technologies": ["Swift", "TypeScript", "React"]
  }`,

  MIXED_LANGUAGES: `
    Apple Inc. (アップル) est une entreprise américaine.
    Microsoft Corporation (微软公司) ist ein amerikanisches Unternehmen.
    Google LLC (구글) es una empresa estadounidense.
  `,

  VERY_LONG_SINGLE_LINE: Array(1000)
    .fill(
      "Apple Microsoft Google Amazon Meta Tesla Netflix Adobe Salesforce Oracle"
    )
    .join(" "),
} as const;
