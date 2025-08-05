import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Array and Tuple Types', () => {
  describe('z.array()', () => {
    it('handles simple arrays', () => {
      const schema = z.array(z.string());
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string[]');
    });

    it('handles complex element types', () => {
      const schema = z.array(
        z.object({
          id: z.number(),
          value: z.string(),
        })
      );

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            id: number;
            value: string;
        }[]"
      `);
    });

    it('handles nested arrays', () => {
      const schema = z.array(z.array(z.string()));
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string[][]');
    });

    it('handles arrays of unions', () => {
      const schema = z.array(z.union([z.string(), z.number()]));
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(string | number)[]');
    });
  });

  describe('z.tuple()', () => {
    it('handles simple tuples', () => {
      const schema = z.tuple([z.string(), z.number()]);
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('[string, number]');
    });

    it('handles complex tuples', () => {
      const schema = z.tuple([
        z.string(),
        z.number(),
        z.object({ name: z.string() }),
        z.array(z.boolean()),
      ]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(
        '"[string, number, { name: string; }, boolean[]]"'
      );
    });

    it('handles tuples with optional elements', () => {
      const schema = z.tuple([z.string(), z.number().optional(), z.boolean()]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(
        '"[string, number | undefined, boolean]"'
      );
    });

    it('handles nested tuples', () => {
      const schema = z.tuple([z.string(), z.tuple([z.number(), z.boolean()])]);

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toBe('[string, [number, boolean]]');
    });

    it('handles empty tuple', () => {
      const schema = z.tuple([]);
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('[]');
    });
  });

  describe('Mixed array/tuple scenarios', () => {
    it('handles array of tuples', () => {
      const schema = z.array(z.tuple([z.string(), z.number()]));
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('[string, number][]');
    });

    it('handles tuple of arrays', () => {
      const schema = z.tuple([z.array(z.string()), z.array(z.number())]);

      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('[string[], number[]]');
    });
  });
});
