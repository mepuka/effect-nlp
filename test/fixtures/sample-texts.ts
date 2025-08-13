/**
 * Test fixture texts for systematic NLP testing
 */

export const FINANCIAL_TEXT = `
Apple Inc. reported quarterly earnings of $25.3 billion in Q4 2024. 
CEO Tim Cook announced new product launches scheduled for March 2025 in Cupertino, California.
The company's stock price increased by 12.5% following the announcement.
Revenue from iPhone sales reached $15.8 billion, exceeding analysts' expectations.
Apple plans to expand operations in Austin, Texas and Dublin, Ireland.
`;

export const ACADEMIC_TEXT = `
Dr. Maria Rodriguez from Stanford University published groundbreaking research on quantum computing applications.
The study, funded by the National Science Foundation with $2.3 million, explores novel approaches to quantum error correction.
Co-author Professor James Chen from MIT contributed theoretical frameworks developed at the Computer Science and Artificial Intelligence Laboratory.
The research was presented at the International Conference on Quantum Computing in Geneva, Switzerland on October 15, 2024.
`;

export const NEWS_TEXT = `
President Biden announced new climate policies during a speech in Washington, D.C. yesterday.
The Environmental Protection Agency will receive $4.7 billion in additional funding over the next two years.
European Union leaders, including Chancellor Scholz from Germany, praised the initiative.
The policy affects major cities like New York, Los Angeles, and Chicago.
Implementation begins January 1, 2025, with support from the United Nations Framework Convention on Climate Change.
`;

export const TECHNICAL_TEXT = `
The new React 19 framework introduces server components and improved performance optimizations.
Developer John Smith from Meta's React team demonstrated the features at the React Conference in San Francisco.
The update includes better TypeScript integration and enhanced debugging tools.
Companies like Netflix, Airbnb, and Shopify have already begun migration to the new version.
The open-source project is available on GitHub with comprehensive documentation.
`;

export const SOCIAL_MEDIA_TEXT = `
Just visited the amazing @MuseumOfScience in Boston! 🔬 
The AI exhibition featuring work by Dr. Yoshua Bengio was incredible.
Learned so much about deep learning applications in healthcare.
Shoutout to @MIT for sponsoring this educational experience! #Science #AI #Boston
Contact me at john.doe@email.com for collaboration opportunities.
Website: https://www.example.com/research
`;

export const MULTILINGUAL_TEXT = `
The Tokyo Olympics (東京オリンピック) were held in Japan from July 23 to August 8, 2021.
Athletes from 206 countries participated, including champions like Simone Biles from the United States.
The event generated approximately ¥1.4 trillion ($12.6 billion) in revenue.
France will host the next Olympics in Paris in 2024.
The International Olympic Committee (IOC) is headquartered in Lausanne, Switzerland.
`;

export const MIXED_ENTITIES_TEXT = `
Contact information:
- Email: support@company.com
- Phone: +1-555-123-4567
- Website: https://www.company.com
- Address: 123 Main Street, New York, NY 10001

Meeting scheduled for December 15, 2024 at 2:30 PM EST.
Budget allocation: $50,000 (approximately 85% of total project cost).
Team members: Alice Johnson (alice@company.com), Bob Wilson (+1-555-987-6543).
`;

/**
 * Expected entity counts for validation
 */
export const EXPECTED_ENTITIES = {
  FINANCIAL_TEXT: {
    ORGANIZATION: 1, // Apple Inc.
    PERSON: 1,      // Tim Cook  
    LOCATION: 3,    // Cupertino California, Austin Texas, Dublin Ireland
    MONEY: 3,       // $25.3 billion, $15.8 billion  
    PERCENT: 1,     // 12.5%
    DATE: 2,        // Q4 2024, March 2025
  },
  ACADEMIC_TEXT: {
    PERSON: 2,         // Dr. Maria Rodriguez, Professor James Chen
    ORGANIZATION: 4,   // Stanford University, MIT, National Science Foundation, Computer Science and Artificial Intelligence Laboratory  
    MONEY: 1,          // $2.3 million
    LOCATION: 2,       // Geneva Switzerland
    DATE: 1,           // October 15, 2024
  },
  NEWS_TEXT: {
    PERSON: 2,      // President Biden, Chancellor Scholz
    ORGANIZATION: 3, // Environmental Protection Agency, European Union, United Nations Framework Convention on Climate Change
    LOCATION: 6,    // Washington D.C., Germany, New York, Los Angeles, Chicago
    MONEY: 1,       // $4.7 billion
    DATE: 1,        // January 1, 2025
  },
  TECHNICAL_TEXT: {
    PERSON: 1,         // John Smith
    ORGANIZATION: 5,   // Meta, Netflix, Airbnb, Shopify, GitHub
    LOCATION: 1,       // San Francisco
  },
  SOCIAL_MEDIA_TEXT: {
    PERSON: 2,       // Dr. Yoshua Bengio, john.doe
    ORGANIZATION: 2, // @MuseumOfScience, @MIT  
    LOCATION: 1,     // Boston
    EMAIL: 1,        // john.doe@email.com
    URL: 1,          // https://www.example.com/research
  },
  MIXED_ENTITIES_TEXT: {
    EMAIL: 2,    // support@company.com, alice@company.com
    PHONE: 2,    // +1-555-123-4567, +1-555-987-6543
    URL: 1,      // https://www.company.com
    LOCATION: 1, // New York, NY
    DATE: 1,     // December 15, 2024
    TIME: 1,     // 2:30 PM EST
    MONEY: 1,    // $50,000
    PERCENT: 1,  // 85%
    PERSON: 2,   // Alice Johnson, Bob Wilson
  }
};

/**
 * Test cases for specific NLP functionality
 */
export const TEST_CASES = {
  EMPTY_TEXT: "",
  SINGLE_WORD: "Apple",
  NUMBERS_ONLY: "123 456 789",
  PUNCTUATION_ONLY: "!@#$%^&*()",
  WHITESPACE_ONLY: "   \n\t   ",
  VERY_LONG_TEXT: "word ".repeat(1000),
  SPECIAL_CHARACTERS: "café résumé naïve Zürich 北京",
  HTML_CONTENT: "<p>Apple Inc. is based in <strong>Cupertino</strong>.</p>",
  JSON_CONTENT: '{"company": "Apple Inc.", "location": "Cupertino, CA"}',
  URL_HEAVY: "Visit https://apple.com or email support@apple.com for more info.",
} as const;