"use client";

import { useEffect, useState } from "react";
import {
  Warning as AlertCircle,
  ArrowSquareOut,
  ChartBar as BarChart3,
  Book,
  CheckCircle,
  CaretRight as ChevronRight,
  Clock,
  FileText,
  Headphones,
  Question as HelpCircle,
  Envelope as Mail,
  ChatCircle as MessageCircle,
  Phone,
  MagnifyingGlass as Search,
  Gear as Settings,
  Shield,
  Star,
  Users,
  VideoCamera as Video,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  views: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  category: string;
}

interface HelpResource {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "guide" | "tutorial";
  category: string;
  url: string;
  duration?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export default function DashboardHelpPage() {
  const [loading, setLoading] = useState(false);

  // Simplified help page for now

  if (loading) {
    return (
      <div className="space-y-6 spacing-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600">Loading help resources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 spacing-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-lg text-gray-600">Find answers, guides, and get help when you need it</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="spacing-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--fl-color-info-subtle)]">
              <Icon icon={MessageCircle} className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Live Chat Support</h3>
            <p className="mb-4 text-sm text-gray-600">Get instant help from our support team</p>
            <Button className="w-full">Start Chat</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="spacing-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--fl-color-success-subtle)]">
              <Icon icon={Mail} className="text-semantic-success-dark h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Email Support</h3>
            <p className="mb-4 text-sm text-gray-600">Send us a detailed message</p>
            <Button variant="outline" className="w-full">
              Send Email
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="spacing-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-lg bg-purple-100">
              <Icon icon={Phone} className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Phone Support</h3>
            <p className="mb-4 text-sm text-gray-600">Call us for urgent issues</p>
            <Button variant="outline" className="w-full">
              Call Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
