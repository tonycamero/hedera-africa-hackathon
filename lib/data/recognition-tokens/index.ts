import pro from './professional.json';
import genz from './genz.json';
import civic from './civic.json';
import { getPersona } from '@/lib/config/persona';
export function getRecognitionTokensForPersona(){
  const p = getPersona().type;
  if(p==='professional') return (pro as any).tokens;
  if(p==='genz') return (genz as any).tokens;
  return (civic as any).tokens;
}
