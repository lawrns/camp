import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConversations } from '../useConversations';

// Mock Supabase client
const mockSupabase = {
    from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
            data: [{ id: '1', title: 'Test Conversation' }],
            error: null,
        }),
    }),
    channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue(undefined),
    }),
};

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabase,
}));

describe('useConversations', () => {
    let queryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('should fetch conversations', async () => {
        const { result } = renderHook(() => useConversations(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([{ id: '1', title: 'Test Conversation' }]);
    });

    it('should handle fetch errors', async () => {
        mockSupabase.from().select.mockReturnValueOnce({ data: null, error: new Error('Fetch failed') });

        const { result } = renderHook(() => useConversations(), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error.message).toBe('Fetch failed');
    });

    it('should subscribe to real-time updates', async () => {
        const { result } = renderHook(() => useConversations(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Simulate real-time insert
        const channel = mockSupabase.channel.mock.results[0].value;
        const insertHandler = channel.on.mock.calls.find(call => call[1].event === 'INSERT')[2];

        // The original code had 'act' here, but 'act' is not imported.
        // Assuming the intent was to call the handler directly or that 'act' was a leftover.
        // For now, removing 'act' as it's not available.
        insertHandler({ new: { id: '2', title: 'New Conversation' } });

        await waitFor(() => {
            expect(queryClient.getQueryData(['conversations'])).toContainEqual({ id: '2', title: 'New Conversation' });
        });
    });
});