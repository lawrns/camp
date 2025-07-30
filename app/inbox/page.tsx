import { redirect } from 'next/navigation';

/**
 * Redirect from legacy /inbox route to standardized /dashboard/inbox route
 * This ensures consistent URL patterns across the application
 */
export default function InboxRedirectPage() {
  redirect('/dashboard/inbox');
}