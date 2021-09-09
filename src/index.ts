#!/usr/bin/env node
import fs from 'fs'
import Handlebars from 'handlebars';
import inspectSchemaFromEndpoint, { ParsedIntrospectionType } from 'gqlinspector-core'
import yargs from 'yargs/yargs';
import copyDirectory from 'recursive-copy'
import path from 'path';

interface SchemaData {
    queryType: string,
    mutationType?: string,
    subscriptionType?: string,
    parsedTypes: ParsedIntrospectionType[]
}

function addHTMLPartial(partitial: string, source: string) {
    Handlebars.registerPartial(partitial, fs.readFileSync(source, 'utf-8').toString())
}

function registerInspectionHelpers() {
    Handlebars.registerHelper('isObject', function (value: any) {
        return 'kind' in value && value.kind === "OBJECT"
    });
    Handlebars.registerHelper('isInterface', function (value: any) {
        return 'kind' in value && value.kind === "INTERFACE"
    });
    Handlebars.registerHelper('isEnum', function (value: any) {
        return 'kind' in value && value.kind === "ENUM".toUpperCase()
    });
    Handlebars.registerHelper('isUnion', function (value: any) {
        return 'kind' in value && value.kind === "UNION".toUpperCase()
    });
    Handlebars.registerHelper('isInputObject', function (value: any) {
        return 'kind' in value && value.kind === "INPUT_OBJECT".toUpperCase()
    });
    Handlebars.registerHelper('isScalar', function (value: any) {
        return 'kind' in value && value.kind === "SCALAR".toUpperCase()
    });
}

function buildHTML(filename: fs.PathOrFileDescriptor, data: SchemaData | ParsedIntrospectionType) {
    const source = fs.readFileSync(filename, 'utf8').toString();
    const template = Handlebars.compile(source);

    registerInspectionHelpers()

    const output = template(data);
    return output
}

function main(src: fs.PathOrFileDescriptor, destination: fs.PathOrFileDescriptor, data: SchemaData | ParsedIntrospectionType) {
    const html = buildHTML(src, data);
    fs.writeFile(destination, html, function (err) {
        if (err) throw err
    });
}

// cli
(async () => {
    const yargsResult = await yargs(process.argv.slice(2))
    .options({
        sample: { type: 'boolean' },
        endpoint: { type: 'string', alias: 'e' },
        output: { type: 'string', alias: 'o', default: './src' },
        partialBaseDir: { type: 'string', alias: 'pb', default: './partials' },
        templateBaseDir: { type: 'string', alias: 'tb', default: './templates' },
        // No Need(Maybe)
        // r: { type: 'string', alias: 'root', default: 'Index.html'},
        type: { type: 'string', alias: 't', default: 'Type.html' },
        // TODO : Add field page generator method, then enable 'f' option
        // f: { type: 'string', alias: 'field', default: 'Field.html'}
    })
    .check(argv => {
        if (!argv.sample && !argv.endpoint) throw new Error('You must provide either --sample or --endpoint')
        if (argv.sample && argv.endpoint) throw new Error('You must use at least one option. --sample or --endpoint')
        return true
    })
    const argv = await yargsResult.argv;
    if (argv.sample) {
        copyDirectory(path.join(__dirname, '../sample'), process.cwd(), {overwrite: true})
        console.log('Example templates and partials generated.')
        console.log('Run "gql-template-doc -e https://api.spacex.land/graphql/" to generate example document.')
    }
    else if (argv.endpoint) {
        const endpoint = argv.endpoint
        const baseDir = argv.output
        // BaseDir shouldn't be ends with '/'
        const partialBaseDir = argv.partialBaseDir.endsWith('/') ? argv.partialBaseDir.slice(0, -1) : argv.partialBaseDir
        const templateBaseDir = argv.templateBaseDir.endsWith('/') ? argv.templateBaseDir.slice(0, -1) : argv.templateBaseDir
        const typeTemplate = argv.t
        console.log('[Generate GQLDocs]')
        console.log(`Endpoint: ${endpoint}`)
        console.log(`Partials: ${partialBaseDir}/*`)
        fs.readdirSync(partialBaseDir).forEach(file => {
            // * Add Partials under partialBaseDir
            addHTMLPartial(file.slice(0, -5), `${partialBaseDir}/${file}`)
            console.log(`Partial added : ${partialBaseDir}/${file}`)
        })

        // Endpoints for test
        // inspectSchemaFromEndpoint('http://localhost:4000')
        // inspectSchemaFromEndpoint('https://api.spacex.land/graphql/')
        inspectSchemaFromEndpoint(endpoint)
            .then(({ schema, parsedTypes }) => {
                const data: SchemaData = {
                    queryType: schema.queryType.name,
                    mutationType: schema.mutationType?.name,
                    subscriptionType: schema.subscriptionType?.name,
                    parsedTypes
                }
                if (!fs.existsSync(baseDir))
                    fs.mkdirSync(baseDir)
                fs.readdirSync(templateBaseDir).forEach(file => {
                    // * Render templates under templateBaseDir, except type template.
                    if (file !== `${typeTemplate}.html`) {
                        main(`${templateBaseDir}/${file}`, `${baseDir}/${file}`, data)
                        console.log(`Template rendered : ${templateBaseDir}/${file} ---> ${baseDir}/${file}`)
                    }
                })
                // * Render each types
                data.parsedTypes.forEach(parsedType => {
                    if (!parsedType.name.startsWith('__')) {
                        main(`${templateBaseDir}/${typeTemplate}`, `${baseDir}/${parsedType.name}.html`, parsedType)
                        console.log(`Template rendered : ${templateBaseDir}/${typeTemplate} ---> ${baseDir}/${parsedType.name}`)
                    }
                })

            })
    }
})()