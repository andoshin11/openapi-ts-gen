import { SchemaObject, ReferenceObject, OperationObject } from 'openapi3-ts'
import {
  TSSchema,
  SwaggerSchemaType,
  SwaggerSchemaFormat,
} from './types'
import * as types from './types'

// Map swagger types to typescript definitions
// [swagger-type:typescript-type]
export const typeMap: Record<SwaggerSchemaType, string> = {
  Array: 'Array',
  array: 'Array',
  List: 'Array',
  boolean: 'boolean',
  string: 'string',
  int: 'number',
  float: 'number',
  number: 'number',
  long: 'number',
  short: 'number',
  char: 'string',
  double: 'number',
  object: 'any',
  integer: 'number',
  Map: 'any',
  date: 'string',
  DateTime: 'Date',
  binary: 'string', // TODO: binary should be mapped to byte array
  ByteArray: 'string',
  UUID: 'string',
  File: 'any',
  Error: 'Error' // TODO: Error is not same as the Javascript Error
}

export function mapType(
  type?: SwaggerSchemaType,
  format?: SwaggerSchemaFormat
): string {
  if (!type) {
    return 'any'
  }

  if (type === 'string' && (format === 'int64' || format === 'uint64')) {
    // TODO: use options
    return 'number'
  }

  return typeMap[type] || 'any'
}

/**
 * Get ref names from ref path
 * @param schema
 */
export function getRefName(ref: string): string {
  const seguments = ref.split('/')
  return seguments[seguments.length - 1]
}

/**
 * Check paramter is required
 */
export function isRequired(schema: SchemaObject, key: string): boolean {
  return (schema.required || []).includes(key)
}

/**
 * Check passed object is schema or not
 * @param schemaOrBaseSchema
 */
export function isSchema(
  schemaOrBaseSchema: types.BaseSchema | types.Schema
): schemaOrBaseSchema is types.Schema {
  const schema = schemaOrBaseSchema as types.Schema
  return (
    schema.$ref !== undefined ||
    schema.allOf !== undefined ||
    schema.additionalProperties !== undefined ||
    schema.properties !== undefined ||
    schema.discriminator !== undefined ||
    schema.readOnly !== undefined ||
    schema.xml !== undefined ||
    schema.externalDocs !== undefined ||
    schema.example !== undefined ||
    schema.required !== undefined
  )
}

export function isSchemaObject(
  schema: SchemaObject | ReferenceObject
): schema is SchemaObject {
  return !schema.hasOwnProperty('$ref')
}

/**
 * Create operation name
 * @param method
 * @param operation
 */
export function createOperationName(
  method: string,
  operation: OperationObject
): string {
  // TODO: create operation name
  return operation.operationId || method
}

/**
 * Create default schema
 */
export function emptySchema(): TSSchema {
  return {
    type: 'void',
    isRequired: false,
    isRef: false,
    isArray: false,
    properties: {},
    enum: []
  }
}

/**
 * snake to camel case
 * @param str
 */
export function snakeToCamel(str: string) {
  return str.replace(/_+(\w){1}|-+(\w){1}/g, (_, group1, group2) => {
    var letter = group1 || group2
    return letter.toUpperCase()
  })
}

/**
 * camel to snake case
 * @param str
 */
export function camelToSnake(str: string) {
  return str
    .replace(/([a-z]|(?:[A-Z0-9]+))([A-Z0-9]|$)/g, (_, group1, group2) => {
      return group1 + (group2 && '_' + group2)
    })
    .toLowerCase()
}
