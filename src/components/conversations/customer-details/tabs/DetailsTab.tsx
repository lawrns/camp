import React from "react";
import { Warning as AlertCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Icon } from "@/lib/ui/Icon";
import {
  CompanyInfoCard,
  ContactInfoCard,
  CustomAttributesCard,
  CustomerValueCard,
  TagsCard,
  TechnicalInfoCard,
} from "../cards";

interface CustomerData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  location: {
    city: string;
    country: string;
  };
  localTime?: string;
  sessions?: number;
  lifetimeValue?: number;
  conversationCount?: number;
  firstSeen: string;
  averageResponseTime?: string;
  company?: string;
  role?: string;
  deviceType: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  customAttributes?: Record<string, any>;
  tags?: string[];
}

interface DetailsTabProps {
  customer: CustomerData;
  isLoadingInsights?: boolean;
  isLoadingVerification?: boolean;
  error?: string | null;
}

export function DetailsTab({ customer, isLoadingInsights, isLoadingVerification, error }: DetailsTabProps) {
  return (
    <div className="panel-content-padding space-y-6">
      {/* Loading State */}
      {(isLoadingInsights || isLoadingVerification) && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="error" className="mb-4">
          <Icon icon={AlertCircle} className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contact Information */}
      <ContactInfoCard phone={customer.phone} location={customer.location} localTime={customer.localTime} />

      {/* Business Information */}
      <CustomerValueCard
        sessions={customer.sessions}
        lifetimeValue={customer.lifetimeValue}
        conversationCount={customer.conversationCount}
        firstSeen={customer.firstSeen}
        averageResponseTime={customer.averageResponseTime}
      />

      {/* Company Info */}
      <CompanyInfoCard company={customer.company} role={customer.role} />

      {/* Technical Information */}
      <TechnicalInfoCard
        deviceType={customer.deviceType}
        browser={customer.browser}
        os={customer.os}
        ipAddress={customer.ipAddress}
        firstSeen={customer.firstSeen}
      />

      {/* Custom Attributes */}
      <CustomAttributesCard customAttributes={customer.customAttributes} />

      {/* Tags */}
      <TagsCard tags={customer.tags} />
    </div>
  );
}
