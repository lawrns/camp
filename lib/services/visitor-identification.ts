/**
 * PHASE 1 CRITICAL FIX: Visitor Identification Service
 * 
 * Replaces hardcoded visitor IDs with proper database-driven visitor tracking
 * identified as critical issue in god.md analysis.
 * 
 * Features:
 * - Unique visitor identification
 * - Session management
 * - Browser fingerprinting
 * - Return visitor detection
 * - Privacy-compliant tracking
 */

import { supabase } from '@/lib/supabase/consolidated-exports';
import crypto from 'crypto';

interface VisitorInfo {
  id: string;
  visitorId: string;
  sessionId: string;
  sessionToken: string;
  isReturning: boolean;
  organizationId: string;
  metadata: Record<string, any>;
}

interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
}

interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ip?: string;
}

/**
 * Generate a unique visitor ID based on browser characteristics
 */
function generateVisitorFingerprint(browserInfo: Partial<BrowserInfo>, ip?: string): string {
  const components = [
    browserInfo.userAgent || '',
    browserInfo.language || '',
    browserInfo.platform || '',
    browserInfo.timezone || '',
    browserInfo.screenResolution || '',
    browserInfo.colorDepth?.toString() || '',
    ip || ''
  ];
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);
  
  return `visitor_${fingerprint}`;
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extract browser information from request headers
 */
function extractBrowserInfo(request: Request): Partial<BrowserInfo> {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  
  return {
    userAgent,
    language: acceptLanguage.split(',')[0] || 'en',
    platform: userAgent.includes('Windows') ? 'Windows' : 
              userAgent.includes('Mac') ? 'macOS' : 
              userAgent.includes('Linux') ? 'Linux' : 'Unknown'
  };
}

/**
 * Extract IP address from request
 */
function extractIPAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || realIP || (forwarded ? forwarded.split(',')[0].trim() : 'unknown');
}

/**
 * Create or retrieve visitor information
 */
export async function identifyVisitor(
  organizationId: string,
  request: Request,
  providedVisitorId?: string
): Promise<VisitorInfo> {
  const browserInfo = extractBrowserInfo(request);
  const ipAddress = extractIPAddress(request);
  
  // Generate visitor ID from fingerprint or use provided ID
  const visitorId = providedVisitorId || generateVisitorFingerprint(browserInfo, ipAddress);
  
  try {
    const supabaseClient = supabase.admin();
    
    // Check if visitor already exists
    const { data: existingVisitor, error: visitorError } = await supabaseClient
      .from('widget_visitors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('visitor_id', visitorId)
      .single();
    
    let visitor;
    let isReturning = false;
    
    if (existingVisitor && !visitorError) {
      // Update existing visitor
      isReturning = true;
      const { data: updatedVisitor, error: updateError } = await supabaseClient
        .from('widget_visitors')
        .update({
          last_seen_at: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: browserInfo.userAgent,
          browser_info: browserInfo,
          is_returning: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVisitor.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[Visitor ID] Error updating visitor:', updateError);
        throw updateError;
      }
      
      visitor = updatedVisitor;
    } else {
      // Create new visitor
      const { data: newVisitor, error: createError } = await supabaseClient
        .from('widget_visitors')
        .insert({
          organization_id: organizationId,
          visitor_id: visitorId,
          ip_address: ipAddress,
          user_agent: browserInfo.userAgent,
          browser_info: browserInfo,
          is_returning: false,
          metadata: {}
        })
        .select()
        .single();
      
      if (createError) {
        console.error('[Visitor ID] Error creating visitor:', createError);
        throw createError;
      }
      
      visitor = newVisitor;
    }
    
    // Create new session
    const sessionToken = generateSessionToken();
    const sessionId = crypto.randomUUID();
    
    const { data: session, error: sessionError } = await supabaseClient
      .from('widget_sessions')
      .insert({
        id: sessionId,
        organization_id: organizationId,
        visitor_id: visitor.id,
        session_token: sessionToken,
        is_active: true,
        metadata: {
          browserInfo,
          ipAddress,
          startedAt: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('[Visitor ID] Error creating session:', sessionError);
      throw sessionError;
    }
    
    return {
      id: visitor.id,
      visitorId: visitor.visitor_id,
      sessionId: session.id,
      sessionToken: session.session_token,
      isReturning,
      organizationId,
      metadata: {
        browserInfo,
        ipAddress,
        firstSeen: visitor.first_seen_at,
        lastSeen: visitor.last_seen_at
      }
    };
    
  } catch (error) {
    console.error('[Visitor ID] Error in visitor identification:', error);
    
    // Fallback to basic visitor ID generation
    return {
      id: crypto.randomUUID(),
      visitorId,
      sessionId: crypto.randomUUID(),
      sessionToken: generateSessionToken(),
      isReturning: false,
      organizationId,
      metadata: { browserInfo, ipAddress, fallback: true }
    };
  }
}

/**
 * Validate session token
 */
export async function validateSession(
  sessionToken: string,
  organizationId: string
): Promise<{ valid: boolean; session?: any; visitor?: any }> {
  try {
    const supabaseClient = supabase.admin();
    
    const { data: session, error } = await supabaseClient
      .from('widget_sessions')
      .select(`
        *,
        widget_visitors (*)
      `)
      .eq('session_token', sessionToken)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();
    
    if (error || !session) {
      return { valid: false };
    }
    
    // Update last activity
    await supabaseClient
      .from('widget_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);
    
    return {
      valid: true,
      session,
      visitor: session.widget_visitors
    };
    
  } catch (error) {
    console.error('[Visitor ID] Error validating session:', error);
    return { valid: false };
  }
}

/**
 * End a session
 */
export async function endSession(sessionToken: string): Promise<boolean> {
  try {
    const supabaseClient = supabase.admin();
    
    const { error } = await supabaseClient
      .from('widget_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);
    
    return !error;
    
  } catch (error) {
    console.error('[Visitor ID] Error ending session:', error);
    return false;
  }
}

/**
 * Associate conversation with session
 */
export async function associateConversation(
  sessionToken: string,
  conversationId: string
): Promise<boolean> {
  try {
    const supabaseClient = supabase.admin();
    
    const { error } = await supabaseClient
      .from('widget_sessions')
      .update({
        conversation_id: conversationId,
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);
    
    return !error;
    
  } catch (error) {
    console.error('[Visitor ID] Error associating conversation:', error);
    return false;
  }
}

/**
 * Get visitor statistics
 */
export async function getVisitorStats(organizationId: string): Promise<{
  totalVisitors: number;
  activeVisitors: number;
  returningVisitors: number;
  activeSessions: number;
}> {
  try {
    const supabaseClient = supabase.admin();
    
    const [totalResult, activeResult, returningResult, sessionsResult] = await Promise.all([
      supabaseClient
        .from('widget_visitors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId),
      
      supabaseClient
        .from('widget_visitors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('last_seen_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()), // Last 30 minutes
      
      supabaseClient
        .from('widget_visitors')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_returning', true),
      
      supabaseClient
        .from('widget_sessions')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
    ]);
    
    return {
      totalVisitors: totalResult.count || 0,
      activeVisitors: activeResult.count || 0,
      returningVisitors: returningResult.count || 0,
      activeSessions: sessionsResult.count || 0
    };
    
  } catch (error) {
    console.error('[Visitor ID] Error getting visitor stats:', error);
    return {
      totalVisitors: 0,
      activeVisitors: 0,
      returningVisitors: 0,
      activeSessions: 0
    };
  }
}
