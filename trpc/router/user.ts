import { type TRPCRouterRecord } from "@trpc/server";
import { publicProcedure, protectedProcedure } from "../trpc";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";

export const userRouter = {
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cookieStore = await cookies();
      const supabaseClient = supabase.server(cookieStore);

      const { data: { user }, error } = await supabaseClient.auth.getUser();

      if (error || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Get additional profile data
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        displayName: profile?.fullName || user.email?.split('@')[0],
        organizationId: profile?.organization_id,
        role: profile?.role || 'agent',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        profile,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile',
      });
    }
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().optional(),
      displayName: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();
        const supabaseClient = supabase.server(cookieStore);

        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        // Update user metadata
        const { error: updateError } = await supabaseClient.auth.updateUser({
          data: {
            fullName: input.fullName,
            display_name: input.displayName,
            avatar_url: input.avatar,
          },
        });

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user profile',
          });
        }

        // Update profile table if it exists
        await supabaseClient
          .from('profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            fullName: input.fullName,
            avatar_url: input.avatar,
            updated_at: new Date().toISOString(),
          });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  // Get user organizations
  getOrganizations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cookieStore = await cookies();
      const supabaseClient = supabase.server(cookieStore);

      const { data: { user }, error } = await supabaseClient.auth.getUser();

      if (error || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const { data: memberships } = await supabaseClient
        .from('organization_members')
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      return memberships || [];
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user organizations',
      });
    }
  }),
} satisfies TRPCRouterRecord;
