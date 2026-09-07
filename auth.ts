import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        // Strictly enforce configured credentials with no fallbacks
        if (!adminUser || !adminPass) {
          return null;
        }

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return {
            id: "admin-1",
            name: adminUser,
            email: `${adminUser}@nestpick.local`,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
