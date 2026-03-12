import NextAuth, { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

type Role = "user" | "admin";

const mapRole = (prismaRole?: string | null): Role =>
  prismaRole === "ADMIN" ? "admin" : "user";

interface MyJWT extends JWT {
  userId: string;
  role: Role;
}

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
  session: { strategy: "jwt" },
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
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return user;
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
    }),
  ],

  jwt: { secret: process.env.JWT_SECRET },

  callbacks: {
    async jwt({ token, user }) {
      const t = token as MyJWT;
      if (user) {
        t.userId = user.id;
        t.role = mapRole((user as any).role);
      }
      return t;
    },

    async session({ session, token }) {
      const t = token as MyJWT;
      return {
        ...session,
        user: { id: t.userId, role: t.role, name: session.user?.name ?? null, email: session.user?.email ?? null, image: session.user?.image ?? null },
      } as MySession;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("sermonapp://")) return url; // ✅ autoriser deep link mobile
      if (url.startsWith(baseUrl)) return url;       // ✅ autoriser URLs internes NextAuth
      return baseUrl;                                // ❌ bloquer le reste
    },
  },

  pages: { signIn: "/auth/login" },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };