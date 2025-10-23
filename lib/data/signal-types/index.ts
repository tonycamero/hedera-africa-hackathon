import p from './professional.json';
import g from './genz.json';
import c from './civic.json';
import { getPersona } from '@/lib/config/persona';
export function getSignalTypesForPersona(){
  const t = getPersona().type;
  if(t==='professional') return (p as any).signals;
  if(t==='genz') return (g as any).signals;
  return (c as any).signals;
}
