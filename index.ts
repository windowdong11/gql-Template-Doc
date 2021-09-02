#!/usr/bin/env node
import fs from 'fs'
import Handlebars from 'handlebars';
import { getIntrospectionQuery, IntrospectionQuery, IntrospectionSchema } from 'graphql'
import fetch from 'node-fetch'
import { analyzeSchemaByType, ParsedIntrospectionType } from './newInspector';

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

function getSchemaFromEndpoint(endpoint: string) {
    return fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ query: getIntrospectionQuery() }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((res: Response) => {
        return res.json()
    }).then((json: { data: IntrospectionQuery }) => {
        return json.data.__schema
    })
}

// getSchemaFromEndpoint('http://localhost:4000')
getSchemaFromEndpoint('https://api.spacex.land/graphql/')
    .then((schema: IntrospectionSchema) => {
        const baseDir = './src'
        if(!fs.existsSync(baseDir))
            fs.mkdirSync(baseDir)
        main('./partials/index.html', `${baseDir}/index.html`, schema)
        schema.types.forEach(type => {
            if(!type.name.startsWith('__')){
                const parsedType = analyzeSchemaByType({schema, type})
                if(parsedType){
                    main('./partials/type.html', `${baseDir}/${type.name}.html`, parsedType)
                }
            }
        })
    })


//!
export interface SplitDirectivesResult {
    description: string,
    directives: {
        directiveName: string,
        directiveContent?: string
    }[]
}

export function splitDirectives(description: string): SplitDirectivesResult {
    const result: SplitDirectivesResult = { description: "", directives: [] }
    let directiveMatch: RegExpMatchArray | null
    while ((directiveMatch = description.match(/\B@(?<name>\w+)[( ]?/)) !== null) { // find word, starts with @ and next character is alphabet
        if (directiveMatch.index !== undefined && directiveMatch.groups) {
            // Add description
            result.description += description.slice(0, directiveMatch.index)

            // Split directive name and content
            if (directiveMatch[0].endsWith('(')) {
                let lastSymbol: FindBracketAreaResult
                lastSymbol = findBracketArea(description, '(', ')', directiveMatch.index + directiveMatch[0].length - 1)
                if (lastSymbol) {
                    result.directives.push({
                        directiveName: directiveMatch.groups.name,
                        directiveContent: description.slice(lastSymbol.start + 1, lastSymbol.end)
                    })
                    description = description.slice(lastSymbol.end + 1)
                }
            }
            // Only directive name left in description. (Ends with space or only directive left in description)
            else {
                result.directives.push({
                    directiveName: directiveMatch.groups.name
                })
                description = description.slice(directiveMatch.index + directiveMatch[0].length)
            }
        }
    }
    return result
}

/**
 * 
 * @returns undefined : open symbol not found
 * @returns number : End symbol at index, return value
 */
export type FindBracketAreaResult = { start: number, end: number } | undefined
export function findBracketArea(str: string, openSymbol: string, closeSymbol: string, from: number = 0): FindBracketAreaResult {
    // if(openSymbol === closeSymbol){
    //     throw new Error('openSymbol equals closeSymbol.')
    // }
    // if(openSymbol === ''){
    //     throw new Error('openSymbol is empty.')
    // }
    // if(closeSymbol === ''){
    //     throw new Error('closeSymbol is empty.')
    // }
    let result = { start: -1, end: -1 }

    let count = 0
    let searchStart = str.indexOf(openSymbol, from)
    if (searchStart !== -1) {
        ++count
        result.start = searchStart
    }
    else return undefined

    let lastStart = -1
    let lastEnd = -1
    while (count) {
        if (lastStart === -1) {
            lastStart = str.indexOf(openSymbol, searchStart + 1)
            // No more openSymbol left
        }
        if (lastEnd === -1) {
            lastEnd = str.indexOf(closeSymbol, searchStart + 1)
        }
        if (lastStart !== -1 && lastEnd !== -1) {
            if (lastStart < lastEnd) {
                ++count
                searchStart = lastStart
                lastStart = -1
            }
            else { // lastEnd < lastStart
                --count
                result.end = searchStart = lastEnd
                lastEnd = -1
            }
        }
        else if (lastEnd !== -1) {
            --count
            result.end = searchStart = lastEnd
            lastEnd = -1
        }
        else if (lastStart !== -1) {
            ++count
            searchStart = lastStart
            lastStart = -1
        }
        else {
            throw new Error('Pair of openSymbol, closeSymbol does not match.')
        }
    }
    if (result.start === -1 && result.end === -1)
        return undefined
    else return result
}