'use client';

import { decodeRecognition, type RecognitionDecoded, type RecognitionDefinitionDecoded, type RecognitionInstanceDecoded, type MirrorMsg } from './mirror/decodeRecognition';
import { MIRROR_REST, MIRROR_WS, TOPIC } from '@/lib/env';
import { signalsStore } from '@/lib/stores/signalsStore';

type Def = {
  id: string;               // canonical
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  _hrl: string;
  _ts: string;
};

type Inst = {
  owner?: string;
  definitionId?: string;
  definitionSlug?: string;
  note?: string;
  issuer?: string;
  _hrl: string;
  _ts: string;
};

export class HCSRecognitionService {
  private defsById = new Map<string, Def>();
  private defsBySlug = new Map<string, Def>();
  private pending: Inst[] = [];
  private disposeFns: Array<() => void> = [];
  private initialized = false;

  public get isInitialized() { return this.initialized; }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // Use verified/fallback topic if env is missing, to match original behavior
    const recognitionTopic = TOPIC.recognition || '0.0.6895261';
    
    // Validate topic ID before proceeding
    if (!recognitionTopic || recognitionTopic.trim() === '' || !recognitionTopic.match(/^0\.0\.[0-9]+$/)) {
      console.error('[HCSRecognitionService] Invalid recognition topic ID:', recognitionTopic);
      throw new Error(`Invalid recognition topic ID: ${recognitionTopic}`);
    }

    console.log('[HCSRecognitionService] init: backfill + WS on', recognitionTopic);

    try {
      // 1) Backfill from REST (ascending so older defs land first; order-independent logic still used)
      const decoded = await this.backfill(recognitionTopic, 200, 'asc');

      const defs = decoded.filter(d => d._kind === 'definition') as RecognitionDefinitionDecoded[];
      const inst = decoded.filter(d => d._kind === 'instance') as RecognitionInstanceDecoded[];

      console.log('[HCSRecognitionService] Raw decoded messages:', {
        total: decoded.length,
        defs: defs.length,
        inst: inst.length
      });

      // Show sample messages if no definitions found for debugging
      if (defs.length === 0 && decoded.length > 0) {
        console.log('[HCSRecognitionService] No definitions detected. Sample messages:');
        decoded.slice(0, 3).forEach((msg, i) => {
          console.log(`  Sample ${i + 1}:`, {
            _kind: msg._kind,
            type: (msg as any).type,
            schema: (msg as any).schema,
            hasName: 'name' in msg,
            hasSlug: 'slug' in msg,
            hasOwner: 'owner' in msg,
            keys: Object.keys(msg).filter(k => !k.startsWith('_'))
          });
        });
      }

      this.ingestDefinitions(defs);
      this.ingestInstances(inst);

      console.log('[HCSRecognitionService] backfill summary', {
        total: decoded.length, defs: defs.length, inst: inst.length,
        defsInCache: this.defsById.size, pendingInstances: this.pending.length
      });

      // 2) Live via WS
      const dispose = this.subscribe(recognitionTopic, (d) => {
        console.log('[HCSRecognitionService] WS message:', d._kind, d._hrl);
        if (d._kind === 'definition') this.ingestDefinitions([d]);
        else this.ingestInstances([d]);
      });
      this.disposeFns.push(dispose);

    } catch (error) {
      console.error('[HCSRecognitionService] Initialization failed:', error);
      
      // Instead of completely failing, mark as initialized with degraded functionality
      // This allows the UI to continue working even if recognition data isn't available
      console.warn('[HCSRecognitionService] Running in degraded mode - recognition data may not be available');
      this.initialized = true; // Mark as initialized to prevent infinite retry loops
      
      // Don't throw the error - allow the service to run in degraded mode
      // throw error;
    }
  }

  dispose() {
    this.disposeFns.splice(0).forEach(fn => fn());
    this.initialized = false;
    console.log('[HCSRecognitionService] Disposed');
  }

  // ---------- ingestion ----------

  private ingestDefinitions(defs: RecognitionDefinitionDecoded[]) {
    let added = 0;
    for (const d of defs) {
      const id = d.id || d.slug || d._hrl; // tolerates partial defs
      if (!id) { 
        console.warn('[HCSRecognitionService] definition missing id/slug', d); 
        continue; 
      }

      const def: Def = {
        id, 
        slug: d.slug, 
        name: d.name, 
        description: d.description, 
        icon: d.icon,
        _hrl: d._hrl, 
        _ts: d._ts,
      };

      // overwrite by latest ts if needed (optional)
      const existing = this.defsById.get(id);
      if (!existing || existing._ts <= def._ts) {
        this.defsById.set(id, def);
        if (def.slug) this.defsBySlug.set(def.slug, def);
        added++;
      }
    }

    // Try to resolve any queued instances
    if (this.pending.length) {
      const still: Inst[] = [];
      for (const p of this.pending) {
        if (!this.tryResolveAndPublish(p)) still.push(p);
      }
      const resolved = this.pending.length - still.length;
      this.pending = still;
      
      if (resolved > 0) {
        console.log('[HCSRecognitionService] Resolved', resolved, 'pending instances');
      }
    }

    console.log('[HCSRecognitionService] defs cached +', added,
      'total:', this.defsById.size, 'ids:', [...this.defsById.keys()], 'slugs:', [...this.defsBySlug.keys()]);
  }

  private ingestInstances(instances: RecognitionInstanceDecoded[]) {
    let resolved = 0, queued = 0;
    for (const i of instances) {
      const inst: Inst = {
        owner: i.owner, 
        definitionId: i.definitionId, 
        definitionSlug: i.definitionSlug,
        note: i.note, 
        issuer: i.issuer, 
        _hrl: i._hrl, 
        _ts: i._ts,
      };
      if (this.tryResolveAndPublish(inst)) resolved++;
      else { 
        this.pending.push(inst); 
        queued++; 
      }
    }
    console.log('[HCSRecognitionService] instances resolved', resolved, 'queued', queued, 'pending total', this.pending.length);
  }

  private tryResolveAndPublish(inst: Inst): boolean {
    const def =
      (inst.definitionId && this.defsById.get(inst.definitionId)) ||
      (inst.definitionSlug && this.defsBySlug.get(inst.definitionSlug));
    
    if (!def) {
      // Create a fallback definition if we can't resolve it
      const fallbackDef: Def = {
        id: inst.definitionId || inst.definitionSlug || 'unknown',
        slug: inst.definitionSlug || inst.definitionId,
        name: inst.definitionSlug || inst.definitionId || 'Unknown Recognition',
        description: 'Recognition definition not found',
        icon: '🏆',
        _hrl: `hcs://fallback/${inst.definitionId || inst.definitionSlug}`,
        _ts: inst._ts
      };
      
      // Use the fallback definition but log the issue
      console.warn('[HCSRecognitionService] Cannot resolve instance - missing definition for:', 
        inst.definitionId || inst.definitionSlug, 'available defs:', [...this.defsById.keys()], 
        '- using fallback definition');
      
      // Store the fallback definition for future use
      if (fallbackDef.id) {
        this.defsById.set(fallbackDef.id, fallbackDef);
        if (fallbackDef.slug) {
          this.defsBySlug.set(fallbackDef.slug, fallbackDef);
        }
      }
      
      // Continue with the fallback definition
      return this.publishInstanceWithDefinition(inst, fallbackDef);
    }

    // Use the resolved definition
    return this.publishInstanceWithDefinition(inst, def);
  }

  private publishInstanceWithDefinition(inst: Inst, def: Def): boolean {
    // 🔁 Map to SignalEvent format for the store
    const signalEvent = {
      id: `recognition_${inst._hrl.replace(/[:/]/g, '_')}`,
      class: 'recognition' as const,
      topicType: 'SIGNAL' as const,
      direction: 'inbound' as const,
      actors: {
        from: inst.issuer || 'system',
        to: inst.owner
      },
      payload: {
        definitionId: def.id,
        definitionSlug: def.slug,
        definitionName: def.name,
        definitionIcon: def.icon,
        note: inst.note,
        owner: inst.owner,
        issuer: inst.issuer
      },
      ts: new Date(inst._ts).getTime(),
      status: 'onchain' as const,
      type: 'recognition_mint',
      meta: {
        tag: 'hcs_recognition',
        hrl: inst._hrl
      }
    };

    // ✅ Add to SignalsStore
    signalsStore.add(signalEvent);

    console.log('[HCSRecognitionService] resolved instance →', def.slug || def.id, 'owner=', inst.owner);
    return true;
  }

  // ---------- Public API for UI ----------

  isReady(): boolean {
    return this.initialized;
  }

  getDefinition(idOrSlug: string): Def | null {
    console.log('[HCSRecognitionService] Looking for definition:', idOrSlug);
    console.log('[HCSRecognitionService] Available definitions in cache:', [...this.defsById.keys()]);
    
    const def = this.defsById.get(idOrSlug) || this.defsBySlug.get(idOrSlug);
    console.log('[HCSRecognitionService] Found definition:', def ? 'YES' : 'null');
    
    return def || null;
  }

  getAllDefinitions(): Def[] {
    return Array.from(this.defsById.values());
  }

  getUserRecognitionInstances(owner: string): Inst[] {
    console.log('[HCSRecognitionService] Getting recognition instances for owner:', owner);
    
    // Get recognition instances directly from HCS via cached data
    // Filter the pending array and resolved instances for this owner
    const ownerInstances: Inst[] = [];
    
    // Check pending instances
    this.pending.forEach(inst => {
      if (inst.owner === owner) {
        ownerInstances.push(inst);
      }
    });
    
    console.log('[HCSRecognitionService] Found', ownerInstances.length, 'instances for owner (direct HCS):', owner);
    return ownerInstances;
  }

  getRecognitionDefinition(idOrSlug: string): Def | null {
    return this.getDefinition(idOrSlug);
  }

  // ---------- IO (REST + WS) ----------

  private async backfill(topicId: string, limit = 200, order: 'asc'|'desc' = 'asc') {
    const url = `${MIRROR_REST}/topics/${encodeURIComponent(topicId)}/messages?limit=${limit}&order=${order}`;
    console.log('[HCSRecognitionService] REST backfill', url);
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`[HCSRecognitionService] REST ${res.status} for ${url}`);
    
    const json = await res.json();
    const msgs = (json?.messages ?? []) as MirrorMsg[];
    
    const decoded = msgs.map(m => decodeRecognition(m)).filter(Boolean) as RecognitionDecoded[];
    console.log('[HCSRecognitionService] Decoded', decoded.length, 'messages from', msgs.length, 'raw messages');
    
    return decoded;
  }

  private subscribe(topicId: string, onDecoded: (d: RecognitionDecoded) => void) {
    const url = `${MIRROR_WS}/api/v1/topics/${encodeURIComponent(topicId)}/messages`;
    console.log('[HCSRecognitionService] WS subscribe', url);
    
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => console.log('[HCSRecognitionService] WS open'));
    ws.addEventListener('error', (e) => console.error('[HCSRecognitionService] WS error', e));
    ws.addEventListener('close', (e) => console.log('[HCSRecognitionService] WS closed', e.code));
    ws.addEventListener('message', (ev) => {
      try {
        const raw = JSON.parse(ev.data);
        // mirror WS payload has 'message' base64; normalize to MirrorMsg shape for reuse
        const msg: MirrorMsg = {
          consensus_timestamp: raw?.consensus_timestamp,
          message: raw?.message,
          sequence_number: raw?.sequence_number,
          topic_id: topicId,
        };
        const d = decodeRecognition(msg);
        if (d) onDecoded(d);
      } catch (e) {
        console.error('[HCSRecognitionService] WS parse error', e, ev.data);
      }
    });
    
    return () => {
      console.log('[HCSRecognitionService] Closing WS');
      ws.close();
    };
  }

  // Debug methods
  getDebugInfo() {
    const recognitionTopic = TOPIC.recognition || '0.0.6895261';
    return {
      initialized: this.initialized,
      definitionsCount: this.defsById.size,
      pendingInstancesCount: this.pending.length,
      definitionIds: Array.from(this.defsById.keys()),
      definitionSlugs: Array.from(this.defsBySlug.keys()),
      pendingInstancesDefIds: this.pending.map(i => 
        i.definitionId || i.definitionSlug
      ).filter(Boolean),
      topics: { recognition: recognitionTopic }
    };
  }
  
  // Clear cache for demo resets
  clearCache(): void {
    this.defsById.clear();
    this.defsBySlug.clear();
    this.pending = [];
    console.log('[HCSRecognitionService] Cache cleared');
  }
}

export const hcsRecognitionService = new HCSRecognitionService();

// Legacy compatibility exports
export type RecognitionDefinition = Def;
export type RecognitionInstance = Inst;

// (Optional) expose for debugging:
if (typeof window !== 'undefined') {
  (window as any).debugRecognition = hcsRecognitionService;
}