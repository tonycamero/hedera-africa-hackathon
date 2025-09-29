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

    // Handle recognition_definition_created messages with nested data
    if (raw.type === 'recognition_definition_created' && raw.data) {
      const defData = raw.data;
      return {
        _kind: 'definition',
        ...base,
        type: 'definition',
        id: defData.id,
        slug: defData.slug,
        name: defData.name,
        description: defData.description,
        icon: defData.icon,
        category: defData.category,
        rarity: defData.rarity,
        // Include any other properties from the data object
        ...defData
      } as RecognitionDefinitionDecoded;
    }

    // Handle recognition_instance_created messages with nested payload
    if (raw.type === 'RECOGNITION_MINT' && raw.payload) {
      const instData = raw.payload;
      return {
        _kind: 'instance',
        ...base,
        type: 'instance',
        definitionId: instData.definitionId,
        definitionSlug: instData.definitionSlug,
        owner: instData.to,
        note: instData.note,
        issuer: instData.mintedBy || instData.from,
        // Include any other properties from the payload object
        ...instData
      } as RecognitionInstanceDecoded;
    }

    // Prefer explicit 'type' if present; otherwise infer
    const explicit = typeof raw.type === 'string' ? raw.type.toLowerCase() : undefined;
    
    // Check for schema-based detection
    const schema = typeof raw.schema === 'string' ? raw.schema.toLowerCase() : '';
    const schemaKind = schema.includes('def@') || schema.includes('definition') ? 'definition'
                     : schema.includes('instance@') || schema.includes('instance') ? 'instance'
                     : undefined;
    
    // Infer from structure: definitions have name/slug but no owner, instances have owner
    const structureInferred =
      ('name' in raw || 'slug' in raw || (raw.data && ('name' in raw.data || 'slug' in raw.data))) && !('owner' in raw) && !(raw.payload && 'owner' in raw.payload) ? 'definition' : 'instance';

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
