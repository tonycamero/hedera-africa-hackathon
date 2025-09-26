export type MirrorMsg = {
  consensus_timestamp: string;
  message: string;          // base64 JSON
  sequence_number: number;
  topic_id: string;
};

type Base = {
  _hrl: string;             // hcs://<topic>/<seq>
  _ts: string;              // consensus ts
  _seq: number;
  _topic: string;
};

export type RecognitionDefinitionDecoded = Base & {
  _kind: 'definition';
  schema?: string;          // e.g., 'HCS-Recognition-Def@1'
  type?: 'definition'|'instance';
  id?: string;              // canonical id if provided
  slug?: string;            // 'chad', 'delulu', ...
  name?: string;
  description?: string;
  icon?: string;
  // ...any other fields your defs carry
};

export type RecognitionInstanceDecoded = Base & {
  _kind: 'instance';
  schema?: string;          // e.g., 'HCS-Recognition-Instance@1'
  type?: 'definition'|'instance';
  definitionId?: string;
  definitionSlug?: string;
  owner?: string;           // 'tm-alex-chen'
  note?: string;
  issuer?: string;
  // ...any other fields
};

export type RecognitionDecoded = RecognitionDefinitionDecoded | RecognitionInstanceDecoded;

export function decodeRecognition(m: MirrorMsg): RecognitionDecoded | null {
  try {
    const raw = JSON.parse(Buffer.from(m.message, 'base64').toString('utf8'));
    const base: Base = {
      _hrl: `hcs://${m.topic_id}/${m.sequence_number}`,
      _ts: m.consensus_timestamp,
      _seq: m.sequence_number,
      _topic: m.topic_id,
    };

    // Prefer explicit 'type' if present; otherwise infer
    const explicit = typeof raw.type === 'string' ? raw.type.toLowerCase() : undefined;
    
    // Check for schema-based detection
    const schema = typeof raw.schema === 'string' ? raw.schema.toLowerCase() : '';
    const schemaKind = schema.includes('def@') || schema.includes('definition') ? 'definition'
                     : schema.includes('instance@') || schema.includes('instance') ? 'instance'
                     : undefined;
    
    // Infer from structure: definitions have name/slug but no owner, instances have owner
    const structureInferred =
      ('name' in raw || 'slug' in raw) && !('owner' in raw) ? 'definition' : 'instance';

    // Priority: explicit > schema > structure
    const kind = (explicit === 'definition' || explicit === 'instance') ? explicit
               : schemaKind || structureInferred;

    if (kind === 'definition') {
      return { _kind: 'definition', ...base, ...raw } as RecognitionDefinitionDecoded;
    }
    return { _kind: 'instance', ...base, ...raw } as RecognitionInstanceDecoded;
  } catch (e) {
    console.error('[RecognitionDecode] JSON/base64 error', e, m);
    return null;
  }
}