import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Union Types', () => {
  describe('z.union()', () => {
    it('handles simple unions', () => {
      const schema = z.union([z.string(), z.number()]);
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string | number');
    });

    it('handles complex unions', () => {
      const schema = z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.undefined(),
      ]);
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe(
        'string | number | boolean | null | undefined'
      );
    });

    it('handles unions with objects', () => {
      const schema = z.union([
        z.object({ type: z.literal('user'), name: z.string() }),
        z.object({
          type: z.literal('admin'),
          permissions: z.array(z.string()),
        }),
      ]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            type: "user";
            name: string;
        } | {
            type: "admin";
            permissions: string[];
        }"
      `);
    });

    it('handles nested unions', () => {
      const schema = z.union([z.string(), z.union([z.number(), z.boolean()])]);

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string | (number | boolean)');
    });
  });

  describe('z.discriminatedUnion()', () => {
    it('handles discriminated unions', () => {
      const schema = z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('circle'), radius: z.number() }),
        z.object({ kind: z.literal('square'), x: z.number() }),
        z.object({ kind: z.literal('triangle'), x: z.number(), y: z.number() }),
      ]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            kind: "circle";
            radius: number;
        } | {
            kind: "square";
            x: number;
        } | {
            kind: "triangle";
            x: number;
            y: number;
        }"
      `);
    });

    it('handles complex discriminated unions', () => {
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('success'),
          data: z.object({
            id: z.string(),
            value: z.number(),
          }),
        }),
        z.object({
          type: z.literal('error'),
          error: z.object({
            code: z.number(),
            message: z.string(),
          }),
        }),
      ]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            type: "success";
            data: {
                id: string;
                value: number;
            };
        } | {
            type: "error";
            error: {
                code: number;
                message: string;
            };
        }"
      `);
    });
  });
});
