import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const adminEmail = process.env.ADMIN_EMAIL?.trim() || "owner@example.com";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "change-me";
const adminName = process.env.ADMIN_NAME?.trim() || "Owner";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "").trim();

        if (email !== adminEmail || password !== adminPassword) {
          return null;
        }

        return {
          id: "owner",
          name: adminName,
          email: adminEmail,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
});
