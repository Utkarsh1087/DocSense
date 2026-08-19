import { NextResponse } from "next/server";
import { updateUserPlan } from "../../../../lib/userHelpers";

export async function POST(req: Request) {
  try {
    const { userId, plan } = await req.json();
    if (!userId || !plan) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await updateUserPlan(userId, plan === "Pro" ? "Pro" : "Starter");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to upgrade user profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
