import ts from 'typescript';
import type { ZodType } from 'zod';
import type {
  GetType,
  GetTypeFunction,
  ResolvedZodToTypesOptions,
} from './types';

const { factory: f, SyntaxKind, ScriptKind, ScriptTarget, EmitHint } = ts;

export const maybeIdentifierToTypeReference = (
  identifier: ts.Identifier | ts.TypeNode
): ts.TypeNode => {
  if (ts.isIdentifier(identifier)) {
    return f.createTypeReferenceNode(identifier);
  }
  return identifier;
};

export const createTypeReferenceFromString = (
  identifier: string
): ts.TypeReferenceNode =>
  f.createTypeReferenceNode(f.createIdentifier(identifier));

export const createUnknownKeywordNode = (): ts.KeywordTypeNode =>
  f.createKeywordTypeNode(SyntaxKind.UnknownKeyword);

export const createTypeAlias = (
  node: ts.TypeNode,
  identifier: string,
  comment?: string
): ts.TypeAliasDeclaration => {
  const typeAlias = f.createTypeAliasDeclaration(
    undefined,
    f.createIdentifier(identifier),
    undefined,
    node
  );

  if (comment) {
    addJsDocComment(typeAlias, comment);
  }

  return typeAlias;
};

const compactTupleFormatting = (output: string): string => {
  let result = output;
  let changed = true;

  while (changed) {
    const before = result;
    result = result.replace(
      /\[\s*\n\s*((?:[^[\]]+(?:\[[^\]]*\])?[^[\]]*,?\s*\n?\s*)*)\s*\]/g,
      (_match, content) => {
        const types = content
          .split(',')
          .map((type: string) =>
            type.trim().replace(/\n\s*/g, ' ').replace(/\s+/g, ' ')
          )
          .filter((type: string) => type.length > 0)
          .join(', ');
        return `[${types}]`;
      }
    );
    changed = result !== before;
  }

  return result.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
};

export const printNode = (
  node: ts.Node,
  printerOptions?: ts.PrinterOptions
): string => {
  const sourceFile = ts.createSourceFile(
    'print.ts',
    '',
    ScriptTarget.Latest,
    false,
    ScriptKind.TS
  );

  const defaultOptions: ts.PrinterOptions = {
    removeComments: false,
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: true,
    noEmitHelpers: true,
  };

  const printer = ts.createPrinter({ ...defaultOptions, ...printerOptions });
  const output = printer.printNode(EmitHint.Unspecified, node, sourceFile);

  return compactTupleFormatting(output);
};

export const withGetType = <T extends ZodType & GetType>(
  schema: T,
  getType: GetTypeFunction
): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zodSchema = schema as any;
  if (zodSchema._def) {
    zodSchema._def.getType = getType;
  }
  return schema;
};

const identifierRE = /^[$A-Z_a-z][\w$]*$/;

export const getIdentifierOrStringLiteral = (
  string_: string
): ts.Identifier | ts.StringLiteral => {
  if (identifierRE.test(string_)) {
    return f.createIdentifier(string_);
  }
  return f.createStringLiteral(string_);
};

export const addJsDocComment = (node: ts.Node, text: string): void => {
  ts.addSyntheticLeadingComment(
    node,
    SyntaxKind.MultiLineCommentTrivia,
    `* ${text} `,
    true
  );
};

export const createUnionType = (types: ts.TypeNode[]): ts.TypeNode => {
  if (types.length === 0) {
    return f.createKeywordTypeNode(SyntaxKind.NeverKeyword);
  }
  if (types.length === 1) {
    return types[0]!;
  }
  return f.createUnionTypeNode(types);
};

export const createIntersectionType = (types: ts.TypeNode[]): ts.TypeNode => {
  if (types.length === 0) {
    return f.createKeywordTypeNode(SyntaxKind.UnknownKeyword);
  }
  if (types.length === 1) {
    return types[0]!;
  }
  return f.createIntersectionTypeNode(types);
};

export const createLiteralType = (
  value: string | number | boolean
): ts.LiteralTypeNode => {
  if (typeof value === 'string') {
    return f.createLiteralTypeNode(f.createStringLiteral(value));
  }
  if (typeof value === 'number') {
    return f.createLiteralTypeNode(f.createNumericLiteral(value));
  }
  if (typeof value === 'boolean') {
    return f.createLiteralTypeNode(value ? f.createTrue() : f.createFalse());
  }
  throw new Error(`Unsupported literal type: ${typeof value}`);
};

export const createArrayType = (elementType: ts.TypeNode): ts.ArrayTypeNode =>
  f.createArrayTypeNode(elementType);

export const createTupleType = (elements: ts.TypeNode[]): ts.TupleTypeNode =>
  f.createTupleTypeNode(elements);

export const createObjectType = (
  properties: ts.PropertySignature[]
): ts.TypeLiteralNode => f.createTypeLiteralNode(properties);

export const createPropertySignature = (
  name: string | ts.PropertyName,
  type: ts.TypeNode,
  optional = false
): ts.PropertySignature => {
  const propertyName =
    typeof name === 'string' ? getIdentifierOrStringLiteral(name) : name;
  return f.createPropertySignature(
    undefined,
    propertyName,
    optional ? f.createToken(SyntaxKind.QuestionToken) : undefined,
    type
  );
};

export const createFunctionType = (
  parameters: ts.ParameterDeclaration[],
  returnType: ts.TypeNode
): ts.FunctionTypeNode =>
  f.createFunctionTypeNode(undefined, parameters, returnType);

export const createParameter = (
  name: string,
  type: ts.TypeNode,
  optional = false
): ts.ParameterDeclaration =>
  f.createParameterDeclaration(
    undefined,
    undefined,
    f.createIdentifier(name),
    optional ? f.createToken(SyntaxKind.QuestionToken) : undefined,
    type
  );

export const callGetType = (
  schema: unknown,
  identifier: string,
  options: ResolvedZodToTypesOptions
): ts.Identifier | ts.TypeNode | undefined => {
  if (!schema) {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zodSchema = schema as { _def?: { getType?: (...args: any[]) => any } };
  if (zodSchema._def?.getType) {
    return zodSchema._def.getType(ts, identifier, options);
  }
  return undefined;
};
