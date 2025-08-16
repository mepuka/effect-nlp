# Legacy API Components

This folder contains deprecated API components that are kept for backward compatibility.

## Files

- **Data.ts** - Legacy data structures (Token, Sentence, CompromiseData, etc.)
  - **Status**: Deprecated in favor of `Core.ts`
  - **Migration**: Use `Core.Token`, `Core.Sentence`, `Core.Entity` instead
  - **Removal**: Planned for v3.0

## Migration Guide

Instead of legacy data types, use the modern Core API:

```typescript
// ❌ Legacy (deprecated)
import { makeToken, makeSentence } from "../legacy/Data.js";

// ✅ Modern (recommended)
import * as Core from "../Core.js";
const token = Core.Token.create(...);
const sentence = Core.Sentence.create(...);
```

The modern Core API provides:

- Better Effect integration
- Type safety with branded types
- Functional composition with pipe()
- Schema validation
- Immutable data structures
