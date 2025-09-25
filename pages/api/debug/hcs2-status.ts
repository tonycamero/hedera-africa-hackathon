import { NextApiRequest, NextApiResponse } from 'next'
import { flexRegistry, hcs2Registry } from '@/lib/services/HCS2RegistryClient'
import { hcsFeedService } from '@/lib/services/HCSFeedService'
import { REGISTRY_KEYS } from '@/lib/services/registryKeys'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[Flex Registry Status] Starting registry status check...')
    
    // Ensure Flex registry
    const registryTopicId = await flexRegistry.ensureRegistry()
    
    // Test individual entry lookups
    const feedEntry = await flexRegistry.getEntry(REGISTRY_KEYS.FEED)
    const contactsEntry = await flexRegistry.getEntry(REGISTRY_KEYS.CONTACTS)
    const trustEntry = await flexRegistry.getEntry(REGISTRY_KEYS.TRUST)
    
    // List all entries
    const allEntries = await flexRegistry.listAll()
    
    // Resolve topics from registry (legacy compatibility)
    const resolvedTopics = await flexRegistry.resolveTopics()
    
    // Get current topics from HCS feed service  
    const feedTopics = hcsFeedService.getTopicIds()
    
    // Initialize feed service to see how it integrates with HCS-2
    await hcsFeedService.initialize()
    const feedTopicsAfterInit = hcsFeedService.getTopicIds()
    
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      flexRegistry: {
        registryId: registryTopicId,
        registryUrl: registryTopicId.startsWith('0.0.') ? `https://hashscan.io/testnet/topic/${registryTopicId}` : 'Fallback mode',
        individualEntries: {
          feed: feedEntry,
          contacts: contactsEntry,
          trust: trustEntry
        },
        allEntries: allEntries.length,
        resolvedTopics
      },
      feedService: {
        topicsBeforeInit: feedTopics,
        topicsAfterInit: feedTopicsAfterInit,
        isReady: hcsFeedService.isReady()
      },
      verifiedTopics: {
        contacts: '0.0.6896005',
        trust: '0.0.6896005', 
        recognition: '0.0.6895261',
        system: '0.0.6896008'
      }
    }
    
    console.log('[Flex Registry Status] Status check complete:', status)
    
    res.status(200).json(status)
    
  } catch (error) {
    console.error('[HCS2 Status] Error:', error)
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}