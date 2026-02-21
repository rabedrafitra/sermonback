// route.ts
import prisma from '../../lib/prisma'
import { NextResponse } from 'next/server'


// Fonction utilitaire pour activer CORS
function withCORS(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*') // autorise toutes les origines
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// GET /api/posts : récupérer tous les posts
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: { author: true, likes: true, comments: true },
      orderBy: { createdAt: 'desc' },
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      type: post.type.toLowerCase(),
      title: post.title,
      author: post.author.name ?? 'Auteur inconnu',
      tag: post.entity,
      time: timeAgo(post.createdAt),
      likes: post.likes.length,
      comments: post.comments.length,
      duration: post.duration ?? undefined,
      thumbnail: post.mediaUrl && post.type !== 'TEXT' ? post.mediaUrl : undefined,
      excerpt: post.type === 'TEXT' ? post.content?.slice(0, 1000) + '...' : undefined,
      avatar: `https://i.pravatar.cc/150?u=${post.author.id}`,
    }))

    return withCORS(NextResponse.json(formattedPosts))
  } catch (err) {
    console.error(err)
    return withCORS(
      NextResponse.json({ error: 'Impossible de récupérer les posts' }, { status: 500 })
    )
  }
}


// POST /api/posts : créer un nouveau post
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const post = await prisma.post.create({ data: body })
    return withCORS(NextResponse.json(post))
  } catch (err) {
    console.error(err)
    return withCORS(NextResponse.json({ error: 'Impossible de créer le post' }, { status: 500 }))
  }
}

// PUT /api/posts/:id : modifier un post
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const updated = await prisma.post.update({
      where: { id: params.id },
      data: body,
    })
    return withCORS(NextResponse.json(updated))
  } catch (err) {
    console.error(err)
    return withCORS(NextResponse.json({ error: 'Impossible de modifier le post' }, { status: 500 }))
  }
}

// DELETE /api/posts/:id : supprimer un post
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.post.delete({ where: { id: params.id } })
    return withCORS(NextResponse.json({ message: 'Post supprimé' }))
  } catch (err) {
    console.error(err)
    return withCORS(NextResponse.json({ error: 'Impossible de supprimer le post' }, { status: 500 }))
  }
}

// OPTIONS : nécessaire pour CORS préflight
export function OPTIONS() {
  const response = NextResponse.json({ ok: true })
  return withCORS(response)
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  const intervals = [
    { label: 'j', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'min', seconds: 60 },
  ]
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) return `il y a ${count}${interval.label}`
  }
  return "à l'instant"
}
