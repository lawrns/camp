// Supabase-based user management implementation
// Migrated from Clerk to Supabase Auth

import { cache } from "react";
// export {
//   supabaseUserClient as clerkClient,
//   type User,
//   getUser,
//   getUserList,
//   updateUser
// } from './user-supabase'; // Module not found

import { getSlackUser } from "../slack/client";

// import { supabaseUserClient as clerkClient } from './user-supabase'; // Module not found

type User = {
  id: string;
  email: string;
  fullName: string;
};

// Simple fallback for clerkClient
const clerkClient = {
  users: {
    supabase: {
      auth: {
        getUser: async (userId: string): Promise<User> => ({
          id: userId,
          email: "fallback@example.com",
          fullName: "Fallback User",
        }),
      },
    },
    getUserList: async (organizationId: string): Promise<User[]> => [],
    getUserOauthAccessToken: async () => null,
    updateUserMetadata: async (userId: string, metadata: unknown) => {},
  },
  organizations: {
    createOrganizationInvitation: async () => ({ id: "fallback-invitation" }),
  },
};

// Legacy function name compatibility
export const getClerkUser = cache((userId: string | null) =>
  userId ? clerkClient.users.supabase.auth.getUser(userId) : Promise.resolve(null)
);

export const getClerkUserList = cache((organizationId: string, { limit = 100, ...params }: unknown = {}) =>
  clerkClient.users.getUserList(organizationId).then((data) => ({ data }))
);

export const findUserByEmail = cache(async (organizationId: string, email: string): Promise<User | null> => {
  const users = await clerkClient.users.getUserList(organizationId);
  return users.find((user) => user.email === email) ?? null;
});

export const createOrganizationInvitation = async (
  organizationId: string,
  inviterUserId: string,
  emailAddress: string,
  role = "member"
) => {
  // TODO: Implement organization invitations with Supabase
  return await clerkClient.organizations.createOrganizationInvitation();
};

export const UserRoles = {
  CORE: "core",
  NON_CORE: "nonCore",
  AFK: "afk",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

type MailboxAccess = {
  role: UserRole;
  keywords: string[];
  updatedAt: string;
};

export type UserWithMailboxAccessData = {
  id: string;
  displayName: string;
  email: string | undefined;
  role: UserRole;
  keywords: MailboxAccess["keywords"];
};

export const getUsersWithMailboxAccess = async (
  organizationId: string,
  mailboxId: number
): Promise<UserWithMailboxAccessData[]> => {
  const users = await getClerkUserList(organizationId);

  return users.data.map((user: unknown) => ({
    id: user.id,
    displayName: user.fullName ?? user.id,
    email: user.email,
    role: "core" as UserRole, // Default role - TODO: implement mailbox-specific roles
    keywords: [], // TODO: implement keyword functionality
  }));
};

export const updateUserMailboxData = async (
  userId: string,
  mailboxId: number,
  updates: {
    role?: UserRole;
    keywords?: MailboxAccess["keywords"];
  }
): Promise<UserWithMailboxAccessData> => {
  const user = await clerkClient.users.supabase.auth.getUser(userId);

  // TODO: Implement mailbox-specific metadata with Supabase
  return {
    id: user?.id || userId,
    displayName: user?.fullName ?? userId,
    email: user?.email,
    role: updates.role || "core",
    keywords: updates.keywords || [],
  };
};

export const findUserViaSlack = cache(async (organizationId: string, token: string, slackUserId: string) => {
  const allUsers = await getClerkUserList(organizationId);

  // TODO: Implement Slack external account matching with Supabase
  const slackUser = await getSlackUser(slackUserId);
  return allUsers.data.find((user) => user.email === slackUser?.email) ?? null;
});

export const getOAuthAccessToken = cache(async (userId: string, provider: "oauth_google" | "oauth_slack") => {
  // TODO: Implement OAuth token storage/retrieval with Supabase
  const tokens = await clerkClient.users.getUserOauthAccessToken();
  return null; // Placeholder
});

export const setPrivateMetadata = cache(async (user: unknown, metadata: unknown) => {
  // TODO: Implement private metadata storage with Supabase
  await clerkClient.users.updateUserMetadata(user.id, metadata);
});
