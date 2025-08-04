"use client";

import { CheckCircle } from 'lucide-react';

export const SocialProof = () => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center space-x-6 bg-white rounded-full px-8 py-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">SOC 2 Compliant</span>
        </div>
        <div className="w-px h-6 bg-gray-300" />
        <div className="flex items-center space-x-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">GDPR Ready</span>
        </div>
        <div className="w-px h-6 bg-gray-300" />
        <div className="flex items-center space-x-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-sm font-medium text-gray-700">99.9% Uptime</span>
        </div>
      </div>
    </div>
  );
};