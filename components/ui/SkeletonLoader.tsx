/**
 * Skeleton Loader Components for Dashboard
 * 
 * Provides consistent loading states that match the actual content structure
 * for better user experience during data loading
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Base skeleton component with animation
 */
const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  width, 
  height 
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200",
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
};

/**
 * Conversation list skeleton loader
 */
export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border-b border-gray-100 p-4">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <Skeleton className="h-10 w-10 rounded-full" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              {/* Name and status */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              
              {/* Email */}
              <Skeleton className="h-3 w-48" />
              
              {/* Message preview */}
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Message list skeleton loader
 */
export const MessageListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-3">
          {/* Avatar */}
          <Skeleton className="h-8 w-8 rounded-full" />
          
          {/* Message content */}
          <div className="flex-1 space-y-2">
            {/* Message header */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            
            {/* Message bubble */}
            <div className="max-w-[70%]">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Dashboard metrics skeleton loader
 */
export const DashboardMetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Header skeleton loader
 */
export const HeaderSkeleton: React.FC = () => {
  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Composer skeleton loader
 */
export const ComposerSkeleton: React.FC = () => {
  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end space-x-2">
        {/* File attachment button */}
        <Skeleton className="h-10 w-10 rounded-lg" />
        
        {/* Message input */}
        <div className="flex-1">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        
        {/* Send button */}
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Customer sidebar skeleton loader
 */
export const CustomerSidebarSkeleton: React.FC = () => {
  return (
    <div className="w-80 border-l border-gray-200 bg-white p-4">
      <div className="space-y-6">
        {/* Customer info */}
        <div className="space-y-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* Customer details */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        
        {/* Tags */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Full dashboard skeleton loader
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation list */}
          <div className="w-80 border-r border-gray-200 bg-white">
            <ConversationListSkeleton />
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Messages */}
            <div className="flex-1">
              <MessageListSkeleton />
            </div>
            
            {/* Composer */}
            <ComposerSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inbox-specific skeleton loader
 */
export const InboxSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <HeaderSkeleton />
        <ConversationListSkeleton />
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1">
          <MessageListSkeleton />
        </div>
        
        {/* Composer */}
        <ComposerSkeleton />
      </div>
    </div>
  );
};

export default Skeleton; 