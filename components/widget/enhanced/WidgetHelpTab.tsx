"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Envelope, 
  Clock, 
  ChatCircle, 
  PaperPlaneTilt,
  CheckCircle,
  Warning,
  Globe,
  MapPin
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

interface WidgetHelpTabProps {
  className?: string;
  onStartChat?: () => void;
  organizationConfig?: {
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    businessHours?: {
      timezone: string;
      schedule: Array<{
        day: string;
        open: string;
        close: string;
        closed?: boolean;
      }>;
    };
  };
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export function WidgetHelpTab({ 
  className, 
  onStartChat,
  organizationConfig = {
    name: "Support Team",
    phone: "+1 (555) 123-4567",
    email: "support@company.com",
    website: "https://company.com",
    address: "123 Business St, City, State 12345",
    businessHours: {
      timezone: "EST",
      schedule: [
        { day: "Monday", open: "9:00 AM", close: "6:00 PM" },
        { day: "Tuesday", open: "9:00 AM", close: "6:00 PM" },
        { day: "Wednesday", open: "9:00 AM", close: "6:00 PM" },
        { day: "Thursday", open: "9:00 AM", close: "6:00 PM" },
        { day: "Friday", open: "9:00 AM", close: "6:00 PM" },
        { day: "Saturday", closed: true },
        { day: "Sunday", closed: true },
      ]
    }
  }
}: WidgetHelpTabProps) {
  const [activeSection, setActiveSection] = useState<'contact' | 'form' | 'hours'>('contact');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Submit contact form (using TRPC if available)
  const submitContactForm = trpc.widget.submitContactForm?.useMutation({
    onSuccess: () => {
      setFormStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
    },
    onError: () => {
      setFormStatus('error');
    }
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      if (submitContactForm) {
        await submitContactForm.mutateAsync(formData);
      } else {
        // Fallback: simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFormStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      setFormStatus('error');
    }
  };

  const updateFormData = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get current business status
  const getBusinessStatus = () => {
    if (!organizationConfig.businessHours) return null;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const todaySchedule = organizationConfig.businessHours.schedule.find(
      schedule => schedule.day === currentDay
    );

    if (!todaySchedule || todaySchedule.closed) {
      return { isOpen: false, status: 'Closed today' };
    }

    // Simple time comparison (could be enhanced with proper timezone handling)
    const currentHour = now.getHours();
    const openHour = parseInt(todaySchedule.open.split(':')[0]);
    const closeHour = parseInt(todaySchedule.close.split(':')[0]);

    const isOpen = currentHour >= openHour && currentHour < closeHour;
    
    return {
      isOpen,
      status: isOpen ? 'Open now' : 'Closed',
      hours: `${todaySchedule.open} - ${todaySchedule.close}`
    };
  };

  const businessStatus = getBusinessStatus();

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <ChatCircle className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Get Help</h2>
        </div>

        {/* Section Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('contact')}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeSection === 'contact' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Contact
          </button>
          <button
            onClick={() => setActiveSection('form')}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeSection === 'form' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Send Message
          </button>
          <button
            onClick={() => setActiveSection('hours')}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeSection === 'hours' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Hours
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Contact Information */}
            {activeSection === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Live Chat Option */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ChatCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Live Chat</h3>
                      <p className="text-sm text-green-700">
                        {businessStatus?.isOpen ? 'Available now' : 'Currently offline'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={onStartChat} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Start Chat
                  </Button>
                </div>

                {/* Contact Methods */}
                <div className="space-y-3">
                  {organizationConfig.phone && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <a 
                          href={`tel:${organizationConfig.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {organizationConfig.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {organizationConfig.email && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Envelope className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <a 
                          href={`mailto:${organizationConfig.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {organizationConfig.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {organizationConfig.website && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Website</div>
                        <a 
                          href={organizationConfig.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Visit our website
                        </a>
                      </div>
                    </div>
                  )}

                  {organizationConfig.address && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Address</div>
                        <div className="text-sm text-gray-600">
                          {organizationConfig.address}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Contact Form */}
            {activeSection === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {formStatus === 'success' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">Message Sent!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We'll get back to you as soon as possible.
                    </p>
                    <Button 
                      onClick={() => setFormStatus('idle')} 
                      variant="outline" 
                      size="sm"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          required
                          disabled={formStatus === 'submitting'}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          required
                          disabled={formStatus === 'submitting'}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => updateFormData('subject', e.target.value)}
                        required
                        disabled={formStatus === 'submitting'}
                        className="h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => updateFormData('priority', e.target.value as any)}
                        disabled={formStatus === 'submitting'}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => updateFormData('message', e.target.value)}
                        required
                        disabled={formStatus === 'submitting'}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {formStatus === 'error' && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <Warning className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          Failed to send message. Please try again.
                        </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperPlaneTilt className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </motion.div>
            )}

            {/* Business Hours */}
            {activeSection === 'hours' && (
              <motion.div
                key="hours"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Current Status */}
                {businessStatus && (
                  <div className={cn(
                    'p-4 rounded-lg border',
                    businessStatus.isOpen 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={cn(
                        'h-5 w-5',
                        businessStatus.isOpen ? 'text-green-600' : 'text-gray-500'
                      )} />
                      <span className={cn(
                        'font-medium',
                        businessStatus.isOpen ? 'text-green-900' : 'text-gray-900'
                      )}>
                        {businessStatus.status}
                      </span>
                    </div>
                    {businessStatus.hours && (
                      <p className="text-sm text-gray-600">
                        Today: {businessStatus.hours}
                      </p>
                    )}
                  </div>
                )}

                {/* Weekly Schedule */}
                {organizationConfig.businessHours && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Business Hours</h3>
                    <div className="space-y-1">
                      {organizationConfig.businessHours.schedule.map((schedule) => (
                        <div key={schedule.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm font-medium text-gray-700">
                            {schedule.day}
                          </span>
                          <span className="text-sm text-gray-600">
                            {schedule.closed ? 'Closed' : `${schedule.open} - ${schedule.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Times shown in {organizationConfig.businessHours.timezone}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Need immediate assistance?
          </p>
          <Button onClick={onStartChat} className="w-full bg-green-600 hover:bg-green-700" size="sm">
            <ChatCircle className="h-4 w-4 mr-2" />
            Start Live Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
