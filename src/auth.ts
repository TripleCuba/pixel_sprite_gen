import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/allowed-emails";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email);
    },
  },
  pages: {
    error: "/",
  },
});
