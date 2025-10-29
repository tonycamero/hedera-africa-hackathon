import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

/**
 * GET /api/registry/catalog?edition=base|genz|african
 * 
 * Returns the recognition catalog for the specified edition
 * Base catalog includes economics (trustValue, rarity)
 * Overlay catalogs only include cultural translations (name, description, icon, tags)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const edition = (searchParams.get('edition') || 'base') as 'base' | 'genz' | 'african'

    // Validate edition
    if (!['base', 'genz', 'african'].includes(edition)) {
      return NextResponse.json(
        { error: 'Invalid edition. Must be: base, genz, or african' },
        { status: 400 }
      )
    }

    // Determine file path
    const fileName = edition === 'base' 
      ? 'catalog.v2-base.json'
      : `catalog.v2-${edition}.overlay.json`

    const filePath = path.join(process.cwd(), 'scripts', 'out', fileName)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Catalog not found: ${edition}` },
        { status: 404 }
      )
    }

    // Read and parse catalog
    const catalogJson = fs.readFileSync(filePath, 'utf8')
    const catalog = JSON.parse(catalogJson)

    // Return catalog with cache headers
    return NextResponse.json(catalog, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'CDN-Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    console.error('[API /registry/catalog] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load catalog' },
      { status: 500 }
    )
  }
}
