"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link, Code, Quote, ListBullets, ListNumbers } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface MessageFormatterProps {
  content: string;
  enableFormatting?: boolean;
  enableLinks?: boolean;
  enableMentions?: boolean;
  enableCodeBlocks?: boolean;
  className?: string;
  onMentionClick?: (userId: string) => void;
  onLinkClick?: (url: string) => void;
}

// Regex patterns for message formatting
const PATTERNS = {
  // URLs (basic pattern)
  url: /(https?:\/\/[^\s]+)/g,
  // Email addresses
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // Mentions (@username)
  mention: /@([a-zA-Z0-9_]+)/g,
  // Bold text (**text**)
  bold: /\*\*(.*?)\*\*/g,
  // Italic text (*text*)
  italic: /\*(.*?)\*/g,
  // Code inline (`code`)
  inlineCode: /`([^`]+)`/g,
  // Code blocks (```code```)
  codeBlock: /```([\s\S]*?)```/g,
  // Strikethrough (~~text~~)
  strikethrough: /~~(.*?)~~/g,
  // Underline (__text__)
  underline: /__(.*?)__/g,
  // Blockquotes (> text)
  blockquote: /^>\s(.+)$/gm,
  // Lists
  unorderedList: /^[-*+]\s(.+)$/gm,
  orderedList: /^\d+\.\s(.+)$/gm,
  // Line breaks
  lineBreak: /\n/g,
};

interface FormattedSegment {
  type: 'text' | 'url' | 'email' | 'mention' | 'bold' | 'italic' | 'code' | 'codeBlock' | 'strikethrough' | 'underline' | 'blockquote' | 'list' | 'break';
  content: string;
  data?: unknown;
}

export function MessageFormatter({
  content,
  enableFormatting = true,
  enableLinks = true,
  enableMentions = true,
  enableCodeBlocks = true,
  className,
  onMentionClick,
  onLinkClick,
}: MessageFormatterProps) {
  // Parse content into formatted segments
  const parseContent = (text: string): FormattedSegment[] => {
    if (!enableFormatting) {
      return [{ type: 'text', content: text }];
    }

    const segments: FormattedSegment[] = [];
    let remaining = text;
    let position = 0;

    // Process code blocks first (they should not be processed further)
    if (enableCodeBlocks) {
      const codeBlockMatches = Array.from(remaining.matchAll(PATTERNS.codeBlock));
      if (codeBlockMatches.length > 0) {
        let lastIndex = 0;
        
        codeBlockMatches.forEach((match) => {
          const beforeCode = remaining.slice(lastIndex, match.index);
          if (beforeCode) {
            segments.push(...parseInlineFormatting(beforeCode));
          }
          
          segments.push({
            type: 'codeBlock',
            content: match[1].trim(),
          });
          
          lastIndex = (match.index || 0) + match[0].length;
        });
        
        const afterCode = remaining.slice(lastIndex);
        if (afterCode) {
          segments.push(...parseInlineFormatting(afterCode));
        }
        
        return segments;
      }
    }

    return parseInlineFormatting(remaining);
  };

  // Parse inline formatting (everything except code blocks)
  const parseInlineFormatting = (text: string): FormattedSegment[] => {
    const segments: FormattedSegment[] = [];
    let remaining = text;

    // Split by line breaks first
    const lines = remaining.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        segments.push({ type: 'break', content: '\n' });
      }

      // Check for blockquotes
      const blockquoteMatch = line.match(/^>\s(.+)$/);
      if (blockquoteMatch) {
        segments.push({
          type: 'blockquote',
          content: blockquoteMatch[1],
        });
        return;
      }

      // Check for lists
      const unorderedMatch = line.match(/^[-*+]\s(.+)$/);
      if (unorderedMatch) {
        segments.push({
          type: 'list',
          content: unorderedMatch[1],
          data: { ordered: false },
        });
        return;
      }

      const orderedMatch = line.match(/^\d+\.\s(.+)$/);
      if (orderedMatch) {
        segments.push({
          type: 'list',
          content: orderedMatch[1],
          data: { ordered: true },
        });
        return;
      }

      // Parse inline formatting for regular lines
      segments.push(...parseInlineElements(line));
    });

    return segments;
  };

  // Parse inline elements (bold, italic, links, etc.)
  const parseInlineElements = (text: string): FormattedSegment[] => {
    const segments: FormattedSegment[] = [];
    let remaining = text;
    let lastIndex = 0;

    // Define patterns in order of precedence
    const patterns = [
      { pattern: PATTERNS.inlineCode, type: 'code' as const },
      { pattern: PATTERNS.url, type: 'url' as const },
      { pattern: PATTERNS.email, type: 'email' as const },
      { pattern: PATTERNS.mention, type: 'mention' as const },
      { pattern: PATTERNS.bold, type: 'bold' as const },
      { pattern: PATTERNS.italic, type: 'italic' as const },
      { pattern: PATTERNS.strikethrough, type: 'strikethrough' as const },
      { pattern: PATTERNS.underline, type: 'underline' as const },
    ];

    // Find all matches
    const allMatches: Array<{ match: RegExpMatchArray; type: string; index: number }> = [];
    
    patterns.forEach(({ pattern, type }) => {
      const matches = Array.from(remaining.matchAll(pattern));
      matches.forEach((match) => {
        if (match.index !== undefined) {
          allMatches.push({ match, type, index: match.index });
        }
      });
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.index - b.index);

    // Process matches
    allMatches.forEach(({ match, type, index }) => {
      // Add text before this match
      if (index > lastIndex) {
        const beforeText = remaining.slice(lastIndex, index);
        if (beforeText) {
          segments.push({ type: 'text', content: beforeText });
        }
      }

      // Add the formatted segment
      const content = type === 'mention' ? match[1] : (match[1] || match[0]);
      segments.push({
        type: type as FormattedSegment['type'],
        content,
        data: type === 'mention' ? { userId: match[1] } : undefined,
      });

      lastIndex = index + match[0].length;
    });

    // Add remaining text
    if (lastIndex < remaining.length) {
      const remainingText = remaining.slice(lastIndex);
      if (remainingText) {
        segments.push({ type: 'text', content: remainingText });
      }
    }

    // If no matches found, return the original text
    if (segments.length === 0) {
      segments.push({ type: 'text', content: remaining });
    }

    return segments;
  };

  // Render a formatted segment
  const renderSegment = (segment: FormattedSegment, index: number) => {
    const key = `segment-${index}`;

    switch (segment.type) {
      case 'url':
        if (!enableLinks) return segment.content;
        return (
          <motion.a
            key={key}
            href={segment.content}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onLinkClick) {
                e.preventDefault();
                onLinkClick(segment.content);
              }
            }}
            className="text-blue-500 hover:text-blue-600 underline transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {segment.content}
          </motion.a>
        );

      case 'email':
        if (!enableLinks) return segment.content;
        return (
          <a
            key={key}
            href={`mailto:${segment.content}`}
            className="text-blue-500 hover:text-blue-600 underline transition-colors"
          >
            {segment.content}
          </a>
        );

      case 'mention':
        if (!enableMentions) return `@${segment.content}`;
        return (
          <motion.button
            key={key}
            onClick={() => onMentionClick?.(segment.data?.userId)}
            className="text-blue-600 bg-blue-100 px-1 rounded font-medium hover:bg-blue-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            @{segment.content}
          </motion.button>
        );

      case 'bold':
        return <strong key={key} className="font-bold">{segment.content}</strong>;

      case 'italic':
        return <em key={key} className="italic">{segment.content}</em>;

      case 'code':
        return (
          <code
            key={key}
            className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {segment.content}
          </code>
        );

      case 'codeBlock':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto"
          >
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
              <Code className="h-3 w-3" />
              <span>Code</span>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {segment.content}
            </pre>
          </motion.div>
        );

      case 'strikethrough':
        return <del key={key} className="line-through opacity-75">{segment.content}</del>;

      case 'underline':
        return <u key={key} className="underline">{segment.content}</u>;

      case 'blockquote':
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="border-l-4 border-gray-300 pl-4 py-2 my-2 bg-gray-50 rounded-r"
          >
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 italic">{segment.content}</span>
            </div>
          </motion.div>
        );

      case 'list':
        const ListIcon = segment.data?.ordered ? ListNumbers : ListBullets;
        return (
          <div key={key} className="flex items-start gap-2 my-1">
            <ListIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{segment.content}</span>
          </div>
        );

      case 'break':
        return <br key={key} />;

      case 'text':
      default:
        return <span key={key}>{segment.content}</span>;
    }
  };

  const segments = parseContent(content);

  return (
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      {segments.map(renderSegment)}
    </div>
  );
}

// Simple text formatter for basic use cases
export function SimpleTextFormatter({ 
  content, 
  className 
}: { 
  content: string; 
  className?: string; 
}) {
  return (
    <MessageFormatter
      content={content}
      enableFormatting={true}
      enableLinks={true}
      enableMentions={false}
      enableCodeBlocks={false}
      className={className}
    />
  );
}
