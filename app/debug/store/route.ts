import { NextRequest, NextResponse } from 'next/server'
import { signalsStore } from '@/lib/stores/signalsStore'
import { getSessionId } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId()
    const allSignals = signalsStore.getAllSignals()
    const contacts = signalsStore.deriveContacts(sessionId)
    const bondedContacts = signalsStore.getBondedContacts(sessionId)
    
    // Filter signals relevant to current session
    const mySignals = allSignals.filter(s => 
      s.actors?.from === sessionId || s.actors?.to === sessionId
    )
    
    // Group by signal class
    const signalsByClass = allSignals.reduce((acc, signal) => {
      acc[signal.class] = (acc[signal.class] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Sample signals for debugging
    const sampleSignals = allSignals.slice(0, 5).map(s => ({
      id: s.id,
      type: s.type,
      class: s.class,
      actors: s.actors,
      ts: new Date(s.ts).toISOString(),
      status: s.status,
      direction: s.direction
    }))
    
    return NextResponse.json({
      success: true,
      sessionId,
      store: {
        totalSignals: allSignals.length,
        mySignals: mySignals.length,
        signalsByClass,
        sampleSignals,
      },
      contacts: {
        derived: contacts.length,
        bonded: bondedContacts.length,
        contactList: contacts.map(c => ({
          peerId: c.peerId,
          handle: c.handle,
          bonded: c.bonded,
          trustLevel: c.trustLevel
        }))
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}