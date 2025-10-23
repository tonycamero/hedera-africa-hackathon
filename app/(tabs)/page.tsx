'use client';
import { getPersona } from '@/lib/config/persona';
import ProfessionalDashboard from './variants/ProfessionalDashboard';
import GenZDashboard from './variants/GenZDashboard';
import CivicDashboard from './variants/CivicDashboard';
export default function HomePage(){
  const p = getPersona().type;
  if(p==='professional') return <ProfessionalDashboard/>;
  if(p==='genz') return <GenZDashboard/>;
  return <CivicDashboard/>;
}
