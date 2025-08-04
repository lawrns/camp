import { Buildings as Building, Clock, Envelope as Mail, MapPin, User } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/unified-ui/components/dialog";
import { CustomerProfile } from "@/hooks/useCustomerProfile";
import { Icon } from "@/lib/ui/Icon";
import { genWaveAvatar, getInitials, getUserAvatar } from "@/lib/utils/avatar";

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function CustomerProfileModal({ isOpen, onClose, profile, isLoading, error }: CustomerProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon icon={User} className="h-5 w-5 text-blue-600" />
            Customer Profile
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
              <p className="text-foreground">Loading customer profile...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-brand-mahogany-500 mb-4">⚠️</div>
              <p className="mb-4 text-red-600">{error}</p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : profile ? (
          (() => {
            const avatarUrl = getUserAvatar({
              email: profile.email,
              name: profile.name,
            });
            const initials = getInitials(profile.name);
            const fallbackGradient = genWaveAvatar(profile.email || profile.name);

            return (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-3 rounded-ds-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-spacing-md">
                  <div className="bg-background h-20 w-20 overflow-hidden rounded-ds-full shadow-card-deep ring-1 ring-black/5">
                    <img
                      src={avatarUrl}
                      alt={`${profile.name}'s avatar`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background with initials
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.background = fallbackGradient;
                          parent.innerHTML = `<span class="flex items-center justify-center w-full h-full text-white font-bold text-xl drop-shadow-sm">${initials}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">{profile.name}</h3>
                    <div className="mb-2 flex items-center gap-ds-2">
                      <Icon icon={Mail} className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-ds-2">
                      <Badge
                        className={` ${
                          profile.status === "online"
                            ? "border-status-success-light bg-[var(--fl-color-success-subtle)] text-green-800"
                            : profile.status === "away"
                              ? "border-orange-200 bg-orange-100 text-orange-800"
                              : "border-[var(--fl-color-border)] bg-gray-100 text-gray-800"
                        } `}
                      >
                        {profile.status}
                      </Badge>
                      {profile.tags.map((tag: unknown) => (
                        <Badge key={tag} variant="outline" className="text-tiny">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="border-b border-[var(--fl-color-border)] pb-2 font-semibold text-gray-900">
                      Contact Information
                    </h4>

                    {profile.company && (
                      <div className="flex items-center gap-3">
                        <Icon icon={Building} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{profile.company}</p>
                          {profile.title && <p className="text-foreground text-tiny">{profile.title}</p>}
                        </div>
                      </div>
                    )}

                    {profile.location && (
                      <div className="flex items-center gap-3">
                        <Icon icon={MapPin} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                        <p className="text-sm text-gray-900">{profile.location}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Icon icon={Clock} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                      <p className="text-sm text-gray-900">{profile.timezone}</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-3">
                    <h4 className="border-b border-[var(--fl-color-border)] pb-2 font-semibold text-gray-900">
                      Statistics
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3 text-center">
                        <p className="text-3xl font-bold text-blue-600">{profile.totalConversations}</p>
                        <p className="text-foreground text-tiny">Total Conversations</p>
                      </div>
                      <div className="rounded-ds-lg bg-[var(--fl-color-success-subtle)] spacing-3 text-center">
                        <p className="text-semantic-success-dark text-3xl font-bold">{profile.openConversations}</p>
                        <p className="text-foreground text-tiny">Open</p>
                      </div>
                      <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3 text-center">
                        <p className="text-foreground text-3xl font-bold">{profile.closedConversations}</p>
                        <p className="text-foreground text-tiny">Closed</p>
                      </div>
                      <div className="rounded-ds-lg bg-purple-50 spacing-3 text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          {profile.satisfaction ? `${profile.satisfaction}%` : "N/A"}
                        </p>
                        <p className="text-foreground text-tiny">Satisfaction</p>
                      </div>
                    </div>

                    {profile.averageResponseTime && (
                      <div className="rounded-ds-lg bg-orange-50 spacing-3">
                        <p className="text-sm font-medium text-gray-900">Average Response Time</p>
                        <p className="text-base font-bold text-orange-600">{profile.averageResponseTime}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {profile.notes && (
                  <div className="space-y-spacing-sm">
                    <h4 className="border-b border-[var(--fl-color-border)] pb-2 font-semibold text-gray-900">Notes</h4>
                    <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                      <p className="text-foreground text-sm">{profile.notes}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-spacing-sm">
                  <h4 className="border-b border-[var(--fl-color-border)] pb-2 font-semibold text-gray-900">
                    Timeline
                  </h4>
                  <div className="text-foreground space-y-spacing-sm text-sm">
                    <p>
                      Customer since: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                    <p>Last seen: {profile.lastSeen ? new Date(profile.lastSeen).toLocaleDateString() : "Unknown"}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-[var(--fl-color-border)] pt-4">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Edit Profile
                  </Button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-foreground">No profile data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
