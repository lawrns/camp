/**
 * Knowledge Profile Manager
 *
 * Manages AI knowledge profiles and training data
 */

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";

export interface KnowledgeProfile {
  id: string;
  name: string;
  description: string;
  status: "active" | "training" | "inactive";
  accuracy: number;
  documentCount: number;
  lastTrained: Date;
  version: string;
}

interface KnowledgeProfileManagerProps {
  className?: string;
}

export const KnowledgeProfileManager: React.FC<KnowledgeProfileManagerProps> = ({ className }) => {
  const [profiles, setProfiles] = useState<KnowledgeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    // Mock data loading
    const mockProfiles: KnowledgeProfile[] = [
      {
        id: "profile-1",
        name: "Customer Support",
        description: "General customer support knowledge base",
        status: "active",
        accuracy: 94.2,
        documentCount: 1250,
        lastTrained: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        version: "1.4.2",
      },
      {
        id: "profile-2",
        name: "Technical Documentation",
        description: "Product technical documentation and API guides",
        status: "active",
        accuracy: 91.8,
        documentCount: 890,
        lastTrained: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        version: "1.2.1",
      },
      {
        id: "profile-3",
        name: "Sales Training",
        description: "Sales scripts and product information",
        status: "training",
        accuracy: 87.5,
        documentCount: 450,
        lastTrained: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        version: "1.0.3",
      },
    ];

    setTimeout(() => {
      setProfiles(mockProfiles);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;

    const newProfile: KnowledgeProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName,
      description: "New knowledge profile",
      status: "inactive",
      accuracy: 0,
      documentCount: 0,
      lastTrained: new Date(),
      version: "1.0.0",
    };

    setProfiles((prev) => [...prev, newProfile]);
    setNewProfileName("");
  };

  const handleTrainProfile = (profileId: string) => {
    setProfiles((prev) =>
      prev.map((profile) => (profile.id === profileId ? { ...profile, status: "training" as const } : profile))
    );

    // Simulate training completion
    setTimeout(() => {
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === profileId
            ? {
                ...profile,
                status: "active" as const,
                lastTrained: new Date(),
                accuracy: Math.min(profile.accuracy + Math.random() * 5, 100),
              }
            : profile
        )
      );
    }, 3000);
  };

  const getStatusColor = (status: KnowledgeProfile["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "training":
        return "bg-blue-500";
      case "inactive":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card {...(className && { className })}>
        <CardHeader>
          <CardTitle>Knowledge Profile Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...(className && { className })}>
      <CardHeader>
        <CardTitle>Knowledge Profile Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Create New Profile */}
          <div className="flex space-x-spacing-sm">
            <Input
              placeholder="New profile name"
              value={newProfileName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProfileName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateProfile()}
            />
            <Button onClick={handleCreateProfile}>Create</Button>
          </div>

          {/* Profiles List */}
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-ds-lg border spacing-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium">{profile.name}</h3>
                    <Badge className={getStatusColor(profile.status)}>{profile.status}</Badge>
                    <span className="text-sm text-[var(--fl-color-text-muted)]">v{profile.version}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTrainProfile(profile.id)}
                    disabled={profile.status === "training"}
                  >
                    {profile.status === "training" ? "Training..." : "Train"}
                  </Button>
                </div>

                <p className="text-foreground mb-3 text-sm">{profile.description}</p>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="font-medium">Accuracy</div>
                    <div>{profile.accuracy.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="font-medium">Documents</div>
                    <div>{profile.documentCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Last Trained</div>
                    <div>{profile.lastTrained.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeProfileManager;
