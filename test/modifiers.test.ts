import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Modifiers', () => {
  describe('z.optional()', () => {
    it('handles simple optional', () => {
      const schema = z.string().optional();
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string | undefined');
    });

    it('handles optional in objects', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nested: z.object({
          alsoOptional: z.number().optional(),
        }),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            required: string;
            optional?: string | undefined;
            nested: {
                alsoOptional?: number | undefined;
            };
        }"
      `);
    });

    it('handles complex optional combinations', () => {
      const schema = z.object({
        optional: z.string().optional(),
        transform: z.number().optional(),
        union: z.union([z.string(), z.number()]).optional(),
        tuple: z
          .tuple([
            z.string().optional(),
            z.number(),
            z.object({
              optional: z.string().optional(),
              required: z.string(),
            }),
          ])
          .optional(),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            optional?: string | undefined;
            transform?: number | undefined;
            union?: (string | number) | undefined;
            tuple?: [string | undefined, number, { optional?: string | undefined; required: string; }] | undefined;
        }"
      `);
    });
  });

  describe('z.nullable()', () => {
    it('handles simple nullable', () => {
      const schema = z.string().nullable();
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string | null');
    });

    it('handles nullable in objects', () => {
      const schema = z.object({
        username: z.string().nullable(),
        email: z.string(),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            username: string | null;
            email: string;
        }"
      `);
    });
  });

  describe('z.default()', () => {
    it('handles default values (type unchanged)', () => {
      const schema = z.object({
        name: z.string().default('Anonymous'),
        count: z.number().default(0),
        active: z.boolean().default(true),
      });

      const { node } = zodToTypes(schema);

      expect(printNodeTest(node)).toMatchInlineSnapshot(`
        "{
            name: string;
            count: number;
            active: boolean;
        }"
      `);
    });
  });

  describe('Combined modifiers', () => {
    it('handles optional + nullable', () => {
      const schema = z.string().optional().nullable();
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(string | undefined) | null');
    });

    it('handles nullable + optional', () => {
      const schema = z.string().nullable().optional();
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('(string | null) | undefined');
    });

    it('handles default + optional', () => {
      const schema = z.string().default('hello').optional();
      const { node } = zodToTypes(schema);
      expect(printNodeTest(node)).toBe('string | undefined');
    });
  });
});
