import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const { email, password } = credentials;

        return {
          id: email,
          email: email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (token?.user) {
        session.user = token.user;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
        };
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/dashboard",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
