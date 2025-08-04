import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthHookPayload {
  event: string;
  session: {
    user: {
      id: string;
      email: string;
      app_metadata: {
        organization_id?: string;
        organization_name?: string;
        organization_role?: string;
        [key: string]: unknown;
      };
      user_metadata: {
        [key: string]: unknown;
      };
    };
    access_token: string;
    refresh_token: string;
  };
}

interface AuthHookResponse {
  claims: {
    organization_id?: string;
    organization_name?: string;
    organization_role?: string;
    [key: string]: unknown;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: AuthHookPayload = await req.json();

    console.log("Auth Hook triggered:", {
      event: payload.event,
      userId: payload.session?.user?.id,
      email: payload.session?.user?.email,
    });

    // Only process token.issued events
    if (payload.event !== "token.issued") {
      return new Response(JSON.stringify({ claims: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const user = payload.session?.user;
    if (!user) {
      console.error("No user found in session");
      return new Response(JSON.stringify({ claims: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract organization context from app_metadata
    const appMetadata = user.app_metadata || {};
    const organizationId = appMetadata.organization_id;
    const organizationName = appMetadata.organization_name;
    const organizationRole = appMetadata.organization_role;

    // Build custom claims to inject at root level
    const customClaims: AuthHookResponse["claims"] = {};

    // Inject organization_id at root level for RLS policies
    if (organizationId) {
      customClaims.organization_id = organizationId;
      console.log(`Injecting organization_id: ${organizationId} for user: ${user.id}`);
    }

    // Optionally inject additional organization context
    if (organizationName) {
      customClaims.organization_name = organizationName;
    }

    if (organizationRole) {
      customClaims.organization_role = organizationRole;
    }

    // Log the claims being injected
    console.log("Custom claims injected:", customClaims);

    return new Response(JSON.stringify({ claims: customClaims }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Auth Hook error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        claims: {},
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/* To test this function:

curl -i --location --request POST 'http://localhost:54321/functions/v1/auth-hook-custom-claims' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "event": "token.issued",
    "session": {
      "user": {
        "id": "36ffd926-8b4b-48b2-aee4-cb567a655d04",
        "email": "jam@jam.com",
        "app_metadata": {
          "organization_id": "b5e80170-004c-4e82-a88c-3e2166b169dd",
          "organization_name": "Test Organization",
          "organization_role": "admin"
        },
        "user_metadata": {}
      },
      "access_token": "...",
      "refresh_token": "..."
    }
  }'

*/
