import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Object Types', () => {
  it('supports string literal properties', () => {
    const schema = z.object({
      'string-literal': z.string(),
      5: z.number(),
    });

    const { node } = zodToTypes(schema);

    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          "5": number;
          "string-literal": string;
      }"
    `);
  });

  it('does not unnecessarily quote identifiers', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
      countryOfOrigin: z.string(),
    });

    const { node } = zodToTypes(schema);

    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          id: string;
          name: string;
          countryOfOrigin: string;
      }"
    `);
  });

  it('handles special characters and escaping', () => {
    const schema = z.object({
      '\\': z.string(),
      '"': z.string(),
      "'": z.string(),
      '`': z.string(),
      '\n': z.number(),
      $e: z.any(),
      '4t': z.any(),
      _r: z.any(),
      '-r': z.undefined(),
    });

    const { node } = zodToTypes(schema);

    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          "\\\\": string;
          "\\"": string;
          "'": string;
          "\`": string;
          "\\n": number;
          $e: any;
          "4t": any;
          _r: any;
          "-r": undefined;
      }"
    `);
  });

  it('handles nested objects', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          age: z.number(),
        }),
        settings: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean(),
        }),
      }),
    });

    const { node } = zodToTypes(schema);

    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          user: {
              profile: {
                  name: string;
                  age: number;
              };
              settings: {
                  theme: "light" | "dark";
                  notifications: boolean;
              };
          };
      }"
    `);
  });

  it('handles mixed property types', () => {
    const schema = z.object({
      id: z.string(),
      count: z.number(),
      active: z.boolean(),
      tags: z.array(z.string()),
      metadata: z.record(z.string(), z.unknown()),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
    });

    const { node } = zodToTypes(schema);

    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          id: string;
          count: number;
          active: boolean;
          tags: string[];
          metadata: Record<string, unknown>;
          optional?: string | undefined;
          nullable: string | null;
      }"
    `);
  });
});
