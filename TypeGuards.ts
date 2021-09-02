import { IntrospectionType, IntrospectionObjectType, IntrospectionInterfaceType, IntrospectionScalarType, IntrospectionUnionType, IntrospectionEnumType, IntrospectionInputObjectType, IntrospectionTypeRef, IntrospectionNamedTypeRef, IntrospectionNonNullTypeRef, IntrospectionListTypeRef, IntrospectionInputTypeRef, IntrospectionInputType, IntrospectionOutputTypeRef, IntrospectionOutputType } from "graphql"

// * Type Guards : For Types

export function isIntrospectionObjectType(obj: IntrospectionType): obj is IntrospectionObjectType { return obj.kind === 'OBJECT' }
export function isIntrospectionInterfaceType(obj: IntrospectionType): obj is IntrospectionInterfaceType { return obj.kind === 'INTERFACE' }
export function isIntrospectionScalarType(obj: IntrospectionType): obj is IntrospectionScalarType { return obj.kind === 'SCALAR' }
export function isIntrospectionUnionType(obj: IntrospectionType): obj is IntrospectionUnionType { return obj.kind === 'UNION' }
export function isIntrospectionEnumType(obj: IntrospectionType): obj is IntrospectionEnumType { return obj.kind === 'ENUM' }
export function isIntrospectionInputObjectType(obj: IntrospectionType): obj is IntrospectionInputObjectType { return obj.kind === 'INPUT_OBJECT' }

// * Type Guards : For References

export function isIntrospectionNamedTypeRef_Type(obj: IntrospectionTypeRef)
    : obj is IntrospectionNamedTypeRef {
    return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_Type(obj))
}

export function isIntrospectionNonNullTypeRef_Type(obj: IntrospectionTypeRef)
    : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef | IntrospectionListTypeRef<any>> {
    return obj.kind === 'NON_NULL'
}

export function isIntrospectionNamedTypeRef_InputType(obj: IntrospectionInputTypeRef)
    : obj is IntrospectionNamedTypeRef<IntrospectionInputType> {
    return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_InputType(obj))
}

export function isIntrospectionNonNullTypeRef_InputType(obj: IntrospectionInputTypeRef)
    : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionInputType> | IntrospectionListTypeRef<any>> {
    return obj.kind === 'NON_NULL'
}

export function isIntrospectionNamedTypeRef_OutputType(obj: IntrospectionOutputTypeRef)
    : obj is IntrospectionNamedTypeRef<IntrospectionOutputType> {
    return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_OutputType(obj))
}

export function isIntrospectionNonNullTypeRef_OutputType(obj: IntrospectionOutputTypeRef)
    : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionOutputType> | IntrospectionListTypeRef<any>> {
    return obj.kind === 'NON_NULL'
}

export function isIntrospectionListTypeRef(obj: IntrospectionInputTypeRef | IntrospectionOutputTypeRef | IntrospectionTypeRef)
    : obj is IntrospectionListTypeRef<any> {
    return obj.kind === 'LIST'
}