import { NextResponse } from "next/server";
import { updateUserPlan } from "../../../../lib/userHelpers";
import { getUserIdFromRequest, getSessionFromRequest } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    const requestingUserId = getUserIdFromRequest(req);

    // Require valid authentication
    if (!session && requestingUserId === "default_user") {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    const { userId, plan } = await req.json();
    if (!userId || !plan) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Security check: Users can only upgrade their own profile
    if (requestingUserId !== userId) {
      return NextResponse.json({ error: "Forbidden. Cannot modify other user accounts." }, { status: 403 });
    }

    await updateUserPlan(userId, plan === "Pro" ? "Pro" : "Starter");
    return NextResponse.json({ success: true, message: `Plan updated to ${plan}` });
  } catch (error: any) {
    console.error("Failed to upgrade user profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

