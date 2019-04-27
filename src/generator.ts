import * as Handlebars from 'handlebars'
import { TemplateDelegate } from 'handlebars'
import * as fs from 'fs'
import * as path from 'path'
import { OpenAPIObject } from 'openapi3-ts'
import { IDefinition, GenFileRequest } from './types'
import mapTS from './mapTS'
import { snakeToCamel, camelToSnake } from './utils'
import ParseOperations from './operation'

export default class Generator {
  private definitionDir = 'models'
  private spec: OpenAPIObject
  private options: CodeGenOptions

  constructor(spec: OpenAPIObject, options: CodeGenOptions) {
    this.spec = spec
    this.options = options
  }

  generate() {
    if (this.spec.openapi !== '3.0.0') {
      throw new Error(
        `Only 3.0.0 is supported. Your version: ${this.spec.openapi}`
      )
    }

    // Parse spec
    const data = this.parseSpec()

    // Setup templates
    const definitionTmpl = fs.readFileSync(
        path.resolve(__dirname, '../templates/definition.hbs'),
        'utf-8'
      )
    const indexTmpl = fs.readFileSync(
      path.resolve(__dirname, '../templates/index.hbs'),
      'utf-8'
    )
    const namespaceTmpl = fs.readFileSync(
        path.resolve(__dirname, '../templates/namespace.hbs'),
        'utf-8'
      )
    const rootTmpl = fs.readFileSync(
      path.resolve(__dirname, '../templates/root.hbs'),
      'utf-8'
    )

    // Setup dist
    if (!fs.existsSync(this.dist)) {
      fs.mkdirSync(this.dist)
    }

    // Register partial for handlebars
    Handlebars.registerPartial('property', this.embedded('property'))
    Handlebars.registerPartial('ref', this.embedded('ref'))
    this.registerHelper()

    // Setup output directory
    const definitionDir = path.resolve(this.dist, this.definitionDir)
    if (data.definitions.length > 0 && !fs.existsSync(definitionDir)) {
      fs.mkdirSync(definitionDir)
    }

    // console.log(JSON.stringify(data, null, '\t'))

    // Create files and write schema
    this.genFiles([
      ...this.createDefinitions(
        data.definitions,
        Handlebars.compile(definitionTmpl),
        Handlebars.compile(indexTmpl),
        definitionDir
      ),
      {
        filepath: path.resolve(this.dist, `namespace.ts`),
        content: Handlebars.compile(namespaceTmpl)(data)
      },
      {
        filepath: path.resolve(this.dist, 'index.d.ts'),
        content: Handlebars.compile(rootTmpl)(data)
      }
    ])
  }

  /**
   * Create definitions
   * @param definitions
   * @param template
   */
  private createDefinitions(
    schemas: IDefinition[],
    template: TemplateDelegate,
    indexTemplate: TemplateDelegate,
    directory: string
  ): GenFileRequest[] {
    return [...schemas.map(v => {
      return {
        filepath: path.resolve(directory, `${v.name}.ts`),
        content: template(v)
      }
    }), {
      filepath: path.resolve(directory, `index.ts`),
      content: indexTemplate({ schemas })
    }]
  }

  parseSpec() {
    const components = this.spec.components || {}
    const schemas = components.schemas || {}

    const definitions: IDefinition[] = Object.keys(schemas).map(key => {
      return {
        name: key,
        schema: mapTS(schemas[key])
      }
    })

    return {
      definitions,
      namespace: this.options.namespace,
      tags: ParseOperations(this.spec)
    }
  }

  /**
   * Generate files with requests
   * @param genCodeRequests
   */
  private genFiles(genCodeRequests: GenFileRequest[]) {
    genCodeRequests.forEach(v => {
      fs.writeFileSync(v.filepath, v.content, {
        encoding: 'utf-8',
        flag: 'w+'
      })
      console.log('Generated:', v.filepath)
    })
  }

  /**
   * Register handlebars helpers
   */
  private registerHelper() {
    Handlebars.registerHelper('normalizeCase', (text, _) => {
      if (this.options.camelCase === true) {
        return snakeToCamel(text)
      }
      if (this.options.camelCase === false) {
        return camelToSnake(text)
      }
      return text
    })
    Handlebars.registerHelper('ifEmpty', function(conditional, options) {
      if (
        typeof conditional === 'object' &&
        Object.keys(conditional).length === 0
      ) {
        // @ts-ignore
        return options.fn(this)
      } else {
        // @ts-ignore
        return options.inverse(this)
      }
    })
    Handlebars.registerHelper('definitionDir', () => {
      return this.definitionDir
    })
  }

  /**
   * Get embbeded template by name
   * @param name
   */
  private embedded(name: string) {
    return Handlebars.compile(
      fs.readFileSync(
        path.resolve(__dirname, `../templates/${name}.hbs`),
        'utf-8'
      )
    )
  }

  /**
   * Get dist path
   */
  get dist(): string {
    return path.resolve(process.cwd(), this.options.dist)
  }
}

/**
 * Options for TSCodeGenerator
 */
export interface CodeGenOptions {
  namespace: string
  dist: string
  camelCase?: boolean
}
