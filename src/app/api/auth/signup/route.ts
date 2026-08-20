import { NextResponse } from "next/server";
import { findUserByEmail, createUser, hashPassword } from "../../../../lib/userHelpers";
import { signToken } from "../../../../lib/auth";

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

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      plan: newUser.plan,
    });

    const res = NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      plan: newUser.plan,
      token,
    });

    res.cookies.set("docsense_auth", "1", {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    res.cookies.set("docsense_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
  }
}

