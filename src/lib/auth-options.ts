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
      if (account) {
        // Store tokens on initial sign-in
        if (account.access_token) {
          token.accessToken = account.access_token;
        }
        if (account.id_token) {
          token.idToken = account.id_token;
        }
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
        if (account.expires_at) {
          token.expiresAt = account.expires_at;
        }
      }

      // If token hasn't expired, return as-is
      if (token.expiresAt && Date.now() / 1000 < token.expiresAt) {
        return token;
      }

      // Token is expired — try to refresh
      if (token.refreshToken) {
        try {
          const res = await fetch(
            "https://tcss-460-iam.onrender.com/v2/oauth/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
                client_id: process.env.OAUTH_CLIENT_ID!,
                client_secret: process.env.OAUTH_CLIENT_SECRET!,
              }),
            }
          );
          if (res.ok) {
            const tokens = await res.json();
            token.accessToken = tokens.access_token;
            if (tokens.id_token) token.idToken = tokens.id_token;
            if (tokens.refresh_token) token.refreshToken = tokens.refresh_token;
            if (tokens.expires_in) {
              token.expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
            }
          }
        } catch {
          // Refresh failed — session will be missing tokens
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token.idToken) {
        session.idToken = token.idToken;
      }
      return session;
    },
  },
};
