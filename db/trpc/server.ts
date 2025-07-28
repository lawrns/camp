import { cache } from "react";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { createCaller, createTRPCContext, type AppRouter } from "@/trpc";
import { createQueryClient } from "./queryClient";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
export const createContext = cache(async (source: string) => {
  // Server-safe headers handling
  const heads = new Headers();
  heads.set("x-trpc-source", source);

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(() => createContext("rsc"));

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(caller, getQueryClient);
