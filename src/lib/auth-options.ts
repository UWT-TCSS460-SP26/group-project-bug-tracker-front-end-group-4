import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "auth2",
      name: "Auth²",
      type: "oauth",
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      issuer: "https://tcss-460-iam.onrender.com",
      jwks_endpoint: "https://tcss-460-iam.onrender.com/.well-known/jwks.json",
      authorization: {
        url: "https://tcss-460-iam.onrender.com/v2/oauth/authorize",
        params: { scope: "openid profile email", audience: "group-4-api" },
      },
      token: "https://tcss-460-iam.onrender.com/v2/oauth/token",
      userinfo: "https://tcss-460-iam.onrender.com/v2/oauth/userinfo",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.email,
          email: profile.email,
        };
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
};
