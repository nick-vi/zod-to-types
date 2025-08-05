# zod-to-types

Generate TypeScript types from your [Zod](https://github.com/colinhacks/zod) schemas.

_Inspired by [zod-to-ts](https://github.com/sachinraja/zod-to-ts)_

## Installation

```bash
pnpm add zod-to-types zod typescript
```

## Usage

```typescript
import { z } from 'zod';
import { zodToTypes, printNode } from 'zod-to-types';

const UserSchema = z.object({
  username: z.string(),
  email: z.email(),
  age: z.number(),
  role: z.enum(['admin', 'user', 'guest']),
});

const { node } = zodToTypes(UserSchema);
console.log(printNode(node));
// Output: { username: string; email: string; age: number; role: "admin" | "user" | "guest"; }
```

## API

```typescript
zodToTypes(schema, identifier?, options?)
```

### Options

```typescript
{
  enumStyle?: 'union' | 'resolve' // default: 'union'
}
```

### Function Types

`z.function()` in Zod v4+ creates a function factory (`$ZodFunction`), not a schema type. This is properly typed and supported:

```typescript
const functionSchema = z.function({
  input: [z.string()],
  output: z.number(),
});
const { node } = zodToTypes(functionSchema); // Works correctly
```

## License

MIT
