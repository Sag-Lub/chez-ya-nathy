import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303 : après le POST du formulaire, le navigateur recharge la page de connexion en GET
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 })
}
