import { NextRequest, NextResponse } from "next/server"
import { publishCatalog, expectAdmin } from "@/lib/services/catalogSeed"
import fs from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    expectAdmin(req as any)
    const url = new URL(req.url)
    const edition = (url.searchParams.get("edition") ?? "base") as "base"|"genz"|"african"
    const fromDisk = url.searchParams.get("fromDisk") === "true"

    let payload
    if (fromDisk) {
      const file = edition === "base"
        ? "catalog.v2-base.json"
        : edition === "genz"
          ? "catalog.v2-genz.overlay.json"
          : "catalog.v2-african.overlay.json"
      payload = JSON.parse(fs.readFileSync(path.join(process.cwd(),"scripts","out",file), "utf8"))
    } else {
      payload = await req.json()
    }

    // Edition validation
    if (payload.edition !== edition) {
      return NextResponse.json({ 
        ok: false, 
        error: "edition_mismatch",
        expected: edition,
        received: payload.edition 
      }, { status: 400 })
    }

    // Economics validation happens in publishCatalog

    const result = await publishCatalog(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    const status = e?.status || 500
    return NextResponse.json({ 
      ok: false, 
      error: e?.message || "seed_failed",
      stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status })
  }
}
