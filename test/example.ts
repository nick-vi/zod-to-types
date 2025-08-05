import { z } from 'zod';
import { zodToTypes, printNode, createTypeAlias } from '../src/index';

// Example Zod v4 schema showcasing new features
const UserSchema = z.object({
  id: z.string(),
  email: z.email(), // New v4 top-level format
  username: z.string().min(3).max(20),
  age: z.number().int().positive(),
  role: z.enum(['admin', 'user', 'guest']), // Unified enum handling
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.url().optional(), // New v4 top-level format
    bio: z.string().optional(),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean().default(true),
    language: z.string().default('en'),
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// Generate TypeScript type
const { node } = zodToTypes(UserSchema, 'User', { enumStyle: 'union' });

console.log('=== Generated TypeScript Type ===');
console.log(printNode(createTypeAlias(node, 'User')));

console.log('\n=== Raw Type Node ===');
console.log(printNode(node));

// Example with enum resolution
const StatusSchema = z.enum(['pending', 'approved', 'rejected']);
const { node: statusNode, store: statusStore } = zodToTypes(
  StatusSchema,
  'Status',
  { enumStyle: 'resolve' }
);

console.log('\n=== Enum with Resolution ===');
console.log('Type:', printNode(statusNode));
if (statusStore.enums.length > 0) {
  console.log('Enum Declaration:', printNode(statusStore.enums[0]!));
}

// Example with new string formats
const ValidationSchema = z.object({
  email: z.email(),
  website: z.url(),
  id: z.uuid(),
  phone: z.string(), // Could be z.e164() in real usage
});

const { node: validationNode } = zodToTypes(ValidationSchema, 'Validation');

console.log('\n=== String Formats Example ===');
console.log(printNode(createTypeAlias(validationNode, 'Validation')));

// Example with function schemas (Zod v4 API)
const ApiHandlerSchema = z.function({
  input: [
    z.object({
      userId: z.string(),
      data: z.record(z.string(), z.unknown()),
    }),
    z.object({
      headers: z.record(z.string(), z.string()),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    }),
  ],
  output: z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
  }),
});

const { node: handlerNode } = zodToTypes(ApiHandlerSchema, 'ApiHandler');

console.log('\n=== Function Schema Example ===');
console.log(printNode(createTypeAlias(handlerNode, 'ApiHandler')));

// Example with async function
const AsyncProcessorSchema = z.function({
  input: [z.array(z.string()), z.number().optional()],
  output: z.promise(
    z.object({
      processed: z.number(),
      results: z.array(z.string()),
    })
  ),
});

const { node: asyncNode } = zodToTypes(AsyncProcessorSchema, 'AsyncProcessor');

console.log('\n=== Async Function Schema Example ===');
console.log(printNode(createTypeAlias(asyncNode, 'AsyncProcessor')));

// Example with no parameters function
const GetTimestampSchema = z.function({
  input: [],
  output: z.number(),
});

const { node: timestampNode } = zodToTypes(GetTimestampSchema, 'GetTimestamp');

console.log('\n=== No Parameters Function Example ===');
console.log(printNode(createTypeAlias(timestampNode, 'GetTimestamp')));
