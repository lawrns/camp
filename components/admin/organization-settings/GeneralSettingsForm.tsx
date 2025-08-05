/**
 * General Settings Form Component
 *
 * Handles basic organization information, contact details,
 * and general configuration settings.
 */

"use client";

import { Buildings as Building, Globe, MapPin, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import {
  ContactInfo,
  CURRENCIES,
  GeneralSettings,
  LANGUAGES,
  ORGANIZATION_SIZES,
  SettingsUpdateHandler,
  TIMEZONES,
} from "./types";

interface GeneralSettingsFormProps {
  general: GeneralSettings;
  contact: ContactInfo;
  onUpdate: SettingsUpdateHandler;
}

export function GeneralSettingsForm({ general, contact, onUpdate }: GeneralSettingsFormProps) {
  return (
    <div className="space-y-6">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Building className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={general.name}
                onChange={(e) => onUpdate("general", "name", e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                type="url"
                value={general.website}
                onChange={(e) => onUpdate("general", "website", e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={general.description}
              onChange={(e) => onUpdate("general", "description", e.target.value)}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="org-size">Organization Size</Label>
              <Select value={general.size} onValueChange={(value) => onUpdate("general", "size", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="org-industry">Industry</Label>
              <Input
                id="org-industry"
                value={general.industry || ""}
                onChange={(e) => onUpdate("general", "industry", e.target.value)}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={general.timezone} onValueChange={(value) => onUpdate("general", "timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={general.language} onValueChange={(value) => onUpdate("general", "language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={general.currency} onValueChange={(value) => onUpdate("general", "currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <MapPin className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={contact.address}
              onChange={(e) => onUpdate("contact", "address", e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={contact.city}
                onChange={(e) => onUpdate("contact", "city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={contact.state}
                onChange={(e) => onUpdate("contact", "state", e.target.value)}
                placeholder="State or Province"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={contact.zipCode}
                onChange={(e) => onUpdate("contact", "zipCode", e.target.value)}
                placeholder="ZIP or Postal Code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={contact.country}
                onChange={(e) => onUpdate("contact", "country", e.target.value)}
                placeholder="Country"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={contact.phone}
                onChange={(e) => onUpdate("contact", "phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => onUpdate("contact", "email", e.target.value)}
                placeholder="contact@yourcompany.com"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={contact.supportEmail || ""}
                onChange={(e) => onUpdate("contact", "supportEmail", e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Upload className="h-5 w-5" />
            Organization Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {general.logo && (
              <img src={general.logo} alt="Organization logo" className="h-16 w-16 rounded border object-contain" />
            )}
            <div>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
              <p className="mt-1 text-sm text-[var(--fl-color-text-muted)]">Recommended: 200x200px, PNG or JPG</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
