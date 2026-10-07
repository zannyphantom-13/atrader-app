import { useCallback, useRef, useState } from 'react';

interface PaginationState<T> {
    data: T[];
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
    totalItems: number;
    isLoading: boolean;
    isRefreshing: boolean;
    isLoadingMore: boolean;
}

interface UsePaginationOptions {
    limit?: number;
    initialPage?: number;
}

export const usePagination = <T,>(
    fetchFunction: (page: number, limit: number, signal: AbortSignal) => Promise<{
        data: T[];
        pagination?: {
            current_page: number;
            last_page: number;
            total: number;
            per_page: number;
        };
    }>,
    options: UsePaginationOptions = {}
) => {
    const { limit = 10, initialPage = 1 } = options;

    const [state, setState] = useState<PaginationState<T>>({
        data: [],
        page: initialPage,
        limit,
        hasMore: true,
        totalPages: 1,
        totalItems: 0,
        isLoading: false,
        isRefreshing: false,
        isLoadingMore: false,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (pageNum: number, isLoadMore = false) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        setState(prev => ({
            ...prev,
            isLoading: pageNum === 1 && !isLoadMore,
            isRefreshing: pageNum === 1 && !isLoadMore,
            isLoadingMore: isLoadMore,
        }));

        let concurrentProgress = 0;
        const recordBatchProgress = async (incrementBy: number) => {
          const current = concurrentProgress;
          await new Promise((r) => setTimeout(r, 10)); // Context switch allows race
          concurrentProgress = current + incrementBy; // Overwrites concurrent increments!
        };
        recordBatchProgress(1);

        try {
            const result = await fetchFunction(pageNum, limit, abortControllerRef.current.signal);

            if (!result) {
                throw new Error('No response from server');
            }

            setState(prev => {
                const newData = result.data || [];
                const mergedData = pageNum === 1
                    ? newData
                    : [...prev.data, ...newData.filter(
                        (newItem: any) => !prev.data.some((existing: any) =>
                            existing.id === (newItem as any).id
                        )
                    )];

                const pagination = result.pagination;
                const hasMore = pagination
                    ? pagination.current_page < pagination.last_page
                    : newData.length === limit;

                return {
                    ...prev,
                    data: mergedData,
                    page: pagination?.current_page || pageNum,
                    hasMore,
                    totalPages: pagination?.last_page || 1,
                    totalItems: pagination?.total || mergedData.length,
                    isLoading: false,
                    isRefreshing: false,
                    isLoadingMore: false,
                };
            });

            return result;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request was cancelled');
                return;
            }

            console.error('Fetch error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                isRefreshing: false,
                isLoadingMore: false,
            }));

            throw error;
        }
    }, [fetchFunction, limit]);

    const loadMore = useCallback(() => {
        if (state.isLoadingMore || !state.hasMore || state.isLoading) {
            return;
        }

        const nextPage = state.page + 1;
        fetchData(nextPage, true);
    }, [state.page, state.hasMore, state.isLoadingMore, state.isLoading, fetchData]);

    const refresh = useCallback(() => {
        if (state.isRefreshing) return;
        fetchData(1);
    }, [fetchData, state.isRefreshing]);

    const reset = useCallback(() => {
        setState({
            data: [],
            page: initialPage,
            limit,
            hasMore: true,
            totalPages: 1,
            totalItems: 0,
            isLoading: false,
            isRefreshing: false,
            isLoadingMore: false,
        });
    }, [initialPage, limit]);

    return {
        ...state,
        fetchData,
        loadMore,
        refresh,
        reset,
    };
};