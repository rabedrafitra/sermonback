import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import jwt from "jsonwebtoken";

// Pas besoin de : import fetch from "node-fetch";

// =======================
// ✅ CORS UTILITAIRE
// =======================
function withCORS(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCORS(NextResponse.json({ ok: true }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return withCORS(
        NextResponse.json({ error: "Token Facebook requis" }, { status: 400 })
      );
    }

    // ✅ fetch global côté serveur Next.js
    const fbRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    const fbUser = await fbRes.json();

    if (!fbUser || !fbUser.email) {
      return withCORS(
        NextResponse.json({ error: "Token Facebook invalide" }, { status: 401 })
      );
    }

    let user = await prisma.user.findUnique({ where: { email: fbUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: fbUser.email,
          name: fbUser.name,
          avatar: fbUser.picture?.data?.url || null,
          role: "USER",
          password: null,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return withCORS(
      NextResponse.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
        },
      })
    );
  } catch (err) {
    console.error("FACEBOOK LOGIN ERROR:", err);
    return withCORS(
      NextResponse.json({ error: "Erreur serveur Facebook" }, { status: 500 })
    );
  }
}