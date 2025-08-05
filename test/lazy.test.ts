import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode, withGetType } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Lazy Types', () => {
  describe('z.lazy() with custom type', () => {
    it('handles recursive types with identifier', () => {
      type User = {
        username: string;
        friends: User[];
      };

      const UserSchema: z.ZodType<User> = z.object({
        username: z.string(),
        friends: z.lazy(() => UserSchema).array(),
      });

      // Add custom type for the lazy reference
      const LazyUserSchema = withGetType(
        z.lazy(() => UserSchema),
        (ts, identifier) => ts.factory.createIdentifier(identifier)
      );

      const schema = z.object({
        username: z.string(),
        friends: LazyUserSchema.array(),
      });

      const { node } = zodToTypes(schema, 'User');

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            username: string;
            friends: User[];
        }"
      `);
    });

    it('uses default identifier when none provided', () => {
      type Node = {
        value: string;
        children: Node[];
      };

      const NodeSchema: z.ZodType<Node> = z.object({
        value: z.string(),
        children: z.lazy(() => NodeSchema).array(),
      });

      const LazyNodeSchema = withGetType(
        z.lazy(() => NodeSchema),
        (ts, identifier) => ts.factory.createIdentifier(identifier)
      );

      const schema = z.object({
        value: z.string(),
        children: LazyNodeSchema.array(),
      });

      const { node } = zodToTypes(schema); // No identifier provided

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            value: string;
            children: GeneratedType[];
        }"
      `);
    });
  });

  describe('z.lazy() without custom type', () => {
    it('defaults to unknown for unresolved lazy types', () => {
      const schema = z.lazy(() => z.string());
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('unknown');
    });

    it('handles lazy in complex structures', () => {
      const schema = z.object({
        name: z.string(),
        lazy: z.lazy(() => z.number()),
        array: z.array(z.lazy(() => z.boolean())),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            name: string;
            lazy: unknown;
            array: unknown[];
        }"
      `);
    });
  });
});
