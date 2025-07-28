import { cache } from "react";
import { addDays } from "date-fns";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizationMembers, organizations, profiles, subscriptions } from "@/db/schema";
import { FREE_TRIAL_PERIOD_DAYS } from "@/lib/auth/account";
import { getUser, type AuthenticatedUser } from "@/lib/core/auth";
import { redis } from "@/lib/redis/client";
import { env } from "@/lib/utils/env-config";

interface Organization {
  id: string;
  name: string;
  slug?: string;
  privateMetadata?: Record<string, any>;
  emailAddresses?: Array<{
    emailAddress: string;
    verification?: {
      status: string;
    };
  }>;
  clerkUserId?: string | undefined;
}

interface OrganizationMembership {
  role: string;
  organization: Organization;
}

export const ADDITIONAL_PAID_ORGANIZATION_IDS = env.ADDITIONAL_PAID_ORGANIZATION_IDS?.split(",") ?? [];

// TODO: Implement these functions properly
export const createDefaultOrganization = async (userId: string): Promise<Organization> => {
  // Stub implementation
  return {
    id: `org_${Date.now()}`,
    name: "Default Organization",
    slug: "default",
    privateMetadata: {},
    clerkUserId: userId,
  };
};

export const getOnboardingStatus = async (organizationId: string): Promise<any> => {
  // Stub implementation
  return {
    isCompleted: false,
    currentStep: "business",
    completionPercentage: 0,
    totalSteps: 6,
    completedSteps: [],
  };
};

export const inviteMember = async (email: string): Promise<any> => {
  // Stub implementation

  return { success: true, email };
};

export const getClerkOrganization = cache(async (organizationId: string): Promise<Organization> => {
  try {
    // Get organization from Supabase
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug || organization.id,
      privateMetadata: organization.privateMetadata || {},
      emailAddresses: organization.email
        ? [
            {
              emailAddress: organization.email,
              verification: { status: "verified" },
            },
          ]
        : [],
      clerkUserId: undefined,
    };
  } catch (error) {
    throw new Error(`Failed to fetch organization: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

export const addMember = async (organizationId: string, userId: string, mailboxId?: number) => {
  try {
    // Note: organizationMembers table requires mailboxId
    // If no mailboxId provided, this will fail - mailbox creation should be handled separately
    if (!mailboxId) {
      throw new Error("MailboxId is required for organization membership");
    }

    // Create organization membership in Supabase
    const memberData = await db
      .insert(organizationMembers)
      .values({
        organizationId,
        userId,
        mailboxId,
        role: "agent",
        status: "active",
      })
      .returning();

    return {
      organizationId,
      userId,
      role: "org:member",
      id: memberData[0]?.id,
    };
  } catch (error) {
    throw new Error(`Failed to add member: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export const setOrganizationPrivateMetadata = async (
  organizationId: string,
  metadata: Record<string, any>
): Promise<Organization> => {
  try {
    // Update organization metadata in Supabase
    const updatedOrg = await db
      .update(organizations)
      .set({
        privateMetadata: metadata,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrg.length) {
      throw new Error("Organization not found");
    }

    const organization = updatedOrg[0];
    if (!organization) {
      throw new Error("Organization not found after update");
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug || organization.id,
      privateMetadata: organization.privateMetadata || {},
      emailAddresses: organization.email
        ? [
            {
              emailAddress: organization.email,
              verification: { status: "verified" },
            },
          ]
        : [],
      clerkUserId: undefined,
    };
  } catch (error) {
    throw new Error(`Failed to update metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export const getOrganizationMembers = cache(
  async (
    organizationId: string,
    limit = 100
  ): Promise<{ data: { role: string; organization: { id: string; name: string } }[] }> => {
    try {
      // Get organization members from Supabase
      const members = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, organizationId),
        limit,
      });

      // Get the organization info
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      return {
        data: members.map((member: any) => ({
          role: member.role,
          organization: {
            id: organizationId,
            name: organization.name,
          },
        })),
      };
    } catch (error) {
      throw new Error(`Failed to fetch members: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

export const getOrganizationAdminUsers = async (
  organizationId: string
): Promise<Array<{ email?: string; emailAddresses?: Array<{ emailAddress: string }> }>> => {
  try {
    // Get organization admin users by joining organizationMembers with profiles
    const adminUsersQuery = await db
      .select({
        email: profiles.email,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(profiles, eq(organizationMembers.userId, profiles.userId))
      .where(eq(organizationMembers.organizationId, organizationId));

    // Filter for admin roles and format response
    const adminUsers = adminUsersQuery
      .filter((user: any) => user.role === "admin" || user.role === "owner")
      .map((user: any) => ({
        email: user.email,
        emailAddresses: [{ emailAddress: user.email }],
      }));

    return adminUsers;
  } catch (error) {
    throw new Error(`Failed to fetch admin users: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export const getOrganizationMemberships = async (
  userId: string
): Promise<{ data: { role: string; organization: { id: string; name: string } }[] }> => {
  try {
    // Get user's organization memberships by joining with organizations
    const memberships = await db
      .select({
        role: organizationMembers.role,
        organizationId: organizationMembers.organizationId,
        organizationName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId));

    return {
      data: memberships.map((membership: any) => ({
        role: membership.role,

        organization: {
          id: membership.organizationId,
          name: membership.organizationName,
        },
      })),
    };
  } catch (error) {
    throw new Error(`Failed to fetch memberships: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export const createOrganization = async (user: AuthenticatedUser): Promise<Organization> => {
  try {
    const organizationName = user.firstName ? `${user.firstName}'s Organization` : "My Organization";
    const organizationSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Create organization in Supabase
    const organizationData = await db
      .insert(organizations)
      .values({
        name: organizationName,
        slug: organizationSlug,
        email: user.email,
        privateMetadata: {
          freeTrialEndsAt: addDays(new Date(), FREE_TRIAL_PERIOD_DAYS).toISOString(),
          automatedRepliesCount: 0,
        },
      })
      .returning();

    if (!organizationData.length) {
      throw new Error("Failed to create organization");
    }

    const organization = organizationData[0];
    if (!organization) {
      throw new Error("Failed to create organization - no data returned");
    }

    // Note: organizationMembers requires mailboxId which needs to be created separately
    // For now, we'll return the organization without adding the member relationship
    // This should be handled at a higher level where mailboxes are managed

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug || organization.id,
      privateMetadata: organization.privateMetadata || {},
      emailAddresses: organization.email
        ? [
            {
              emailAddress: organization.email,
              verification: { status: "verified" },
            },
          ]
        : [],
      clerkUserId: undefined,
    };
  } catch (error) {
    throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export type SubscriptionStatus = "paid" | "free_trial" | "free_trial_expired";

export const getSubscriptionStatus = async (organization: {
  id: string;
  name: string;
  slug?: string;
}): Promise<SubscriptionStatus> => {
  if (!env.STRIPE_PRICE_ID || ADDITIONAL_PAID_ORGANIZATION_IDS.includes(organization.id)) {
    return "paid";
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organization.id),
    orderBy: desc(subscriptions.createdAt),
  });

  if (subscription) {
    return "paid";
  } else if (isFreeTrial(organization)) {
    return "free_trial";
  }
  return "free_trial_expired";
};

export const getCachedSubscriptionStatus = async (organizationId: string): Promise<SubscriptionStatus> => {
  const cacheKey = `subscription-status:${organizationId}`;
  const cached = (await redis.get(cacheKey)) as SubscriptionStatus | null;
  if (cached) return cached;

  const organization = await getClerkOrganization(organizationId);
  const status = await getSubscriptionStatus(organization);
  await redis.set(cacheKey, status, { ttl: 60 * 60 });
  return status;
};

export const isFreeTrial = (organization: {
  id: string;
  name: string;
  slug?: string;
  privateMetadata?: any;
}): boolean =>
  !!organization.privateMetadata?.freeTrialEndsAt &&
  new Date(organization.privateMetadata.freeTrialEndsAt) > new Date();
