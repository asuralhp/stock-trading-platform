import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('User:', user);
      console.log('Account:', account);
      console.log('Profile:', profile);
      return true;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).provider = (token as any).provider;
        (session.user as any).userId = (token as any).userId;
        (session.user as any).userUid = `${(token as any).provider}_${(token as any).userId}`;
        (session.user as any).sub = (token as any).sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        (token as any).provider = account.provider;
        (token as any).userId = account.providerAccountId;
      }
      return token;
    },
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions as any)
