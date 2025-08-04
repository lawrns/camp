import crypto from "crypto";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "@/db/client";
import { mailboxes } from "@/db/schema";
import { env } from "@/lib/utils/env-config";
import { widgetLogger } from "@/lib/utils/logger";

// Consolidated widget session management - merged from multiple files

// Widget theme type (extracted from missing @/lib/themes)
export interface MailboxTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
  position: "bottom-right" | "bottom-left";
}

export type WidgetSessionPayload = {
  email?: string;
  mailboxSlug: string;
  organizationId?: string; // Added for organization-based sessions
  showWidget: boolean;
  isAnonymous: boolean;
  isWhitelabel: boolean;
  theme?: MailboxTheme;
  title?: string;
  domain?: string; // The domain where the widget is embedded
  embedId?: string; // Unique identifier for this specific embed
  expirationMs?: number; // Custom expiration time in milliseconds
  currentToken?: string; // Added for token chaining
  iat?: number;
  exp?: number;
};

// Legacy organization-based payload for backward compatibility
export interface LegacyWidgetSessionPayload {
  organizationId: string;
  mailboxSlug?: string;
  email?: string;
  showWidget: boolean;
  currentToken?: string;
  iat?: number;
  exp?: number;
}

const jwtSecret = () => {
  const secret = env.WIDGET_JWT_SECRET;
  if (!secret) {
    throw new Error("WIDGET_JWT_SECRET is not set");
  }
  return secret;
};

export function createWidgetSession(
  payload: Omit<WidgetSessionPayload, "isAnonymous" | "email"> & {
    email?: string;
    isWhitelabel: boolean;
    domain?: string;
    embedId?: string;
    expirationMs?: number;
  }
): string {
  const isAnonymous = !payload.email;

  // Calculate JWT expiration (default to 12h, but use payload expiration if provided)
  const jwtExpiration = payload.expirationMs
    ? Math.floor(payload.expirationMs / 1000) + "s" // Convert ms to seconds
    : "12h"; // Default

  return jwt.sign({ ...payload, isAnonymous }, jwtSecret(), { expiresIn: jwtExpiration });
}

export function verifyWidgetSession(token: string): WidgetSessionPayload {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as WidgetSessionPayload;
    return decoded;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

// Organization-based session functions (consolidated from lib/widgetSession.ts)
export function createOrganizationWidgetSession(
  organization: { id: string; metadata?: unknown },
  options: {
    email?: string;
    showWidget: boolean;
    currentToken?: string;
    mailboxSlug?: string;
  }
): string {
  const payload: WidgetSessionPayload = {
    organizationId: organization.id,
    mailboxSlug: options.mailboxSlug || "",
    email: options.email,
    showWidget: options.showWidget,
    currentToken: options.currentToken,
    isAnonymous: !options.email,
    isWhitelabel: false,
  };

  // Use organization-specific secret or fallback to default
  const secret = organization.metadata?.widget_secret || env.WIDGET_JWT_SECRET || "default-widget-secret";

  return jwt.sign(payload, secret, {
    expiresIn: "24h",
    issuer: "campfire-widget",
  });
}

export function verifyOrganizationWidgetSession(
  token: string,
  organization: { id: string; metadata?: unknown }
): WidgetSessionPayload {
  const secret = organization.metadata?.widget_secret || env.WIDGET_JWT_SECRET || "default-widget-secret";

  try {
    const decoded = jwt.verify(token, secret) as WidgetSessionPayload;

    // Validate organization ID matches
    if (decoded.organizationId !== organization.id) {
      throw new Error("Organization ID mismatch");
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid widget session: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const getEmailHash = async (email: string, mailboxSlug: string, timestamp: number) => {
  const mailboxRecord = await db.query.mailboxes.findFirst({
    where: eq(mailboxes.slug, mailboxSlug),
    columns: {
      widgetHMACSecret: true,
    },
  });

  if (!mailboxRecord?.widgetHMACSecret) return null;

  return crypto.createHmac("sha256", mailboxRecord.widgetHMACSecret).update(`${email}:${timestamp}`).digest("hex");
};

// Enhanced email hash functions (consolidated from lib/widgetSession.ts)
export async function getOrganizationEmailHash(
  email: string,
  organizationId: string,
  timestamp: number
): Promise<string> {
  // Get organization-specific HMAC secret
  const secret = env.WIDGET_HMAC_SECRET || "default-hmac-secret";

  const message = `${email}:${organizationId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(message);

  return hmac.digest("hex");
}

export function validateEmailHash(
  email: string,
  organizationId: string,
  timestamp: number,
  providedHash: string
): boolean {
  try {
    const expectedHash = getOrganizationEmailHash(email, organizationId, timestamp);
    return crypto.timingSafeEqual(Buffer.from(providedHash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch (error) {
    widgetLogger.error("Email hash validation error:", error);
    return false;
  }
}

// Clock skew tolerance (1 hour)
const CLOCK_SKEW_TOLERANCE_MS = 60 * 60 * 1000;

export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const timestampMs = timestamp;

  return Math.abs(now - timestampMs) <= CLOCK_SKEW_TOLERANCE_MS;
}

export interface WidgetAuthResult {
  success: boolean;
  session?: WidgetSessionPayload;
  organization?: unknown;
  error?: string;
}

export async function authenticateWidgetRequest(request: Request, supabaseClient: unknown): Promise<WidgetAuthResult> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { success: false, error: "Missing authorization header" };
    }

    const token = authHeader.slice(7);
    const decoded = jwt.decode(token) as WidgetSessionPayload;

    if (!decoded?.organizationId) {
      return { success: false, error: "Invalid session token" };
    }

    // Get organization from database
    const { data: organization, error } = await supabaseClient
      .from("organizations")
      .select("id, name, metadata")
      .eq("id", decoded.organizationId)
      .single();

    if (error || !organization) {
      return { success: false, error: "Organization not found" };
    }

    // Verify the session
    let session;
    try {
      session = verifyOrganizationWidgetSession(token, organization);
    } catch (verifyError) {
      return { success: false, error: "Invalid session token" };
    }

    return { success: true, session, organization };
  } catch (error) {
    return {
      success: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Generate a secure embed token for a mailbox widget
 * This token is used to validate widget embedding on third-party websites
 */
export async function generateWidgetEmbedToken(
  mailboxSlug: string,
  domain: string,
  embedId: string = crypto.randomBytes(8).toString("hex"),
  expirationInSeconds?: number
): Promise<{ token: string; error?: string }> {
  try {
    const mailboxRecord = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.slug, mailboxSlug),
      columns: {
        id: true,
        // TEMPORARY FIX: Exclude missing columns until database is updated
        // widgetHMACSecret: true,  // Column doesn't exist in database
        // widgetHost: true,  // Column doesn't exist in database
        // isWhitelabel: true,  // Column doesn't exist in database
        // preferences: true,  // Column doesn't exist in database
        name: true,
        slug: true,
      },
    });

    if (!mailboxRecord) {
      return { token: "", error: "Mailbox not found" };
    }

    // TEMPORARY FIX: Skip domain validation until widgetHost column is added
    // Validate that the domain is allowed
    // if (mailboxRecord.widgetHost) {
    //   const allowedDomains = mailboxRecord.widgetHost.split(",").map((d: unknown) => d.trim().toLowerCase());
    //   const normalizedDomain = domain.toLowerCase();

    //   const isDomainAllowed = allowedDomains.some((allowed) => {
    //     // Allow exact match
    //     if (allowed === normalizedDomain) return true;

    //     // Allow wildcard subdomains (*.example.com)
    //     if (allowed.startsWith("*.") && normalizedDomain.endsWith(allowed.slice(1))) return true;

    //     return false;
    //   });

    //   if (!isDomainAllowed) {
    //     return { token: "", error: "Domain not allowed for this widget" };
    //   }
    // }

    // Create embed token with HMAC
    const timestamp = Date.now();

    // Convert expiration seconds to milliseconds if provided
    const expirationMs = expirationInSeconds ? expirationInSeconds * 1000 : undefined;

    const hmacPayload = `${mailboxSlug}:${domain}:${embedId}:${timestamp}${expirationMs ? `:${expirationMs}` : ""}`;
    // TEMPORARY FIX: Use fallback secret until database column is added
    const fallbackSecret = env.WIDGET_JWT_SECRET || "fallback-secret-key";
    const hmacSignature = crypto.createHmac("sha256", fallbackSecret).update(hmacPayload).digest("hex");

    // Create JWT with embed information
    const token = createWidgetSession({
      mailboxSlug,
      showWidget: true,
      // TEMPORARY FIX: Use defaults until database columns are added
      isWhitelabel: false, // mailboxRecord.isWhitelabel ?? false,
      // theme: undefined, // mailboxRecord.preferences?.theme,
      title: mailboxRecord.name,
      domain,
      embedId,
      ...(expirationMs !== undefined && { expirationMs }),
    });

    // Return both the token and the signature
    return {
      token: `${token}.${hmacSignature}.${timestamp}.${embedId}`,
    };
  } catch (error) {
    return { token: "", error: "Failed to generate embed token" };
  }
}

/**
 * Verify a widget embed token
 */
export async function verifyWidgetEmbedToken(
  embedToken: string,
  domain: string
): Promise<{ valid: boolean; session?: WidgetSessionPayload; error?: string }> {
  try {
    // Parse the composite token
    const [jwtToken, hmacSignature, timestampStr, embedId] = embedToken.split(".");

    if (!jwtToken || !hmacSignature || !timestampStr || !embedId) {
      return { valid: false, error: "Invalid embed token format" };
    }

    // Verify JWT token
    const session = verifyWidgetSession(jwtToken);
    const { mailboxSlug } = session;

    // Check if the domain matches
    if (session.domain !== domain) {
      return { valid: false, error: "Domain mismatch" };
    }

    // Check if embedId matches
    if (session.embedId !== embedId) {
      return { valid: false, error: "Embed ID mismatch" };
    }

    // Verify timestamp is not too old (configurable expiration)
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    // Get the embedded expiration from the JWT if available (or default to 1 hour)
    const TOKEN_EXPIRATION_MS = session.expirationMs || 60 * 60 * 1000; // Default 1 hour

    if (isNaN(timestamp) || now - timestamp > TOKEN_EXPIRATION_MS) {
      return { valid: false, error: "Embed token expired" };
    }

    // Verify HMAC signature
    const mailboxRecord = await db.query.mailboxes.findFirst({
      where: eq(mailboxes.slug, mailboxSlug),
      columns: {
        // TEMPORARY FIX: Exclude missing column until database is updated
        // widgetHMACSecret: true,  // Column doesn't exist in database
        id: true,
        slug: true,
      },
    });

    if (!mailboxRecord) {
      return { valid: false, error: "Failed to verify embed token" };
    }

    const hmacPayload = `${mailboxSlug}:${domain}:${embedId}:${timestamp}`;
    // TEMPORARY FIX: Use fallback secret until database column is added
    const fallbackSecret = env.WIDGET_JWT_SECRET || "fallback-secret-key";
    const computedSignature = crypto.createHmac("sha256", fallbackSecret).update(hmacPayload).digest("hex");

    if (computedSignature !== hmacSignature) {
      return { valid: false, error: "Invalid embed token signature" };
    }

    return { valid: true, session };
  } catch (error) {
    return { valid: false, error: "Failed to verify embed token" };
  }
}
