# @zazuko/cube-hierarchy-query ![esm](https://img.shields.io/static/v1?label=ES&message=modules&color=green)

Use it to work with hierarchies defined using the [RDF Cube Schema](https://zazuko.github.io/rdf-cube-schema/#hierarchies)

## Usage

The examples below assume `dataset` is an RDF/JS graph of Swiss cantons:

```turtle
PREFIX meta: <https://cube.link/meta/>
PREFIX sh: <http://www.w3.org/ns/shacl#>

<hierarchy/Switzerland>
  a meta:Hierarchy ;
  meta:hierarchyRoot <country/CHE> ;
  meta:nextInHierarchy <hierarchy/Switzerland/cantons> .
  
<hierarchy/Switzerland/cantons>
  schema:name "Canton" ;
  sh:path schema:containsPlace ;
  meta:nextInHierarchy <hierarchy/Switzerland/municipalities> .
  
<hierarchy/Switzerland/municipalities>
  schema:name "Municipalities" ;
  sh:path [ sh:inversePath schema:containedInPlace ] ;
  meta:nextInHierarchy <hierarchy/Switzerland/districts> .
    
<hierarchy/Switzerland/districts>
  schema:name "Districts" ;
  sh:path [ sh:inversePath schema:containedInPlace ] .
```

### Find resources

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)) and the URI of a resource from that hierarchy,
finds children of that resource

```typescript
import { children } from '@zazuko/cube-hierarchy-query/resources'
import $rdf from 'rdf-ext'
import StreamClient from 'sparql-http-builder'
import { schema } from '@tpluscode/rdf-ns-builders'

let dataset: DatasetCore
let municipality: NamedNode

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/districts')
const client = new StreamClient()

const query = children(districtLevel, municipality, {
  limit: 10,            // optional (default 1)
  offset: 10,           // optional (default 0)
  orderBy: schema.name, // optional (default undefined)
})

// will return array of graph pointers to children on the given municipality
const pointers: GraphPointer[] = await query.execute(client, $rdf)
```

### Introspect properties

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)),
finds properties which connect resources from that level with the next.

Return a graph of `?property rdfs:label ?label` quads of found properties

```typescript
import { properties } from '@zazuko/cube-hierarchy-query/introspect'
import StreamClient from 'sparql-http-builder'

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/cantons')
const client = new StreamClient()

const stream = await properties(cantonLevel).execute(client.query)
```

### Introspect types

Given a hierarchy level ([`GraphPointer`](https://zazuko.github.io/clownface/#/api?id=clownface)),
finds types of resources at the given level 

Return a graph of `?type rdfs:label ?label` quads of found properties

```typescript
import { types } from '@zazuko/cube-hierarchy-query/introspect'
import StreamClient from 'sparql-http-builder'

const districtLevel = clownface({ dataset }).namedNode('hierarchy/Switzerland/cantons')
const client = new StreamClient()

const stream = await types(cantonLevel).execute(client.query)
```


## Examples

The [examples](./examples) directory contains snippets showing the usage on real cubes & hierarchies.

To run call from `example` NPM script and pass the example file's path as argument. For example

```
yarn example ./examples/children.ts
```

To have the executed queries printed in the console, set a `DEBUG` environment variable:

```diff
-yarn example ./examples/children.ts
+DEBUG=SPARQL yarn example ./examples/children.ts
```
