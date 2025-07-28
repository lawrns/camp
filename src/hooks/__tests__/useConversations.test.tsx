import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConversations } from '../useConversations';

// Mock the useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { organizationId: 'test-org-id' }
  })
}));

// Mock Supabase
const mockSupabase = {
  browser: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } }
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: '1', title: 'Test Conversation', organization_id: 'test-org-id' }],
        error: null
      })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue(undefined),
    })),
  }))
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('useConversations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch conversations successfully', async () => {
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([
      { id: '1', title: 'Test Conversation', organization_id: 'test-org-id' }
    ]);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Database error');
    mockSupabase.browser().from().order.mockResolvedValueOnce({
      data: null,
      error
    });

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });
  });

  it('should not fetch when organizationId is not available', () => {
    // Mock useAuth to return no user
    vi.mocked(require('../useAuth').useAuth).mockReturnValueOnce({
      user: null
    });

    const { result } = renderHook(() => useConversations(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.conversations).toEqual([]);
  });
});