/**
 * @since 1.0.0
 */

import type { Brand } from "effect";
import {
  DateTime,
  HashSet,
  Effect,
  Equal,
  Hash,
  Predicate,
  Schema,
} from "effect";
import type { ParseError } from "effect/ParseResult";

// =============================================================================
// Symbols
// =============================================================================

/**
 * @since 1.0.0
 * @category symbols
 */
export const DocumentTypeId: unique symbol = Symbol.for("effect-nlp/Document");

/**
 * @since 1.0.0
 * @category symbols
 */
export type DocumentTypeId = typeof DocumentTypeId;

// =============================================================================
// Branded Types
// =============================================================================

/**
 * Branded DocumentId with nlp-doc- prefix for store prefix matching
 * @since 1.0.0
 * @category models
 */
export type DocumentId = string & Brand.Brand<"DocumentId">;

/**
 * @since 1.0.0
 * @category models
 */
export const DocumentId = Schema.String.pipe(
  Schema.pattern(/^nlp-doc-[a-zA-Z0-9]{10}$/),
  Schema.brand("DocumentId"),
  Schema.annotations({
    identifier: "DocumentId",
    title: "Document ID",
    description: "Content-addressable document identifier with nlp-doc- prefix",
  })
);

/**
 * Generate a document ID from content hash
 * @since 1.0.0
 * @category utilities
 */
const generateDocumentId = (text: string): DocumentId => {
  // Use Effect's Hash.hash to get a consistent hash value
  const hashValue = Hash.hash(text);
  // Convert to base36 for shorter, URL-safe representation
  const hashString = Math.abs(hashValue)
    .toString(36)
    .padStart(10, "0")
    .slice(-10);
  return `nlp-doc-${hashString}` as DocumentId;
};

// =============================================================================
// Models
// =============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export class TextDocument extends Schema.Class<TextDocument>("TextDocument")({
  id: DocumentId,

  text: Schema.NonEmptyString.annotations({
    title: "Document Text",
    description: "The full text content of the document",
  }),
  metadata: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }).annotations({
    title: "Metadata",
    description: "Key-value pairs for document metadata",
    default: {},
  }),
  createdAt: Schema.DateTimeUtc.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => DateTime.unsafeNow())
  ).annotations({
    title: "Created At",
    description: "UTC timestamp when the document was created",
  }),
  updatedAt: Schema.optional(Schema.DateTimeUtc).annotations({
    title: "Updated At",
    description: "UTC timestamp when the document was last updated",
  }),
}) {
  /**
   * Implementation of Effect's Hash interface for content-based hashing
   * @since 1.0.0
   */
  [Hash.symbol](): number {
    return Hash.hash(this.text);
  }

  /**
   * Implementation of Effect's Equal interface for content-based equality
   * @since 1.0.0
   */
  [Equal.symbol](that: unknown): boolean {
    return isDocument(that) && this.id === that.id;
  }

  /**
   * Get the document length in characters
   * @since 1.0.0
   */
  get length(): number {
    return this.text.length;
  }

  /**
   * Get the document word count (approximate)
   * @since 1.0.0
   */
  get wordCount(): number {
    return this.text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Get a preview of the document text
   * @since 1.0.0
   */
  preview(maxLength: number = 100): string {
    return this.text.length <= maxLength
      ? this.text
      : this.text.slice(0, maxLength - 3).trim() + "...";
  }

  /**
   * Create a new document with updated text
   * @since 1.0.0
   */
  updateText(newText: string): TextDocument {
    return new TextDocument({
      ...this,
      id: generateDocumentId(newText),
      text: newText,
      updatedAt: DateTime.unsafeNow(),
    });
  }

  /**
   * Add or update metadata
   * @since 1.0.0
   */
  withMetadata(key: string, value: string): TextDocument {
    return new TextDocument({
      ...this,
      metadata: { ...this.metadata, [key]: value },
      updatedAt: DateTime.unsafeNow(),
    });
  }

  /**
   * Remove metadata by key
   * @since 1.0.0
   */
  withoutMetadata(key: string): TextDocument {
    const { [key]: _, ...rest } = this.metadata;
    return new TextDocument({
      ...this,
      metadata: rest,
      updatedAt: DateTime.unsafeNow(),
    });
  }
}

// =============================================================================
// Constructors
// =============================================================================

/**
 * Create a document from text, automatically computing the ID
 * @since 1.0.0
 * @category constructors
 */
export const fromText = (
  text: string,
  metadata: Record<string, string> = {}
): Effect.Effect<TextDocument, ParseError, never> =>
  Effect.gen(function* () {
    // Validate text is non-empty
    const validatedText = yield* Schema.decodeUnknown(Schema.NonEmptyString)(
      text
    );
    const id = generateDocumentId(validatedText);

    return new TextDocument({
      id,
      text: validatedText,
      metadata,
      createdAt: DateTime.unsafeNow(),
      updatedAt: undefined,
    });
  });

/**
 * Create a document from text synchronously (throws on invalid input)
 * @since 1.0.0
 * @category constructors
 */
export const fromTextUnsafe = (
  text: string,
  metadata: Record<string, string> = {}
): TextDocument => {
  const id = generateDocumentId(text);

  return new TextDocument({
    id,
    text,
    metadata,
    createdAt: DateTime.unsafeNow(),
    updatedAt: undefined,
  });
};

/**
 * @since 1.0.0
 * @category constructors
 */
export const make = fromText;

/**
 * @since 1.0.0
 * @category constructors
 */
export const of = make;

// =============================================================================
// Hash Utilities
// =============================================================================

/**
 * Create a hash set of documents for efficient lookup
 * @since 1.0.0
 * @category utilities
 */
export const hashSet = <T extends ReadonlyArray<TextDocument>>(
  ...documents: T
) => HashSet.make(...documents);

/**
 * Check if two documents have the same content
 * @since 1.0.0
 * @category utilities
 */
export const equalsByContent = (
  self: TextDocument,
  that: TextDocument
): boolean => Hash.hash(self) === Hash.hash(that);

/**
 * Check if two documents are the same (by ID)
 * @since 1.0.0
 * @category utilities
 */
export const equalsById = (self: TextDocument, that: TextDocument): boolean =>
  self.id === that.id;

/**
 * Compute hash for a document
 * @since 1.0.0
 * @category utilities
 */
export const hash = (document: TextDocument): number => Hash.hash(document);

// =============================================================================
// Guards & Refinements
// =============================================================================

/**
 * @since 1.0.0
 * @category refinements
 */
export const isDocument: Predicate.Refinement<unknown, TextDocument> = (
  u: unknown
): u is TextDocument => Predicate.hasProperty(u, DocumentTypeId);

/**
 * @since 1.0.0
 * @category refinements
 */
export const isDocumentId: Predicate.Refinement<unknown, DocumentId> = (
  u: unknown
): u is DocumentId =>
  typeof u === "string" && /^nlp-doc-[a-zA-Z0-9]{10}$/.test(u);

/**
 * Extract the hash portion from a DocumentId
 * @since 1.0.0
 * @category utilities
 */
export const extractHashFromId = (id: DocumentId): string => id.slice(8); // Remove "nlp-doc-" prefix

/**
 * Create a predicate to match documents by prefix in their text
 * @since 1.0.0
 * @category predicates
 */
export const textStartsWith =
  (prefix: string): Predicate.Predicate<TextDocument> =>
  (doc) =>
    doc.text.startsWith(prefix);

/**
 * Create a predicate to match documents by metadata key
 * @since 1.0.0
 * @category predicates
 */
export const hasMetadataKey =
  (key: string): Predicate.Predicate<TextDocument> =>
  (doc) =>
    key in doc.metadata;

/**
 * Create a predicate to match documents by metadata key-value pair
 * @since 1.0.0
 * @category predicates
 */
export const hasMetadata =
  (key: string, value: string): Predicate.Predicate<TextDocument> =>
  (doc) =>
    doc.metadata[key] === value;
