#!/usr/bin/env node
import fs from 'fs'
import Handlebars from 'handlebars';
import { IntrospectionSchema } from 'graphql'
import inspectSchemaFromEndpoint, { ParsedIntrospectionType } from 'gqlinspector-core'

function addHTMLPartial(partitial: string, source: string) {
    Handlebars.registerPartial(partitial, fs.readFileSync(source, 'utf-8').toString())
}

function registerInspectionHelpers(){
    Handlebars.registerHelper('isObject', function (value : any) {
        return 'kind' in value && value.kind === "OBJECT"
    });
    Handlebars.registerHelper('isInterface', function (value : any) {
        return 'kind' in value && value.kind === "INTERFACE"
    });
    Handlebars.registerHelper('isEnum', function (value : any) {
        return 'kind' in value && value.kind === "ENUM".toUpperCase()
    });
    Handlebars.registerHelper('isUnion', function (value : any) {
        return 'kind' in value && value.kind === "UNION".toUpperCase()
    });
    Handlebars.registerHelper('isInputObject', function (value : any) {
        return 'kind' in value && value.kind === "INPUT_OBJECT".toUpperCase()
    });
    Handlebars.registerHelper('isScalar', function (value : any) {
        return 'kind' in value && value.kind === "SCALAR".toUpperCase()
    });
}

function buildHTML(filename: fs.PathOrFileDescriptor, data: IntrospectionSchema | ParsedIntrospectionType) {
    const source = fs.readFileSync(filename, 'utf8').toString();
    const template = Handlebars.compile(source);

    registerInspectionHelpers()
    addHTMLPartial('TypeRef', './partials/typeRef.html')
    addHTMLPartial('Description', './partials/description.html')
    addHTMLPartial('Directives', './partials/directives.html')
    addHTMLPartial('Enum', './partials/enum.html')
    addHTMLPartial('Input', './partials/input.html')
    addHTMLPartial('Object', './partials/object.html')
    addHTMLPartial('Interface', './partials/object.html')
    addHTMLPartial('Union', './partials/union.html')
    addHTMLPartial('Type', './partials/type.html')
    
    const output = template(data);
    return output
}

function main(src: fs.PathOrFileDescriptor, destination: fs.PathOrFileDescriptor, data: IntrospectionSchema | ParsedIntrospectionType) {
    const html = buildHTML(src, data);
    fs.writeFile(destination, html, function (err) {
        if (err) return console.log(err);
    });
}

// inspectSchemaFromEndpoint('http://localhost:4000')
inspectSchemaFromEndpoint('https://api.spacex.land/graphql/')
    .then(({schema, parsedTypes}) => {
        const baseDir = './src'
        if(!fs.existsSync(baseDir))
            fs.mkdirSync(baseDir)
        main('./partials/index.html', `${baseDir}/index.html`, schema)
        parsedTypes.forEach(parsedType => {
            if(!parsedType.name.startsWith('__')){
                if(parsedType){
                    main('./partials/type.html', `${baseDir}/${parsedType.name}.html`, parsedType)
                }
            }
        })
    })