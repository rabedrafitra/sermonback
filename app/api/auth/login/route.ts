import { NextResponse } from 'next/server'
import prisma from "../../../lib/prisma";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// =======================
// ✅ CORS UTILITAIRE
// =======================
function withCORS(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )
  return response
}

// =======================
// ✅ OPTIONS (PRE-FLIGHT)
// =======================
export function OPTIONS() {
  return withCORS(NextResponse.json({ ok: true }))
}

// =======================
// ✅ LOGIN
// =======================
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return withCORS(
        NextResponse.json(
          { error: 'Email et mot de passe requis' },
          { status: 400 }
        )
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return withCORS(
        NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        )
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return withCORS(
        NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        )
      )
    }

    // =======================
    // ✅ JWT STRING VALIDE
    // =======================
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    // =======================
    // ✅ RÉPONSE JSON PROPRE
    // =======================
    return withCORS(
      NextResponse.json({
        token, // 👈 OBLIGATOIRE
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    )
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return withCORS(
      NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    )
  }
}