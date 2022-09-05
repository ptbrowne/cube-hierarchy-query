import { DatasetCoreFactory } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { Construct, DESCRIBE } from '@tpluscode/sparql-builder'
import type StreamClient from 'sparql-http-client'
import fromStream from 'rdf-dataset-ext/fromStream.js'
import { meta } from '@zazuko/vocabulary-extras/builders'
import { findNodes } from 'clownface-shacl-path'
import { sh } from '@tpluscode/rdf-ns-builders'
import { isGraphPointer } from 'is-graph-pointer'
import { topDown } from './lib/patterns.js'

export class HierarchyNode {
  constructor(public readonly resource: GraphPointer, private hierarchyLevel: GraphPointer) {
  }

  get nextInHierarchy(): Array<HierarchyNode> {
    const nextLevel = this.hierarchyLevel.out(meta.nextInHierarchy)
    if (!isGraphPointer(nextLevel)) {
      return []
    }

    const path = nextLevel.out(sh.path)
    if (!isGraphPointer(path)) {
      throw new Error('sh:path must be single node')
    }

    return findNodes(this.resource, path)
      .map(child => new HierarchyNode(child, nextLevel))
  }
}

export interface Hierarchy {
  query: Construct
  execute(
    client: StreamClient,
    rdf: DatasetCoreFactory,
  ): Promise<Array<HierarchyNode>>
}

export function getHierarchy(hierarchy: GraphPointer): Hierarchy {
  const { described, where } = topDown(hierarchy)
  const query = DESCRIBE`${described}`
    .WHERE`${where}`
  return {
    query,
    async execute(client, $rdf) {
      const stream = await query.execute(client.query)
      const dataset = await fromStream($rdf.dataset(), stream)
      const roots = clownface({ dataset }).node(hierarchy.out(meta.hierarchyRoot))

      return roots.map(root => new HierarchyNode(root, hierarchy))
    },
  }
}
