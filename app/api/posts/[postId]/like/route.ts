import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

// Ici on attend userId en body
export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params;
  const { userId } = await req.json();

  if (!postId || !userId) {
    return NextResponse.json({ error: "postId ou userId manquant" }, { status: 400 });
  }

  try {
    // Vérifie si l'utilisateur a déjà liké
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      // Déjà liké → on supprime (toggle)
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      // Sinon, crée un like
      await prisma.like.create({
        data: { userId, postId },
      });
    }

    // Retourne le nombre actuel de likes
    const likeCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ likes: likeCount, liked: !existingLike });
  } catch (error) {
    console.error("Erreur toggleLike:", error);
    return NextResponse.json({ error: "Impossible de liker le post" }, { status: 500 });
  }
}
