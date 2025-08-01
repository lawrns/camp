"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, MessageSquare, Copy, Check } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface WidgetSetupStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function WidgetSetupStep({ data, onUpdate, onNext, onBack, isLoading }: WidgetSetupStepProps) {
  const [settings, setSettings] = useState(data.widgetSettings || {
    primaryColor: '#3b82f6',
    welcomeMessage: 'Hi! How can we help you today?',
    position: 'bottom-right' as const
  });
  const [copied, setCopied] = useState(false);

  const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget.js';
    script.setAttribute('data-organization-id', '${data.organizationId}');
    document.head.appendChild(script);
  })();
</script>`;

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
  };

  const handleNext = () => {
    onUpdate({ widgetSettings: settings });
    onNext();
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Widget Setup
        </CardTitle>
        <CardDescription>
          Customize your chat widget appearance and get the embed code for your website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Widget Customization */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Primary Color
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="position">Widget Position</Label>
              <select
                id="position"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                value={settings.position}
                onChange={(e) => updateSetting('position', e.target.value)}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="welcomeMessage" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Welcome Message
            </Label>
            <Input
              id="welcomeMessage"
              type="text"
              value={settings.welcomeMessage}
              onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
              placeholder="Hi! How can we help you today?"
              className="mt-1"
            />
          </div>
        </div>

        {/* Widget Preview */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50 relative h-32">
            <div className="absolute bottom-4 right-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Widget will appear in the {settings.position.replace('-', ' ')} corner
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Embed Code</h3>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyEmbedCode}
              className="absolute top-2 right-2"
            >
              {copied ? (
                <><Check className="h-4 w-4 mr-1" /> Copied</>
              ) : (
                <><Copy className="h-4 w-4 mr-1" /> Copy</>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Add this code to your website's HTML to embed the chat widget.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}