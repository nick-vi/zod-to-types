import ts from 'typescript';
import type { ZodType } from 'zod';

import {
  type ZodToTypesOptions,
  type ZodToTypesReturn,
  type ZodToTypesStore,
  type ResolvedZodToTypesOptions,
  resolveOptions,
  getZodTypeName,
  getZodDef,
} from './types';
import {
  maybeIdentifierToTypeReference,
  createTypeReferenceFromString,
  createUnknownKeywordNode,
  getIdentifierOrStringLiteral,
  createUnionType,
  createIntersectionType,
  createLiteralType,
  createArrayType,
  createTupleType,
  createObjectType,
  createPropertySignature,
  createFunctionType,
  createParameter,
  callGetType,
} from './utils';
import { $ZodFunction } from 'zod/v4/core';

const { factory: f, SyntaxKind } = ts;

export const zodToTypes = (
  schema: ZodType | $ZodFunction,
  identifier?: string,
  options?: ZodToTypesOptions
): ZodToTypesReturn => {
  const resolvedOptions = resolveOptions(options);
  const store: ZodToTypesStore = { enums: [] };

  const node = zodToTypesNode(
    schema,
    identifier ?? 'GeneratedType',
    store,
    resolvedOptions
  );

  return { node, store };
};

const zodToTypesNode = (
  schema: ZodType | $ZodFunction,
  identifier: string,
  store: ZodToTypesStore,
  options: ResolvedZodToTypesOptions
): ts.TypeNode => {
  const typeName = getZodTypeName(schema);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = getZodDef(schema) as any; // Safe cast since we control the switch cases

  const customType = callGetType(schema, identifier, options);
  if (customType) {
    return maybeIdentifierToTypeReference(customType);
  }

  const otherArguments = [identifier, store, options] as const;

  switch (typeName) {
    case 'ZodString':
      return f.createKeywordTypeNode(SyntaxKind.StringKeyword);

    case 'ZodNumber':
      return f.createKeywordTypeNode(SyntaxKind.NumberKeyword);

    case 'ZodBigInt':
      return f.createKeywordTypeNode(SyntaxKind.BigIntKeyword);

    case 'ZodBoolean':
      return f.createKeywordTypeNode(SyntaxKind.BooleanKeyword);

    case 'ZodDate':
      return createTypeReferenceFromString('Date');

    case 'ZodSymbol':
      return f.createKeywordTypeNode(SyntaxKind.SymbolKeyword);

    case 'ZodUndefined':
      return f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword);

    case 'ZodNull':
      return f.createLiteralTypeNode(f.createNull());

    case 'ZodVoid':
      return f.createKeywordTypeNode(SyntaxKind.VoidKeyword);

    case 'ZodAny':
      return f.createKeywordTypeNode(SyntaxKind.AnyKeyword);

    case 'ZodUnknown':
      return createUnknownKeywordNode();

    case 'ZodNever':
      return f.createKeywordTypeNode(SyntaxKind.NeverKeyword);

    case 'ZodNaN':
      return f.createKeywordTypeNode(SyntaxKind.NumberKeyword);

    case 'ZodEmail':
    case 'ZodURL':
    case 'ZodUUID':
    case 'ZodGUID':
    case 'ZodCUID':
    case 'ZodCUID2':
    case 'ZodULID':
    case 'ZodNanoID':
    case 'ZodBase64':
    case 'ZodBase64URL':
    case 'ZodEmoji':
    case 'ZodIPv4':
    case 'ZodIPv6':
    case 'ZodCIDRv4':
    case 'ZodCIDRv6':
    case 'ZodISODate':
    case 'ZodISOTime':
    case 'ZodISODateTime':
    case 'ZodISODuration':
    case 'ZodJWT':
    case 'ZodE164':
      return f.createKeywordTypeNode(SyntaxKind.StringKeyword);

    case 'ZodLiteral':
      return createLiteralType(def.values[0]);

    case 'ZodEnum': {
      const entries = def.entries || {};
      const values = Object.values(entries);

      if (options.enumStyle === 'resolve') {
        const enumMembers = Object.entries(entries).map(([key, value]) => {
          const literal =
            typeof value === 'number'
              ? f.createNumericLiteral(value)
              : f.createStringLiteral(value as string);
          return f.createEnumMember(getIdentifierOrStringLiteral(key), literal);
        });

        const enumDeclaration = f.createEnumDeclaration(
          undefined,
          f.createIdentifier(identifier),
          enumMembers
        );

        store.enums.push(enumDeclaration);
        return createTypeReferenceFromString(identifier);
      }

      // Default and 'union': convert to union of literal types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const types = values.map((value: any) => createLiteralType(value));
      return createUnionType(types);
    }

    case 'ZodArray': {
      const elementType = zodToTypesNode(def.element, ...otherArguments);
      return createArrayType(elementType);
    }

    case 'ZodTuple': {
      const items = def.items || [];
      const elementTypes = items.map((item: ZodType) =>
        zodToTypesNode(item, ...otherArguments)
      );
      return createTupleType(elementTypes);
    }

    case 'ZodObject': {
      const shape = def.shape || {};
      const properties = Object.entries(shape).map(([key, value]) => {
        const propertyType = zodToTypesNode(
          value as ZodType,
          ...otherArguments
        );
        const isOptional = getZodTypeName(value as ZodType) === 'ZodOptional';
        return createPropertySignature(key, propertyType, isOptional);
      });
      return createObjectType(properties);
    }

    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      const options_array = def.options || [];
      const types = options_array.map((option: ZodType) =>
        zodToTypesNode(option, ...otherArguments)
      );
      return createUnionType(types);
    }

    case 'ZodIntersection': {
      const left = zodToTypesNode(def.left, ...otherArguments);
      const right = zodToTypesNode(def.right, ...otherArguments);
      return createIntersectionType([left, right]);
    }

    case 'ZodRecord': {
      const keyType = def.keyType
        ? zodToTypesNode(def.keyType, ...otherArguments)
        : f.createKeywordTypeNode(SyntaxKind.StringKeyword);
      const valueType = zodToTypesNode(def.valueType, ...otherArguments);
      return f.createTypeReferenceNode(f.createIdentifier('Record'), [
        keyType,
        valueType,
      ]);
    }

    case 'ZodMap': {
      const keyType = zodToTypesNode(def.keyType, ...otherArguments);
      const valueType = zodToTypesNode(def.valueType, ...otherArguments);
      return f.createTypeReferenceNode(f.createIdentifier('Map'), [
        keyType,
        valueType,
      ]);
    }

    case 'ZodSet': {
      const valueType = zodToTypesNode(def.valueType, ...otherArguments);
      return f.createTypeReferenceNode(f.createIdentifier('Set'), [valueType]);
    }

    case 'ZodPromise': {
      const valueType = zodToTypesNode(def.type, ...otherArguments);
      return f.createTypeReferenceNode(f.createIdentifier('Promise'), [
        valueType,
      ]);
    }

    case '$ZodFunction': {
      const inputSchema = def.input;
      const outputSchema = def.output;

      let parameters: ts.ParameterDeclaration[] = [];
      if (inputSchema?._zod?.def?.items) {
        parameters = inputSchema._zod.def.items.map(
          (input: ZodType, index: number) => {
            const paramType = zodToTypesNode(input, ...otherArguments);
            return createParameter(`arg${index}`, paramType);
          }
        );
      }

      const outputTypeName = outputSchema ? getZodTypeName(outputSchema) : '';
      const returnType =
        outputSchema &&
        outputTypeName !== '$ZodUnknown' &&
        outputTypeName !== 'ZodUnknown'
          ? zodToTypesNode(outputSchema, ...otherArguments)
          : f.createKeywordTypeNode(SyntaxKind.VoidKeyword);

      return createFunctionType(parameters, returnType);
    }

    case 'ZodOptional': {
      const innerType = zodToTypesNode(def.innerType, ...otherArguments);
      return f.createUnionTypeNode([
        innerType,
        f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
      ]);
    }

    case 'ZodNullable': {
      const innerType = zodToTypesNode(def.innerType, ...otherArguments);
      return f.createUnionTypeNode([
        innerType,
        f.createLiteralTypeNode(f.createNull()),
      ]);
    }

    case 'ZodDefault':
      return zodToTypesNode(def.innerType, ...otherArguments);

    case 'ZodTransform':
    case 'ZodPipe':
      return def.out
        ? zodToTypesNode(def.out, ...otherArguments)
        : createUnknownKeywordNode();

    case 'ZodLazy':
    case 'ZodCustom':
    default:
      return createUnknownKeywordNode();
  }
};

export { createTypeAlias, printNode, withGetType } from './utils';
export type { ZodToTypesOptions, GetType } from './types';
