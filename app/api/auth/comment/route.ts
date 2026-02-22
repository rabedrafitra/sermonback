import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import prisma from "../../../lib/prisma";
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
  // Récupération de la session côté serveur
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Lecture du corps de la requête
  const { content, postId } = await req.json();

  if (!content || !postId) {
    return NextResponse.json(
      { error: "Content et postId sont requis" },
      { status: 400 }
    );
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: session.user.id, // utilise l'id de la session
      },
    });

    return NextResponse.json(comment);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Impossible de créer le commentaire" }, { status: 500 });
  }
}
