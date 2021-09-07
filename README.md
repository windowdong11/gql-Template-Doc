# GQL-Template-Doc

Templating and generating GraphQL schema from endpoint.  
(Introspection should be enabled.)  
> Why you should disable graphql inspection in production  
> [General](https://lab.wallarm.com/why-and-how-to-disable-introspection-query-for-graphql-apis/)  
> [Apollo](https://www.apollographql.com/blog/graphql/security/why-you-should-disable-graphql-introspection-in-production/)

## Installation

Using npm :  
```sh
# install local
$ npm i gql-template-doc
# install global
$ npm i -g gql-template-doc
```

## Usage

```sh
gql-template-doc -e=<endpoint> [--options]
```

| required | alias | options                 | defaultValue  | description                             |
| :------: | ----- | :---------------------- | ------------- | --------------------------------------- |
|    O     | -e    | --endpoint              |               | GraphQL Endpoint for generate document. |
|          | -o    | --output                | "./src"       | Output file directory.                  |
|          |       | --pb, --partialBaseDir  | "./partials"  | Partials directory.                     |
|          |       | --tb, --templateBaseDir | "./templates" | Templates directory.                    |
|          |       | -t, --type              | "Type.html"   | Type template file name.                |