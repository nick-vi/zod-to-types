import ts from 'typescript';
import type { ZodType } from 'zod';

export type ZodToTypesOptions = {
  enumStyle?: 'resolve' | 'union';
};

export const resolveOptions = (
  raw?: ZodToTypesOptions
): ResolvedZodToTypesOptions => {
  const resolved: ResolvedZodToTypesOptions = {
    enumStyle: 'union',
  };
  return { ...resolved, ...raw };
};

export type ResolvedZodToTypesOptions = Required<ZodToTypesOptions>;

export type ZodToTypesStore = {
  enums: ts.EnumDeclaration[];
};

export type ZodToTypesReturn = {
  node: ts.TypeNode;
  store: ZodToTypesStore;
};

export type GetTypeFunction = (
  typescript: typeof ts,
  identifier: string,
  options: ResolvedZodToTypesOptions
) => ts.Identifier | ts.TypeNode;

export type GetType = { _def: { getType?: GetTypeFunction } };

type SchemaLike = {
  constructor: { name: string };
  _def?: unknown;
};

export const getZodTypeName = (schema: ZodType | SchemaLike): string => {
  if (!schema || !schema.constructor) {
    return 'ZodUnknown';
  }
  return schema.constructor.name || 'ZodUnknown';
};

export const getZodDef = (
  schema: ZodType | SchemaLike
): Record<string, unknown> => {
  if (!schema) {
    return {};
  }
  const zodSchema = schema as { _def?: Record<string, unknown> };
  return zodSchema._def || {};
};
