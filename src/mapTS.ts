import { SchemaObject } from 'openapi3-ts'
import {
  getRefName,
  isSchema,
  isRequired,
  mapType,
} from './utils'
import * as types from './types'

/**
 * Map swagger types to TypeScript types
 * @param schema
 * @param required
 */
export default function mapTS(schema: SchemaObject, required: boolean = false) {
  const tsSchema: types.TSSchema = {
    type: mapType(
      schema.type as types.SwaggerSchemaType,
      schema.format as types.SwaggerSchemaFormat
    ),
    isRequired: required,
    isArray: false,
    isRef: false,
    enum: [],
    properties: {}
  }

  // Has array type
  if (schema.type === 'array') {
    const parsed = mapTS(schema.items as SchemaObject)
    tsSchema.type = parsed.type
    tsSchema.isArray = true
    tsSchema.isRef = parsed.isRef
    tsSchema.properties = parsed.properties
    return tsSchema
  }

  // Has enum values
  if (schema.enum) {
    tsSchema.enum = schema.enum
    return tsSchema
  }

  // Has schema
  if (isSchema(schema)) {
    if (schema.$ref) {
      const name = getRefName(schema.$ref)
      tsSchema.isRef = true
      tsSchema.type = name
    }
    if (schema.properties) {
      tsSchema.properties = Object.keys(schema.properties).reduce(
        (res: { [key: string]: types.TSSchema }, key) => {
          const property = schema.properties![key]
          res[key] = mapTS(property, isRequired(schema, key))
          return res
        },
        {}
      )
    }
    return tsSchema
  }
  return tsSchema
}
