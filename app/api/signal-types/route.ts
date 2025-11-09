import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { SignalType } from '@/lib/types/signals-collectible'

export async function GET() {
  try {
    // Read the canonical signal types JSON
    const dataPath = join(process.cwd(), 'data', 'signal-types.genz.json')
    const rawData = readFileSync(dataPath, 'utf8')
    const signalTypesData = JSON.parse(rawData)
    
    // Transform to full SignalType interface
    const signalTypes: SignalType[] = signalTypesData.map((item: any) => {
      const [base_id, versionStr] = item.type_id.split('@')
      return {
        ...item,
        base_id,
        version: parseInt(versionStr, 10),
        example_labels: item.labels, // Map labels to example_labels for UI
        description: `Create collectible ${item.category.toLowerCase()} recognition tokens`,
        created_at: new Date().toISOString() // Mock timestamp
      }
    })

    return NextResponse.json({ 
      types: signalTypes,
      count: signalTypes.length 
    })
  } catch (error) {
    console.error('Failed to load signal types:', error)
    return NextResponse.json(
      { error: 'Failed to load signal types' }, 
      { status: 500 }
    )
  }
}