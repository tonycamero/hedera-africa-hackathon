// app/api/recognition/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { directHCSRecognitionService } from '@/lib/services/DirectHCSRecognitionService';
import { hcsRecognitionService } from '@/lib/services/HCSRecognitionService';

// Select service based on environment flag (defaulting to DirectHCS for better performance)
function getRecognitionService() {
  const useDirectService = process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false'; // Default to true
  console.log('[Recognition API] Using', useDirectService ? 'DirectHCS' : 'Legacy', 'recognition service');
  return useDirectService ? directHCSRecognitionService : hcsRecognitionService;
}

export async function GET(request: NextRequest) {
  try {
    const recognitionService = getRecognitionService();
    console.log('[Recognition API] Initializing recognition service...');
    
    // Initialize the service
    await recognitionService.initialize();
    
    // Get all definitions
    const definitions = recognitionService.getAllDefinitions ? 
      recognitionService.getAllDefinitions() : 
      recognitionService.getDefinitions();
    
    console.log(`[Recognition API] Retrieved ${definitions.length} recognition definitions from HCS`);
    
    return NextResponse.json({
      success: true,
      data: definitions,
      count: definitions.length,
      source: recognitionService === directHCSRecognitionService ? 'DirectHCS' : 'Legacy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Recognition API] Failed to fetch recognition data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recognition definitions',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}