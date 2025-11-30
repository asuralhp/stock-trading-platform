import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import GitHubProvider from "next-auth/providers/github";


export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,   // Reference the environment variable
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // 
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Here you can check the provider and add custom logic
      // For example, you can log the account information
      console.log('User:', user);
      console.log('Account:', account);
      console.log('Profile:', profile);
      
      return user; // Return true to allow sign in
    },
    async redirect({ url, baseUrl }) {
      
      return baseUrl ; // Redirect to a custom URL after sign in
    },
    async session({ session, user, token }) {
      // Attach additional information to the session object
      session.user.provider = token.provider; // Add provider info
      session.user.userId = token.userId; // Add user ID from the account
      session.user.userUid = `${token.provider}_${token.userId}`; // Add user ID from the account
      session.user.sub = token.sub;
      return session;
    },
    async jwt({token, user, account}) {
      // Store provider and account ID in the token
      if (account) {
        token.provider = account.provider;
        token.userId = account.providerAccountId;
      }
      return token;
    }
  }
})
