import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch all password entries (typically just a few)
    const { data: entries, error } = await supabase
      .from("secret_passwords")
      .select("password_hash, content_key");

    if (error || !entries) {
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 }
      );
    }

    // Check each hash
    for (const entry of entries) {
      const match = await bcrypt.compare(password, entry.password_hash);
      if (match) {
        return NextResponse.json({ content_key: entry.content_key });
      }
    }

    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
