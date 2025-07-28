import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: "online" | "offline" | "away" | "busy";
  department: string;
  isAvailable: boolean;
}

interface UseTeamMembersReturn {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTeamMembers(): UseTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/team-members");

      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }

      const data = await response.json();

      if (data.success) {
        setTeamMembers(data.data || []);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    loading,
    error,
    refetch: fetchTeamMembers,
  };
}
