'use client';
import Link from 'next/link';
import { getPersona } from '@/lib/config/persona';
export default function PersonaNav(){
  const p = getPersona().type;
  const common = [{href:'/', label:'Home'}];
  const pro = [{href:'/contacts', label:'Contacts'}];
  const genz = [{href:'/signals', label:'Signals'},{href:'/wallet', label:'Wallet'}];
  const civic = [{href:'/support', label:'Supporters'},{href:'/volunteer', label:'Volunteers'},{href:'/events', label:'Events'}];
  const links = p==='professional' ? [...common, ...pro] : p==='genz' ? [...common, ...genz] : [...common, ...civic];
  return <nav className="flex gap-4">{links.map(l=> <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>;
}
