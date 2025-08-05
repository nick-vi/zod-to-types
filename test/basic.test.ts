import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToTypes, printNode } from '../src/index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const printNodeTest = (node: any) => printNode(node);

describe('Basic Types', () => {
  it('handles string type', () => {
    const schema = z.string();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string');
  });

  it('handles number type', () => {
    const schema = z.number();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('number');
  });

  it('handles boolean type', () => {
    const schema = z.boolean();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('boolean');
  });

  it('handles literal string', () => {
    const schema = z.literal('hello');
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('"hello"');
  });

  it('handles literal number', () => {
    const schema = z.literal(42);
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('42');
  });

  it('handles literal boolean', () => {
    const schema = z.literal(true);
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('true');
  });
});

describe('Complex Types', () => {
  it('handles array type', () => {
    const schema = z.array(z.string());
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string[]');
  });

  it('handles simple object', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          name: string;
          age: number;
      }"
    `);
  });

  it('handles union type', () => {
    const schema = z.union([z.string(), z.number()]);
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string | number');
  });

  it('handles optional type', () => {
    const schema = z.string().optional();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string | undefined');
  });

  it('handles nullable type', () => {
    const schema = z.string().nullable();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string | null');
  });
});

describe('Zod v4 String Formats', () => {
  it('handles email type', () => {
    const schema = z.email();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string');
  });

  it('handles uuid type', () => {
    const schema = z.uuid();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string');
  });

  it('handles url type', () => {
    const schema = z.url();
    const { node } = zodToTypes(schema);
    expect(printNodeTest(node)).toBe('string');
  });
});

describe('Enum Handling', () => {
  it('handles enum as union by default', () => {
    const schema = z.enum(['red', 'green', 'blue']);
    const { node } = zodToTypes(schema, undefined, { enumStyle: 'union' });
    expect(printNodeTest(node)).toBe('"red" | "green" | "blue"');
  });

  it('handles native enum as union', () => {
    enum Color {
      Red = 'red',
      Green = 'green',
      Blue = 'blue',
    }
    const schema = z.enum(Color);
    const { node } = zodToTypes(schema, undefined, { enumStyle: 'union' });
    expect(printNodeTest(node)).toBe('"red" | "green" | "blue"');
  });
});
