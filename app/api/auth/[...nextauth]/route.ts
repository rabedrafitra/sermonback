import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

// OPTIONS CORS
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

// 🔹 TypeScript Role
type Role = "user" | "admin";

// 🔹 Mapper le rôle Prisma vers notre type Role TS
const mapRole = (prismaRole: string | null | undefined): Role => {
  if (prismaRole === "ADMIN") return "admin";
  return "user"; // default
};

// 🔹 JWT personnalisé
interface MyJWT extends JWT {
  userId: string;
  role: Role;
}

// 🔹 Session personnalisé
interface MySession extends Omit<Session, "user"> {
  user: {
    id: string;
    role: Role;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return user;
      },
    }),
  ],

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  callbacks: {
    // 🔹 Ajouter userId et role dans le token JWT
    async jwt({ token, user }) {
      const t = token as MyJWT;
      if (user) {
        t.userId = user.id;
        t.role = mapRole((user as any).role); // map rôle Prisma vers Role TS
      }
      return t;
    },

    // 🔹 Fournir userId et role au front via session
    async session({ session, token }) {
      const t = token as MyJWT;

      // Créer une session complète et safe
      const mySession: MySession = {
        ...session,
        user: {
          id: t.userId,
          role: t.role,
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: session.user?.image ?? null,
        },
      };

      return mySession;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };