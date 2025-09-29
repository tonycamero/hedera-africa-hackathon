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
    // Decode base64 message
    let decodedString: string;
    try {
      decodedString = Buffer.from(m.message, 'base64').toString('utf8');
    } catch (e) {
      console.error('[RecognitionDecode] Base64 decode error', e, m);
      return null;
    }
    
    // Handle potentially truncated JSON messages
    let raw: any;
    try {
      raw = JSON.parse(decodedString);
    } catch (parseError) {
      // Try to repair truncated JSON by finding the last complete object
      if (parseError instanceof SyntaxError && parseError.message.includes('Unterminated string')) {
        try {
          // Find the last complete JSON object by looking for closing braces
          const lastBraceIndex = decodedString.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            const truncatedJson = decodedString.substring(0, lastBraceIndex + 1);
            raw = JSON.parse(truncatedJson);
            console.warn('[RecognitionDecode] Recovered from truncated JSON', { 
              originalLength: decodedString.length, 
              truncatedLength: truncatedJson.length,
              sequence: m.sequence_number
            });
          } else {
            throw parseError; // Unable to recover
          }
        } catch (recoveryError) {
          console.error('[RecognitionDecode] JSON parse + recovery failed', recoveryError, {
            decodedString: decodedString.substring(0, 100) + '...', // First 100 chars for debugging
            messageLength: decodedString.length,
            sequence: m.sequence_number
          });
          return null;
        }
      } else {
        console.error('[RecognitionDecode] JSON parse error', parseError, {
          decodedString: decodedString.substring(0, 100) + '...', // First 100 chars for debugging
          sequence: m.sequence_number
        });
        return null;
      }
    }
    
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
