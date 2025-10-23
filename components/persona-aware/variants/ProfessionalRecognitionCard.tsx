'use client';
import { metallicTheme } from '@/lib/themes/metallic';
export default function ProfessionalRecognitionCard({title='Delivery', note}:{title?:string; note?:string}){
  return (
    <div style={{background: metallicTheme.effects.metallic}} className="rounded-xl p-4 border">
      <div className="text-sm opacity-80">Professional Badge</div>
      <div className="text-xl font-bold">{title}</div>
      {note && <div className="mt-2 text-sm">{note}</div>}
    </div>
  );
}
