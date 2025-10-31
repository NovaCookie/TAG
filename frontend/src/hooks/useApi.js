import { useState, useCallback } from "react";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callApi = useCallback(async (apiCall, options = {}) => {
    const {
      onSuccess,
      onError,
      showLoading = true,
      resetError = true,
    } = options;

    try {
      if (showLoading) setLoading(true);
      if (resetError) setError("");

      const response = await apiCall();

      if (onSuccess) onSuccess(response.data);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Une erreur est survenue";
      setError(errorMessage);
      if (onError) onError(errorMessage, err);
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => setError(""), []);

  return {
    loading,
    error,
    callApi,
    resetError,
    setError,
  };
};
