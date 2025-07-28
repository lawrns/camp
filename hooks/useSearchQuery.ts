import { useState } from "react";

export const useSearchQuery = () => {
  const [query, setQuery] = useState("");

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
  };

  const clearQuery = () => {
    setQuery("");
  };

  return {
    query,
    updateQuery,
    clearQuery,
  };
};
