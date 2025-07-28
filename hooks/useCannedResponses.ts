import { useEffect, useState } from "react";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut?: string;
  tags: string[];
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface UseCannedResponsesReturn {
  responses: CannedResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createResponse: (data: Partial<CannedResponse>) => Promise<void>;
  updateResponse: (id: string, data: Partial<CannedResponse>) => Promise<void>;
  deleteResponse: (id: string) => Promise<void>;
}

export function useCannedResponses(): UseCannedResponsesReturn {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/canned-responses");

      if (!response.ok) {
        throw new Error("Failed to fetch canned responses");
      }

      const data = await response.json();

      if (data.success) {
        setResponses(data.data || []);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");

    } finally {
      setLoading(false);
    }
  };

  const createResponse = async (data: Partial<CannedResponse>) => {
    try {
      const response = await fetch("/api/canned-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create canned response");
      }

      const result = await response.json();

      if (result.success) {
        await fetchResponses(); // Refetch to get updated list
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const updateResponse = async (id: string, data: Partial<CannedResponse>) => {
    try {
      const response = await fetch("/api/canned-responses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        throw new Error("Failed to update canned response");
      }

      const result = await response.json();

      if (result.success) {
        await fetchResponses(); // Refetch to get updated list
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const deleteResponse = async (id: string) => {
    try {
      const response = await fetch(`/api/canned-responses?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete canned response");
      }

      const result = await response.json();

      if (result.success) {
        await fetchResponses(); // Refetch to get updated list
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  return {
    responses,
    loading,
    error,
    refetch: fetchResponses,
    createResponse,
    updateResponse,
    deleteResponse,
  };
}
