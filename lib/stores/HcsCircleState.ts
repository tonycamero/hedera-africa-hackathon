/**
 * HcsCircleState - Incremental Circle Graph Cache
 * 
 * Purpose: Maintain an incrementally-updated, auth-scoped contact graph
 * to eliminate surveillable "rebuild entire HCS history" pattern.
 * 
 * Architecture:
 * - Listens to CONTACT_ACCEPT, CONTACT_REVOKE, TRUST_ALLOCATE events from ingestion
 * - Maintains normalized graph keyed by Hedera account ID
 * - Exposes O(N) queries (N = user's contacts) instead of O(all events)
 * 
 * Privacy alignment: Returns ONLY first-degree connections for authenticated user
 */

export interface CircleNode {
  accountId: string
  handle: string
  profileHrl: string
  bondedAt: number
  metadata?: Record<string, any>
}

export interface CircleEdge {
  from: string
  to: string
  type: 'CONTACT_ACCEPT' | 'CONTACT_REVOKE' | 'TRUST_GIVEN'
  strength?: number
  createdAt: number
  revokedAt?: number
}

export interface CircleSubgraph {
  centerNode: CircleNode | null
  contacts: CircleNode[]
  innerCircle?: CircleNode[] // Reserved for Inner Circle meta-system
  edges: CircleEdge[]
  lastUpdated: number
}

interface CircleGraph {
  nodes: Map<string, CircleNode>
  edges: Map<string, CircleEdge[]> // keyed by accountId (outgoing edges)
  lastUpdated: number
  ready: boolean
}

class HcsCircleStateManager {
  private graph: CircleGraph = {
    nodes: new Map(),
    edges: new Map(),
    lastUpdated: Date.now(),
    ready: false
  }

  private listeners: (() => void)[] = []

  /**
   * Called by ingestion pipeline when CONTACT_ACCEPT or CONTACT_REVOKE event arrives
   */
  addContactEvent(event: {
    type: 'CONTACT_ACCEPT' | 'CONTACT_REVOKE'
    actor: string
    target?: string
    ts: number
    metadata?: Record<string, any>
  }): void {
    if (!event.target) {
      console.warn('[HcsCircleState] Contact event missing target, skipping')
      return
    }

    const { actor, target, type, ts, metadata } = event

    // Ensure both nodes exist
    this.ensureNode(actor, metadata)
    this.ensureNode(target, metadata)

    if (type === 'CONTACT_ACCEPT') {
      this.addEdge({
        from: actor,
        to: target,
        type: 'CONTACT_ACCEPT',
        createdAt: ts
      })
      
      // Add reciprocal edge (contact bonds are bidirectional)
      this.addEdge({
        from: target,
        to: actor,
        type: 'CONTACT_ACCEPT',
        createdAt: ts
      })

      console.log('[HcsCircleState] Added contact bond:', actor, '↔', target)
    } else if (type === 'CONTACT_REVOKE') {
      this.revokeEdge(actor, target, ts)
      this.revokeEdge(target, actor, ts) // Revoke reciprocal

      console.log('[HcsCircleState] Revoked contact bond:', actor, '↔', target)
    }

    this.graph.lastUpdated = Date.now()
    this.graph.ready = true
    this.notifyListeners()
  }

  /**
   * Called by ingestion pipeline when TRUST_ALLOCATE event arrives
   * (Optional - for future trust strength weighting)
   */
  addTrustEvent(event: {
    type: 'TRUST_ALLOCATE'
    actor: string
    target?: string
    ts: number
    metadata?: Record<string, any>
  }): void {
    if (!event.target) return

    const { actor, target, ts, metadata } = event
    const amount = metadata?.amount || 1

    // Find existing edge and update strength
    const edges = this.graph.edges.get(actor) || []
    const edge = edges.find(e => e.to === target && e.type === 'CONTACT_ACCEPT')

    if (edge) {
      edge.strength = (edge.strength || 0) + amount
      console.log('[HcsCircleState] Updated trust strength:', actor, '→', target, edge.strength)
      this.notifyListeners()
    }
  }

  /**
   * Primary query method: Get user's circle (first-degree connections only)
   * This is what /api/circle will call - O(N) where N = user's contacts
   */
  getCircleFor(accountId: string): CircleSubgraph {
    const centerNode = this.graph.nodes.get(accountId) || null
    const edges = this.graph.edges.get(accountId) || []
    
    // Filter to active (non-revoked) CONTACT_ACCEPT edges
    const activeEdges = edges.filter(e => 
      e.type === 'CONTACT_ACCEPT' && !e.revokedAt
    )

    // Resolve contact nodes
    const contacts: CircleNode[] = []
    for (const edge of activeEdges) {
      const contactNode = this.graph.nodes.get(edge.to)
      if (contactNode) {
        contacts.push(contactNode)
      }
    }

    return {
      centerNode,
      contacts,
      edges: activeEdges,
      lastUpdated: this.graph.lastUpdated
    }
  }

  /**
   * Convenience method: Get just the contact list for a user
   */
  getContactsFor(accountId: string): CircleNode[] {
    return this.getCircleFor(accountId).contacts
  }

  /**
   * Check if state is ready (has processed at least one event)
   */
  isReady(): boolean {
    return this.graph.ready
  }

  /**
   * Get basic stats for observability
   */
  getStats(): {
    nodeCount: number
    edgeCount: number
    lastUpdated: number
    ready: boolean
  } {
    let totalEdges = 0
    for (const edges of this.graph.edges.values()) {
      totalEdges += edges.length
    }

    return {
      nodeCount: this.graph.nodes.size,
      edgeCount: totalEdges,
      lastUpdated: this.graph.lastUpdated,
      ready: this.graph.ready
    }
  }

  /**
   * Clear all state (for testing)
   */
  clear(): void {
    this.graph.nodes.clear()
    this.graph.edges.clear()
    this.graph.lastUpdated = Date.now()
    this.graph.ready = false
    console.log('[HcsCircleState] Cleared all state')
    this.notifyListeners()
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // ===== PRIVATE HELPERS =====

  private ensureNode(accountId: string, metadata?: Record<string, any>): void {
    if (!this.graph.nodes.has(accountId)) {
      this.graph.nodes.set(accountId, {
        accountId,
        handle: metadata?.handle || `User ${accountId.slice(-6)}`,
        profileHrl: `hcs://11/profile/${accountId}`,
        bondedAt: Date.now(),
        metadata
      })
    }
  }

  private addEdge(edge: CircleEdge): void {
    const edges = this.graph.edges.get(edge.from) || []
    
    // Check if edge already exists
    const existingIndex = edges.findIndex(e => 
      e.to === edge.to && e.type === edge.type
    )

    if (existingIndex >= 0) {
      // Update existing edge (in case of re-bonding)
      edges[existingIndex] = { ...edges[existingIndex], ...edge, revokedAt: undefined }
    } else {
      // Add new edge
      edges.push(edge)
    }

    this.graph.edges.set(edge.from, edges)
  }

  private revokeEdge(from: string, to: string, revokedAt: number): void {
    const edges = this.graph.edges.get(from) || []
    const edge = edges.find(e => e.to === to && e.type === 'CONTACT_ACCEPT')

    if (edge) {
      edge.revokedAt = revokedAt
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('[HcsCircleState] Listener error:', error)
      }
    })
  }
}

// Singleton instance
export const circleState = new HcsCircleStateManager()

// Debug interface (client-side only)
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.circleState = {
    getCircleFor: (accountId: string) => circleState.getCircleFor(accountId),
    getContactsFor: (accountId: string) => circleState.getContactsFor(accountId),
    getStats: () => circleState.getStats(),
    isReady: () => circleState.isReady(),
    clear: () => circleState.clear()
  }
}
