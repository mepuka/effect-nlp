# Effect Package Template

This template provides a solid foundation for building scalable and maintainable TypeScript package with Effect. 

## Running Code

This template leverages [tsx](https://tsx.is) to allow execution of TypeScript files via NodeJS as if they were written in plain JavaScript.

To execute a file with `tsx`:

```sh
pnpm tsx ./path/to/the/file.ts
```

## Operations

**Building**

To build the package:

```sh
pnpm build
```

**Testing**

To test the package:

```sh
pnpm test
```

## Typed Annotation Helpers

The `src/Extraction/Annotations.ts` module provides typed helpers for attaching
and retrieving schema annotations. Use helpers such as:

```ts
import { Annotations } from "effect-nlp/Extraction/Annotations";
import { Schema, pipe } from "effect";

const ArticleSchema = pipe(
  Schema.Struct({
    title: pipe(
      Schema.String,
      Annotations.withCore({
        title: "Title",
        description: "Headline used when presenting the article",
      })
    ),
  }),
  Annotations.withMetadata({
    semantic: { semanticType: "article" },
    role: { role: "aggregate_root" },
  })
);

const metadata = Annotations.getContext(ArticleSchema.ast.annotations);
```

These helpers guarantee consistent annotation shapes that can be consumed by
prompt builders and extraction pipelines.

## Schema AST Traversal

Build immutable, typed AST trees for schema inspection:

```ts
import { Option } from "effect";
import { buildSchemaASTTree } from "effect-nlp/Extraction/ASTTraverse";

const tree = await buildSchemaASTTree(articleEntity);
const titles = tree.root.children.map((child) =>
  Option.getOrElse(
    Option.flatMap(child.context.annotations.core, (core) =>
      Option.fromNullable(core.title)
    ),
    () => ""
  )
);
```

Nodes expose typed annotation context (core/role/semantic/provenance) alongside
entity identifiers, enabling deterministic prompt construction and graph
operations.
