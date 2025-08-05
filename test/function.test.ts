import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Function Types', () => {
  describe('z.function() - Zod v4 API', () => {
    it('handles simple function', () => {
      const schema = z.function({
        input: [z.string()],
        output: z.number(),
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(arg0: string) => number');
    });

    it('handles multiple parameters', () => {
      const schema = z.function({
        input: [z.string(), z.number(), z.boolean()],
        output: z.string(),
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe(
        '(arg0: string, arg1: number, arg2: boolean) => string'
      );
    });

    it('handles complex parameter types', () => {
      const schema = z.function({
        input: [
          z.object({ name: z.string(), age: z.number() }),
          z.array(z.string()),
          z.union([z.string(), z.number()]),
        ],
        output: z.boolean(),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "(arg0: {
            name: string;
            age: number;
        }, arg1: string[], arg2: string | number) => boolean"
      `);
    });

    it('handles function with no parameters', () => {
      const schema = z.function({
        input: [],
        output: z.string(),
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('() => string');
    });

    it('handles function with no return type (void)', () => {
      const schema = z.function({
        input: [z.string()],
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(arg0: string) => void');
    });

    it('handles function with optional parameters', () => {
      const schema = z.function({
        input: [z.string(), z.number().optional(), z.boolean()],
        output: z.void(),
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe(
        '(arg0: string, arg1: number | undefined, arg2: boolean) => void'
      );
    });

    it('handles function returning complex types', () => {
      const schema = z.function({
        input: [z.string()],
        output: z.object({
          success: z.boolean(),
          data: z.array(z.string()),
        }),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "(arg0: string) => {
            success: boolean;
            data: string[];
        }"
      `);
    });

    it('handles function returning union types', () => {
      const schema = z.function({
        input: [z.string()],
        output: z.union([z.string(), z.null()]),
      });

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(arg0: string) => string | null');
    });
  });
});
