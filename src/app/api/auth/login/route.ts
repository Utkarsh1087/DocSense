import { NextResponse } from "next/server";
import { findUserByEmail, hashPassword } from "../../../../lib/userHelpers";
import { signToken } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Generate JWT token for stateless auth
    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      plan: user.plan,
    });

    const res = NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      token, // Client stores this for API Authorization headers
    });

    // Set lightweight auth cookie for middleware route protection
    res.cookies.set("docsense_auth", "1", {
      httpOnly: false, // Must be readable by JS to allow logout clearing
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Set JWT session cookie (httpOnly for security)
    res.cookies.set("docsense_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Failed to log in." }, { status: 500 });
  }
}
