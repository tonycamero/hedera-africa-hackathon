import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const phasePath = join(process.cwd(), 'config/phases.json');
    
    if (!existsSync(phasePath)) {
      return NextResponse.json({ 
        error: 'Phase configuration not found',
        currentPhase: 'none',
        phases: {}
      }, { status: 404 });
    }
    
    const phaseData = JSON.parse(readFileSync(phasePath, 'utf8'));
    return NextResponse.json(phaseData);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to read phase configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}