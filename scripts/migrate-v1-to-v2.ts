#!/usr/bin/env tsx

/**
 * TrustMesh v1 → v2 Migration Tool
 * 
 * Converts legacy recognition data and spaces to v2 schema format
 * Supports dry-run mode to preview changes without applying them
 * 
 * Usage:
 *   npm run migrate:v2 -- --dry-run
 *   npm run migrate:v2 -- --apply --source ./legacy-data.json
 *   npm run migrate:v2 -- --apply --db
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import crypto from 'crypto';

// Migration run ID (stable across all records in this run)
const MIGRATION_RUN_ID = `migration-${new Date().toISOString()}`;

// Cryptographic utilities
function sha256hex(s: string) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function v2IdFromLegacy(legacyId: string) {
  const mac = crypto.createHmac('sha256', 'tm-v2-migration').update(legacyId).digest('hex').slice(0, 24);
  return `tm-v2-${mac}`;
}

function proofHashLegacy(legacy: LegacyRecognition) {
  return sha256hex(`${legacy.id}|${legacy.timestamp}`);
}

function mockSignature(legacy: LegacyRecognition) {
  return `migrated:${sha256hex(`${legacy.from}|${legacy.to}|${legacy.amount}|${legacy.timestamp}`)}`;
}

function toMinorUnitsFromV1(amountNumber: number, decimals = 18): string {
  if (!Number.isFinite(amountNumber)) throw new Error('Invalid legacy amount');
  // Convert to string, split, and scale to decimals safely
  const [int = '0', frac = ''] = String(amountNumber).split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const asBig = BigInt(int + fracPadded);
  return asBig.toString();
}

// Import v2 schemas
import { RecognitionSchema, Recognition } from '../lib/v2/schema/tm.recognition@1';
import { SpaceSchema, Space } from '../lib/v2/schema/tm.space@1';

// Legacy v1 schemas (simplified, strict validation)
const LegacyRecognitionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(), 
  amount: z.number(), // v1 used numbers
  message: z.string().optional(),
  timestamp: z.string(),
  type: z.enum(['peer', 'performance', 'social', 'innovation']).optional(),
  metadata: z.record(z.any()).optional()
}).strict();

const LegacySpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  owner: z.string(),
  members: z.array(z.string()).optional(),
  settings: z.record(z.any()).optional(),
  created: z.string(),
  updated: z.string().optional()
}).strict();

type LegacyRecognition = z.infer<typeof LegacyRecognitionSchema>;
type LegacySpace = z.infer<typeof LegacySpaceSchema>;

// Migration configuration
interface MigrationConfig {
  mode: 'dry-run' | 'apply';
  source: 'file' | 'db';
  sourceFile?: string;
  outputFile?: string;
  defaultSpaceId: string;
  defaultHcsTopicId: string;
}

// Migration result tracking
interface MigrationResult {
  recognitions: {
    processed: number;
    converted: number;
    failed: number;
    errors: Array<{ id: string; error: string; record: any }>;
  };
  spaces: {
    processed: number;
    converted: number;
    failed: number;
    errors: Array<{ id: string; error: string; record: any }>;
  };
  summary: {
    totalProcessed: number;
    totalConverted: number;
    totalFailed: number;
    duration: number;
  };
}

class MigrationTool {
  private config: MigrationConfig;
  private result: MigrationResult;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.result = {
      recognitions: { processed: 0, converted: 0, failed: 0, errors: [] },
      spaces: { processed: 0, converted: 0, failed: 0, errors: [] },
      summary: { totalProcessed: 0, totalConverted: 0, totalFailed: 0, duration: 0 }
    };
  }

  /**
   * Main migration entry point
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    
    console.log(`🚀 Starting TrustMesh v1→v2 Migration (${this.config.mode})`);
    console.log(`Source: ${this.config.source === 'file' ? this.config.sourceFile : 'database'}`);
    console.log(`Migration Run ID: ${MIGRATION_RUN_ID}`);
    
    try {
      // Load legacy data
      const legacyData = await this.loadLegacyData();
      
      // Migrate recognitions
      if (legacyData.recognitions?.length > 0) {
        console.log(`\n📝 Processing ${legacyData.recognitions.length} recognitions...`);
        await this.migrateRecognitions(legacyData.recognitions);
      }

      // Migrate spaces
      if (legacyData.spaces?.length > 0) {
        console.log(`\n🏠 Processing ${legacyData.spaces.length} spaces...`);
        await this.migrateSpaces(legacyData.spaces);
      }

      // Calculate summary
      this.result.summary = {
        totalProcessed: this.result.recognitions.processed + this.result.spaces.processed,
        totalConverted: this.result.recognitions.converted + this.result.spaces.converted,
        totalFailed: this.result.recognitions.failed + this.result.spaces.failed,
        duration: Date.now() - startTime
      };

      this.printSummary();
      
      return this.result;
      
    } catch (error: any) {
      console.error(`❌ Migration failed:`, error.message);
      throw error;
    }
  }

  /**
   * Load legacy data from file or database
   */
  private async loadLegacyData(): Promise<{ recognitions?: LegacyRecognition[], spaces?: LegacySpace[] }> {
    if (this.config.source === 'file') {
      if (!this.config.sourceFile || !existsSync(this.config.sourceFile)) {
        throw new Error(`Source file not found: ${this.config.sourceFile}`);
      }
      
      const rawData = readFileSync(this.config.sourceFile, 'utf-8');
      const data = JSON.parse(rawData);
      
      return {
        recognitions: data.recognitions || [],
        spaces: data.spaces || []
      };
    } else {
      // TODO: Implement database loading
      console.warn('⚠️  Database source not yet implemented, using mock data');
      return {
        recognitions: this.getMockLegacyRecognitions(),
        spaces: this.getMockLegacySpaces()
      };
    }
  }

  /**
   * Migrate legacy recognitions to v2 format
   */
  private async migrateRecognitions(legacyRecognitions: LegacyRecognition[]): Promise<void> {
    const convertedRecognitions: Recognition[] = [];

    for (const legacy of legacyRecognitions) {
      this.result.recognitions.processed++;
      
      try {
        // Validate legacy format
        const validated = LegacyRecognitionSchema.parse(legacy);
        
        // Convert to v2 format
        const v2Recognition: Recognition = {
          id: v2IdFromLegacy(validated.id),
          version: '1.0.0',
          timestamp: new Date(validated.timestamp || Date.now()).toISOString(),
          spaceId: validated.metadata?.spaceId ?? this.config.defaultSpaceId,
          senderId: validated.from,
          recipientId: validated.to,
          lens: this.mapLensType(validated.type),
          amount: toMinorUnitsFromV1(validated.amount, 18),
          message: validated.message || '',
          metadata: {
            ...validated.metadata,
            migratedFrom: 'v1',
            migrationId: MIGRATION_RUN_ID,
            originalId: validated.id,
            legacyType: validated.type || 'peer'
          },
          signature: mockSignature(validated),
          proofHash: proofHashLegacy(validated)
        };

        // Validate v2 format
        RecognitionSchema.parse(v2Recognition);
        
        convertedRecognitions.push(v2Recognition);
        this.result.recognitions.converted++;
        
        if (this.config.mode === 'dry-run') {
          const diffHash = sha256hex(JSON.stringify(v2Recognition)).slice(0,8);
          console.log(`✅ [DRY-RUN] ${validated.id} → ${v2Recognition.id}  (${diffHash})`);
        }
        
      } catch (error: any) {
        const msg = error?.issues ? error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ') : (error.message || 'Unknown error');
        this.result.recognitions.failed++;
        this.result.recognitions.errors.push({
          id: legacy.id || 'unknown',
          error: msg,
          record: legacy
        });
        
        console.error(`❌ Failed to convert recognition ${legacy.id}:`, msg);
      }
    }

    // Apply conversions if not dry-run
    if (this.config.mode === 'apply' && convertedRecognitions.length > 0) {
      await this.saveConvertedRecognitions(convertedRecognitions);
      console.log(`✅ Saved ${convertedRecognitions.length} converted recognitions`);
    }
  }

  /**
   * Migrate legacy spaces to v2 format  
   */
  private async migrateSpaces(legacySpaces: LegacySpace[]): Promise<void> {
    const convertedSpaces: Space[] = [];

    for (const legacy of legacySpaces) {
      this.result.spaces.processed++;
      
      try {
        // Validate legacy format
        const validated = LegacySpaceSchema.parse(legacy);
        
        // Convert to v2 format
        const v2Space: Space = {
          id: v2IdFromLegacy(validated.id),
          version: '1.0.0',
          name: validated.name,
          description: validated.description || '',
          spaceType: 'community', // Default type
          visibility: 'public',
          createdAt: new Date(validated.created).toISOString(),
          updatedAt: validated.updated ? new Date(validated.updated).toISOString() : new Date().toISOString(),
          
          // Governance
          governance: {
            adminIds: [validated.owner],
            memberIds: validated.members || [],
            policies: {
              allowedLenses: ['genz', 'professional', 'social', 'builder'],
              requireApproval: false,
              moderationEnabled: false
            }
          },

          // Treasury configuration
          treasuryConfig: {
            network: 'hedera',
            trstTokenId: '0.0.TRST',
            tokenSymbol: 'TRST',
            tokenDecimals: 18,
            limits: {
              maxMintPerDay: '10000',
              maxTransferPerTx: '1000',
              emergencyPauseEnabled: true
            }
          },

          // HCS integration
          hcsTopicId: validated.settings?.hcsTopicId ?? this.config.defaultHcsTopicId,
          
          metadata: {
            ...validated.settings,
            migratedFrom: 'v1',
            migrationId: MIGRATION_RUN_ID,
            originalId: validated.id,
            legacyOwner: validated.owner
          }
        };

        // Validate v2 format
        SpaceSchema.parse(v2Space);
        
        convertedSpaces.push(v2Space);
        this.result.spaces.converted++;
        
        if (this.config.mode === 'dry-run') {
          const diffHash = sha256hex(JSON.stringify(v2Space)).slice(0,8);
          console.log(`✅ [DRY-RUN] ${validated.id} → ${v2Space.id}  (${diffHash})`);
        }
        
      } catch (error: any) {
        const msg = error?.issues ? error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ') : (error.message || 'Unknown error');
        this.result.spaces.failed++;
        this.result.spaces.errors.push({
          id: legacy.id || 'unknown',
          error: msg,
          record: legacy
        });
        
        console.error(`❌ Failed to convert space ${legacy.id}:`, msg);
      }
    }

    // Apply conversions if not dry-run
    if (this.config.mode === 'apply' && convertedSpaces.length > 0) {
      await this.saveConvertedSpaces(convertedSpaces);
      console.log(`✅ Saved ${convertedSpaces.length} converted spaces`);
    }
  }

  /**
   * Map legacy recognition types to v2 lens types
   */
  private mapLensType(legacyType?: string): 'genz' | 'professional' | 'social' | 'builder' {
    switch (legacyType) {
      case 'performance': return 'professional';
      case 'innovation': return 'builder';
      case 'social': return 'social';
      case 'peer':
      default: return 'genz';
    }
  }

  /**
   * Save converted recognitions
   */
  private async saveConvertedRecognitions(recognitions: Recognition[]): Promise<void> {
    const outputFile = this.config.outputFile || './migrated-recognitions-v2.json';
    if (!this.config.outputFile && existsSync(outputFile)) {
      console.warn(`ℹ️  Output ${outputFile} exists; overwriting (no --output provided).`);
    }
    writeFileSync(outputFile, JSON.stringify(recognitions, null, 2));
    console.log(`💾 Saved recognitions to: ${outputFile}`);
  }

  /**
   * Save converted spaces
   */
  private async saveConvertedSpaces(spaces: Space[]): Promise<void> {
    const base = this.config.outputFile?.replace(/\.json$/,'') || './migrated-spaces-v2';
    const outputFile = `${base}.json`;
    if (!this.config.outputFile && existsSync(outputFile)) {
      console.warn(`ℹ️  Output ${outputFile} exists; overwriting (no --output provided).`);
    }
    writeFileSync(outputFile, JSON.stringify(spaces, null, 2));
    console.log(`💾 Saved spaces to: ${outputFile}`);
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('\n📊 Migration Summary:');
    console.log('═'.repeat(50));
    
    // Recognitions
    console.log(`📝 Recognitions:`);
    console.log(`   Processed: ${this.result.recognitions.processed}`);
    console.log(`   Converted: ${this.result.recognitions.converted}`);
    console.log(`   Failed: ${this.result.recognitions.failed}`);
    
    // Spaces  
    console.log(`🏠 Spaces:`);
    console.log(`   Processed: ${this.result.spaces.processed}`);
    console.log(`   Converted: ${this.result.spaces.converted}`);
    console.log(`   Failed: ${this.result.spaces.failed}`);
    
    // Overall
    console.log(`📊 Overall:`);
    console.log(`   Total Processed: ${this.result.summary.totalProcessed}`);
    console.log(`   Total Converted: ${this.result.summary.totalConverted}`);
    console.log(`   Total Failed: ${this.result.summary.totalFailed}`);
    console.log(`   Duration: ${this.result.summary.duration}ms`);
    
    // Error details
    if (this.result.recognitions.errors.length > 0 || this.result.spaces.errors.length > 0) {
      console.log('\n❌ Errors:');
      [...this.result.recognitions.errors, ...this.result.spaces.errors].forEach(error => {
        console.log(`   ${error.id}: ${error.error}`);
      });
    }

    console.log('═'.repeat(50));
    
    if (this.config.mode === 'dry-run') {
      console.log('ℹ️  This was a dry-run. Use --apply to execute the migration.');
    } else {
      console.log('✅ Migration completed successfully!');
    }
  }

  /**
   * Mock legacy data for testing
   */
  private getMockLegacyRecognitions(): LegacyRecognition[] {
    return [
      {
        id: 'legacy-rec-1',
        from: 'user-alice',
        to: 'user-bob',
        amount: 50,
        message: 'Great job on the project!',
        timestamp: '2024-01-15T10:30:00Z',
        type: 'performance',
        metadata: { project: 'hackathon-2024' }
      },
      {
        id: 'legacy-rec-2', 
        from: 'user-charlie',
        to: 'user-diana',
        amount: 25,
        message: 'Thanks for the help!',
        timestamp: '2024-01-16T14:45:00Z',
        type: 'peer'
      },
      {
        id: 'legacy-rec-3',
        from: 'user-eve',
        to: 'user-frank',
        amount: 100,
        message: 'Amazing innovation!',
        timestamp: '2024-01-17T09:15:00Z',
        type: 'innovation',
        metadata: { category: 'blockchain' }
      }
    ];
  }

  private getMockLegacySpaces(): LegacySpace[] {
    return [
      {
        id: 'legacy-space-1',
        name: 'Hackathon Team',
        description: 'Our awesome hackathon team space',
        owner: 'user-alice',
        members: ['user-bob', 'user-charlie'],
        created: '2024-01-01T00:00:00Z',
        settings: { theme: 'dark', notifications: true }
      },
      {
        id: 'legacy-space-2',
        name: 'Innovation Lab',
        description: 'Space for innovation and research',
        owner: 'user-diana',
        members: ['user-eve', 'user-frank'],
        created: '2024-01-10T12:00:00Z',
        updated: '2024-01-15T18:30:00Z'
      }
    ];
  }
}

/**
 * CLI argument parsing
 */
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  
  const config: MigrationConfig = {
    mode: args.includes('--apply') ? 'apply' : 'dry-run',
    source: args.includes('--db') ? 'db' : 'file',
    defaultSpaceId: 'tm-v2-default-space',
    defaultHcsTopicId: '0.0.123456'
  };

  // Parse source file
  const sourceIndex = args.indexOf('--source');
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    config.sourceFile = args[sourceIndex + 1];
  } else if (config.source === 'file') {
    config.sourceFile = './legacy-data.json';
  }

  // Parse output file
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    config.outputFile = args[outputIndex + 1];
  }

  return config;
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs();
    
    // Validate apply mode requirements
    if (config.mode === 'apply' && config.source === 'file' && !existsSync(config.sourceFile!)) {
      throw new Error(`--apply requires a valid --source file. Missing: ${config.sourceFile}`);
    }
    
    const migrationTool = new MigrationTool(config);
    const result = await migrationTool.migrate();
    
    // Exit with non-zero code if there were failures in apply mode
    if (config.mode === 'apply' && (result.recognitions.failed > 0 || result.spaces.failed > 0)) {
      process.exitCode = 2; // signal partial failure
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { MigrationTool, MigrationConfig, MigrationResult };