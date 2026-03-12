import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

export async function GET(req: Request) {
  try {
    const email = new URL(req.url).searchParams.get("email");

    if (!email) {
      return withCORS(
        NextResponse.json({ error: "Email manquant" }, { status: 400 })
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return withCORS(
        NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
      );
    }

    // 🔐 JWT IDENTIQUE à ton login actuel
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.redirect(
      `myapp://auth?token=${token}`
    );
  } catch (e) {
    console.error(e);
    return withCORS(
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}