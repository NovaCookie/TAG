import { useState, useCallback } from "react";

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
  });

  const updatePagination = useCallback((newPagination) => {
    setPagination((prev) => ({
      ...prev,
      ...newPagination,
    }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 1,
    });
  }, [initialPage, initialLimit]);

  const goToPage = useCallback((page) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  }, []);

  return {
    pagination,
    updatePagination,
    resetPagination,
    goToPage,
    setPagination,
  };
};
