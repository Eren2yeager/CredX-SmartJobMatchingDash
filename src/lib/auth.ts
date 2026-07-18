import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import User from "@/modules/user/user.model";

// Augment next-auth types so route handlers can read our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isRecruiter: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isRecruiter?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      // No email → deny
      if (!user.email) return false;

      try {
        await connectDB();
        await User.findOneAndUpdate(
          { googleId: account!.providerAccountId },
          {
            $setOnInsert: {
              googleId:    account!.providerAccountId,
              email:       user.email,
              name:        user.name  ?? undefined,
              image:       user.image ?? undefined,
              isRecruiter: false,
            },
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        return true;
      } catch {
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // On first sign-in, user & account are present — fetch our DB doc for id/isRecruiter
      if (account && user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ googleId: account.providerAccountId }).lean();
          if (dbUser) {
            token.id          = (dbUser._id as { toString(): string }).toString();
            token.isRecruiter = dbUser.isRecruiter;
          }
        } catch {
          // non-fatal: leave id/isRecruiter undefined on token
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id:          token.id       ?? "",
        email:       token.email    ?? "",
        name:        token.name     ?? null,
        image:       token.picture  ?? null,
        isRecruiter: token.isRecruiter ?? false,
      };
      return session;
    },
  },
};

// Convenience wrapper — call `auth()` in route handlers instead of the full form
export function auth() {
  return getServerSession(authOptions);
}
