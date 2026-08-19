import { NextResponse } from "next/server";
import { findUserByEmail, createUser, hashPassword } from "../../../../lib/userHelpers";

export async function POST(req: Request) {
  try {
    const { username, email, password, plan = "Starter" } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const newUser = await createUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      plan: plan === "Pro" ? "Pro" : "Starter",
    });

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      plan: newUser.plan,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
  }
}
