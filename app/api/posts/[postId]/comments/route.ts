import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/* ========= CORS UTIL ========= */
function withCORS(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

/* ========= OPTIONS (preflight) ========= */
export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 204 }));
}

/* ========= GET /comments ========= */
export async function GET(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { postId } = resolvedParams;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return withCORS(NextResponse.json(comments));
  } catch (err) {
    console.error(err);
    return withCORS(
      NextResponse.json(
        { error: "Impossible de charger les commentaires" },
        { status: 500 }
      )
    );
  }
}

/* ========= POST /comments ========= */
export async function POST(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { postId } = resolvedParams;

    // 🔐 Vérification Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return withCORS(
        NextResponse.json({ error: "Non autorisé" }, { status: 401 })
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return withCORS(
        NextResponse.json({ error: "Token invalide" }, { status: 401 })
      );
    }

    // ⚠️ Vérifier que le JWT contient bien userId
    if (!payload.userId) {
      return withCORS(
        NextResponse.json({ error: "Payload JWT invalide : userId manquant" }, { status: 400 })
      );
    }

    const { content } = await req.json();
    if (!content || content.trim() === "") {
      return withCORS(
        NextResponse.json({ error: "Commentaire vide" }, { status: 400 })
      );
    }

    // ✅ Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      return withCORS(
        NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
      );
    }

    // ✅ Créer le commentaire
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        userId: user.id,
      },
      include: { user: { select: { name: true } } },
    });

    return withCORS(NextResponse.json(comment, { status: 201 }));
  } catch (err) {
    console.error(err);
    return withCORS(
      NextResponse.json(
        { error: "Erreur lors de l'ajout du commentaire" },
        { status: 500 }
      )
    );
  }
}