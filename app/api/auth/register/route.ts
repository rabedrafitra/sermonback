import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body: {
      name: string;
      email: string;
      password: string;
    } = await req.json();

    const { name, email, password } = body;

    // 🔹 Vérification des champs obligatoires
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // 🔹 Vérification si l'email existe déjà
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Email déjà utilisé" },
        { status: 400 }
      );
    }

    // 🔹 Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Création de l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // Assure-toi que ça correspond à ton enum Role
      },
    });

    return NextResponse.json({ message: "Utilisateur créé", userId: user.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
