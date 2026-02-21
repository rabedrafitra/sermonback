import { NextResponse } from 'next/server'
import prisma from "../../../lib/prisma";
import jwt from 'jsonwebtoken'

function withCORS(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export function OPTIONS() {
  return withCORS(NextResponse.json({ ok: true }))
}

function getUserId(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (!auth) return null

  try {
    const token = auth.replace('Bearer ', '')
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    return payload.userId
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const userId = getUserId(req)
  if (!userId) {
    return withCORS(
      NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true, // ✅ avatar
      role: true,
    },
  })

  return withCORS(NextResponse.json(user))
}