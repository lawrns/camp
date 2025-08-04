import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  status?: "online" | "away" | "offline" | "invited";
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
  lastActivity: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface AddMemberData {
  email: string;
  role?: "admin" | "member";
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/teams", {
        headers: {
          Authorization: `Bearer ${(user as unknown).accessToken || (user as unknown).access_token || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();

      if (data.success) {
        setTeams(data.teams || []);
      } else {
        throw new Error(data.error || "Failed to load teams");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTeam = useCallback(
    async (teamData: CreateTeamData): Promise<Team | null> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        const response = await fetch("/api/teams", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(user as unknown).accessToken || (user as unknown).access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamData),
        });

        if (!response.ok) {
          throw new Error("Failed to create team");
        }

        const data = await response.json();

        if (data.success) {
          const newTeam = data.team;
          setTeams((prev) => [...prev, newTeam]);
          return newTeam;
        } else {
          throw new Error(data.error || "Failed to create team");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create team");
        return null;
      }
    },
    [user]
  );

  const addTeamMember = useCallback(
    async (teamId: string, memberData: AddMemberData): Promise<TeamMember | null> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        const response = await fetch(`/api/teams/${teamId}/members`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(user as unknown).accessToken || (user as unknown).access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberData),
        });

        if (!response.ok) {
          throw new Error("Failed to add team member");
        }

        const data = await response.json();

        if (data.success) {
          const newMember = data.member;

          // Update the team in the local state
          setTeams((prev) =>
            prev.map((team: unknown) =>
              team.id === teamId
                ? {
                    ...team,
                    members: [...team.members, newMember],
                    memberCount: team.memberCount + 1,
                  }
                : team
            )
          );

          return newMember;
        } else {
          throw new Error(data.error || "Failed to add team member");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add team member");
        return null;
      }
    },
    [user]
  );

  const getTeamMembers = useCallback(
    async (teamId: string): Promise<TeamMember[]> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        setError(null);

        const response = await fetch(`/api/teams/${teamId}/members`, {
          headers: {
            Authorization: `Bearer ${(user as unknown).accessToken || (user as unknown).access_token || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch team members");
        }

        const data = await response.json();

        if (data.success) {
          return data.members || [];
        } else {
          throw new Error(data.error || "Failed to load team members");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team members");
        return [];
      }
    },
    [user]
  );

  // Load teams on mount and when user changes
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    addTeamMember,
    getTeamMembers,
    refreshTeams: fetchTeams,
  };
}
