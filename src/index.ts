#!/usr/bin/env node
import fs from 'fs'
import Handlebars from 'handlebars';
import inspectSchemaFromEndpoint, { ParsedIntrospectionType } from 'gqlinspector-core'
import yargs from 'yargs/yargs';

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
        if (err) return console.log(err);
    });
}

// cli
(async () => {
    const argv = await yargs(process.argv.slice(2))
    .options({
        e: { type: 'string', alias: 'endpoint', demandOption: true },
        o: { type: 'string', alias: 'output', default: './src'},
        pb: { type: 'string', alias: 'partialBaseDir', default: './partials/'},
        tb: { type: 'string', alias: 'templateBaseDir', default: './templates/'},
        // No Need(Maybe)
        // r: { type: 'string', alias: 'root', default: 'Index.html'},
        t: { type: 'string', alias: 'type', default: 'Type.html'},
        // TODO : Add field page generator method, then enable 'f' option
        // f: { type: 'string', alias: 'field', default: 'Field.html'}
    }).argv;
    const endpoint = argv.e
    const baseDir = argv.o
    // BaseDir shouldn't be ends with '/'
    const partialBaseDir = argv.pb.endsWith('/') ? argv.pb.slice(0, -1) : argv.pb
    const templateBaseDir = argv.tb.endsWith('/') ? argv.tb.slice(0, -1) : argv.tb
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
            const data : SchemaData = {
                queryType: schema.queryType.name,
                mutationType: schema.mutationType?.name,
                subscriptionType: schema.subscriptionType?.name,
                parsedTypes
            }
            if (!fs.existsSync(baseDir))
                fs.mkdirSync(baseDir)
            fs.readdirSync(templateBaseDir).forEach(file => {
                // * Render templates under templateBaseDir, except type template.
                if(file !== `${typeTemplate}.html`){
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
})()