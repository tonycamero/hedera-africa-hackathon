import { migrateToV1 } from '../Recognition.Migrate';
const genz = { tokenId:'0.0.123', cardSlug:'networking', xp:5, boostKind:'social', boostAmount:1 };
const civic = { action:'EVENT_RSVP', campaignId:'mayor-2025', eventId:'E1', xp:2 };
const pro = { badge:'DELIVERY', note:'Great on-time shipping' };
test('genz → V1', ()=>{ const out=migrateToV1(genz,'genz'); expect((out as any).payload.type).toBe('hashinal'); });
test('civic → V1', ()=>{ const out=migrateToV1(civic,'civic'); expect((out as any).payload.type).toBe('civic'); });
test('pro → V1',   ()=>{ const out=migrateToV1(pro,'professional'); expect((out as any).payload.type).toBe('pro'); });
