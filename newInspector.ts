import { IntrospectionEnumType, IntrospectionEnumValue, IntrospectionField, IntrospectionInputObjectType, IntrospectionInputValue, IntrospectionInterfaceType, IntrospectionNamedTypeRef, IntrospectionObjectType, IntrospectionScalarType, IntrospectionSchema, IntrospectionType, IntrospectionTypeRef, IntrospectionUnionType } from "graphql";
import { isIntrospectionListTypeRef, isIntrospectionNonNullTypeRef_Type } from "./types";

// * Custom Types

export interface Directive {
    name: string
    content?: string
}

export interface ParsedIntrospectionTypeRef {
    type: string,
    front: string,
    back: string
}

// * Extended types

export type ParsedIntrospectionType =
    | ParsedIntrospectionScalarType
    | ParsedIntrospectionObjectType
    | ParsedIntrospectionInterfaceType
    | ParsedIntrospectionUnionType
    | ParsedIntrospectionEnumType
    | ParsedIntrospectionInputObjectType;

export type ParsedIntrospectionOutputType =
    | ParsedIntrospectionScalarType
    | ParsedIntrospectionObjectType
    | ParsedIntrospectionInterfaceType
    | ParsedIntrospectionUnionType
    | ParsedIntrospectionEnumType;

export type ParsedIntrospectionInputType =
    | ParsedIntrospectionScalarType
    | ParsedIntrospectionEnumType
    | ParsedIntrospectionInputObjectType;

export interface ParsedIntrospectionScalarType extends IntrospectionScalarType {
    kind: 'SCALAR';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    specifiedByUrl?: string;
}

export interface ParsedIntrospectionObjectType extends Omit<IntrospectionObjectType, 'directives' | 'fields' | 'interfaces'> {
    kind: 'OBJECT';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    fields: Array<ParsedIntrospectionField>;
    interfaces: Array<string>;
}

export interface ParsedIntrospectionInterfaceType extends Omit<IntrospectionInterfaceType, 'directives' | 'fields' | 'interfaces' | 'possibleTypes'> {
    kind: 'INTERFACE';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    fields: Array<ParsedIntrospectionField>;
    interfaces: Array<string>;
    possibleTypes: Array<string>;
}

export interface ParsedIntrospectionUnionType extends Omit<IntrospectionUnionType, 'directives' | 'possibleTypes'> {
    kind: 'UNION';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    possibleTypes: Array<string>;
}

export interface ParsedIntrospectionEnumType extends Omit<IntrospectionEnumType, 'directives' | 'interfaces' | 'possibleTypes'> {
    kind: 'ENUM';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    enumValues: Array<ParsedIntrospectionEnumValue>;
}

export interface ParsedIntrospectionInputObjectType extends Omit<IntrospectionInputObjectType, 'directives' | 'inputFields'> {
    kind: 'INPUT_OBJECT';
    name: string;
    description?: string;
    directives?: Array<Directive>;
    inputFields: Array<ParsedIntrospectionInputValue>;
}

export interface ParsedIntrospectionNamedType<T extends ParsedIntrospectionType = ParsedIntrospectionType> extends IntrospectionNamedTypeRef {
    kind: T['kind'];
    name: string;
    description?: string;
    directives?: Array<Directive>;
}

export interface ParsedIntrospectionField extends Omit<IntrospectionField, 'directives' | 'args' | 'type'> {
    name: string;
    description?: string;
    directives?: Array<Directive>;
    args: Array<ParsedIntrospectionInputValue>;
    type: ParsedIntrospectionTypeRef;
    isDeprecated: boolean;
    deprecationReason?: string;
}

export interface ParsedIntrospectionInputValue extends Omit<IntrospectionInputValue, 'directives' | 'type'> {
    name: string;
    description?: string;
    directives?: Array<Directive>;
    type: ParsedIntrospectionTypeRef;
    defaultValue?: string;
    isDeprecated?: boolean;
    deprecationReason?: string;
}

export interface ParsedIntrospectionEnumValue extends IntrospectionEnumValue {
    name: string;
    description?: string;
    directives?: Array<Directive>;
    isDeprecated: boolean;
    deprecationReason?: string;
}

export interface SplitDirectivesResult {
    description: string,
    directives: Array<Directive>
}

export default function splitDirectives(description: string): SplitDirectivesResult {
    const result: SplitDirectivesResult = { description: "", directives: [] }
    let directiveMatch: RegExpMatchArray | null
    while ((directiveMatch = description.match(/\B@(?<name>\w+)[( ]?/)) !== null) { // find word, starts with @ and next character is alphabet
        if (directiveMatch.index !== undefined && directiveMatch.groups) {
            // Add description
            result.description += description.slice(0, directiveMatch.index)

            // Split directive name and content
            if (directiveMatch[0].endsWith('(')) {
                let lastSymbol: FindBracketAreaResult | undefined
                lastSymbol = findBracketArea(description, '(', ')', directiveMatch.index + directiveMatch[0].length - 1)
                if (lastSymbol) {
                    result.directives.push({
                        name: directiveMatch.groups.name,
                        content: description.slice(lastSymbol.start + 1, lastSymbol.end)
                    })
                    description = description.slice(lastSymbol.end + 1)
                }
            }
            // Only directive name left in description. (Ends with space or only directive left in description)
            else {
                result.directives.push({
                    name: directiveMatch.groups.name
                })
                description = description.slice(directiveMatch.index + directiveMatch[0].length)
            }
        }
    }
    return result
}

/**
 * 
 * @returns undefined : open symbol not found / open symbol and close symbol does not match properly
 * @returns number : End symbol at index, return value
 */
interface FindBracketAreaResult {
    start: number
    end: number
}
function findBracketArea(str: string, openSymbol: string, closeSymbol: string, from: number = 0): FindBracketAreaResult | undefined {
    if (openSymbol === closeSymbol) {
        throw new Error('[openSymbol] and [closeSymbol] are same.')
    }
    if (openSymbol === '') {
        throw new Error('[openSymbol] is empty.')
    }
    if (closeSymbol === '') {
        throw new Error('[closeSymbol] is empty.')
    }
    if (str.length <= from) {
        throw new Error('[from] is bigger or equals to [str.length].')
    }
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
            throw new Error('Pair of openSymbol and closeSymbol does not match.')
        }
    }
    if (result.start === -1 && result.end === -1)
        return undefined
    else return result
}

// !!!! Inspector

export interface AnalyzeSchemaByTypeProps {
    schema: IntrospectionSchema,
    type: IntrospectionType
}

// * schema에서 curType를 찾아서 분석한 결과를 돌려줌
export function analyzeSchemaByType(props: AnalyzeSchemaByTypeProps): ParsedIntrospectionType | undefined {
    const typeSchema = props.type
    if (typeSchema.kind === 'OBJECT' || typeSchema.kind === 'INTERFACE') {
        // * Query, Mutation, Subscription, Type(Object, Interface)
        // * View => FieldName(ArgName: ArgType) : FieldName
        const fields = typeSchema.fields.map(field => {
            const fieldResult: ParsedIntrospectionField = {
                ...field,
                description: undefined,
                directives: undefined,
                deprecationReason: field.deprecationReason ? field.deprecationReason : undefined,
                type: getIntrospectionType(field.type),
                args: field.args.map((arg) => {
                    const argResult: ParsedIntrospectionInputValue = {
                        ...arg,
                        description: undefined,
                        directives: undefined,
                        type: getIntrospectionType(arg.type),
                        defaultValue: arg.defaultValue ? arg.defaultValue : undefined,
                        deprecationReason: arg.deprecationReason ? arg.deprecationReason : undefined,
                    }
                    if (arg.description) {
                        const { description, directives } = splitDirectives(arg.description)
                        argResult.description = description
                        argResult.directives = directives
                    }
                    return argResult
                })
            }
            if (field.description) {
                const { description, directives } = splitDirectives(field.description)
                fieldResult.description = description
                fieldResult.directives = directives
            }
            return fieldResult
        }) as ParsedIntrospectionObjectType['fields']

        let typeResult: ParsedIntrospectionObjectType | ParsedIntrospectionInterfaceType
        if (typeSchema.kind === 'OBJECT') {
            typeResult = {
                ...typeSchema,
                description: undefined,
                fields,
                interfaces: typeSchema.interfaces.map(intf => intf.name)
            }
        }
        else {
            typeResult = {
                ...typeSchema,
                description: undefined,
                directives: undefined,
                possibleTypes: typeSchema.possibleTypes.map(ty => ty.name),
                fields,
                interfaces: typeSchema.interfaces.map(intf => intf.name)
            }
        }
        if (typeSchema.description) {
            const { description, directives } = splitDirectives(typeSchema.description)
            typeResult.description = description
            typeResult.directives = directives
        }
        return typeResult
    }
    else if (typeSchema.kind === 'ENUM') {
        const typeResult: ParsedIntrospectionEnumType = {
            ...typeSchema,
            description: undefined,
            enumValues: typeSchema.enumValues.map(enumValue => {
                const enumResult: ParsedIntrospectionEnumValue = {
                    ...enumValue,
                    description: undefined,
                    deprecationReason: enumValue.deprecationReason ? enumValue.deprecationReason : undefined,
                }
                if (enumValue.description) {
                    const { description, directives } = splitDirectives(enumValue.description)
                    enumResult.description = description
                    enumResult.directives = directives
                }
                return enumResult
            })
        }
        if (typeSchema.description) {
            const { description, directives } = splitDirectives(typeSchema.description)
            typeResult.description = description
            typeResult.directives = directives
        }
        return typeResult
    }
    else if (typeSchema.kind === "UNION") {
        const typeResult: ParsedIntrospectionUnionType = {
            ...typeSchema,
            description: undefined,
            possibleTypes: typeSchema.possibleTypes.map(possibleType => possibleType.name)
        }
        if (typeSchema.description) {
            const { description, directives } = splitDirectives(typeSchema.description)
            typeResult.description = description
            typeResult.directives = directives
        }
        return typeResult
    }
    else if (typeSchema.kind === "INPUT_OBJECT") {
        const typeResult: ParsedIntrospectionInputObjectType = {
            ...typeSchema,
            description: undefined,
            inputFields: typeSchema.inputFields.map(inputField => {
                const inputFieldResult: ParsedIntrospectionInputValue = {
                    ...inputField,
                    description: undefined,
                    defaultValue: inputField.defaultValue ? inputField.defaultValue : undefined,
                    deprecationReason: inputField.deprecationReason ? inputField.deprecationReason : undefined,
                    type: getIntrospectionType(inputField.type)
                }
                if (inputField.description) {
                    const { description, directives } = splitDirectives(inputField.description)
                    inputFieldResult.description = description
                    inputFieldResult.directives = directives
                }
                return inputFieldResult
            })
        }
        if (typeSchema.description) {
            const { description, directives } = splitDirectives(typeSchema.description)
            typeResult.description = description
            typeResult.directives = directives
        }
        return typeResult
    }
    else {
        const typeResult: ParsedIntrospectionScalarType = {
            ...typeSchema,
            description: undefined,
            specifiedByUrl: typeSchema.specifiedByUrl ? typeSchema.specifiedByUrl : undefined
        }
        if (typeSchema.description) {
            const { description, directives } = splitDirectives(typeSchema.description)
            typeResult.description = description
            typeResult.directives = directives
        }
        return typeResult
    }
}

export function getIntrospectionType(type: IntrospectionTypeRef): ParsedIntrospectionTypeRef {
    if (isIntrospectionNonNullTypeRef_Type(type)) {
        const { type: plainType, front, back } = getIntrospectionType(type.ofType)
        return {
            type: plainType,
            front,
            back: '!' + back
        }
    }
    else if (isIntrospectionListTypeRef(type)) {
        const { type: plainType, front, back } = getIntrospectionType(type.ofType)
        return {
            type: plainType,
            front: front + '[',
            back: ']' + back
        }
    }
    else { // Named Type
        return {
            type: type.name,
            front: '',
            back: ''
        }
    }
}