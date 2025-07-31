"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlass, 
  CaretDown, 
  CaretRight, 
  Question, 
  BookOpen,
  Lightbulb,
  Warning
} from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

// FAQ Item interface matching TRPC schema
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
  created_at: string;
}

// Knowledge Base Article interface
interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface WidgetFAQTabProps {
  className?: string;
  onStartChat?: () => void;
}

export function WidgetFAQTab({ className, onStartChat }: WidgetFAQTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'faq' | 'articles'>('faq');

  // Fetch FAQs using TRPC
  const { 
    data: faqs = [], 
    isLoading: faqsLoading, 
    error: faqsError 
  } = trpc.widget.getFAQs.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  // Fetch Knowledge Base articles using TRPC
  const { 
    data: articles = [], 
    isLoading: articlesLoading, 
    error: articlesError 
  } = trpc.widget.getKnowledgeBase.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  // Get unique categories from both FAQs and articles
  const categories = useMemo(() => {
    const faqCategories = faqs.map(faq => faq.category);
    const articleCategories = articles.map(article => article.category);
    const allCategories = [...new Set([...faqCategories, ...articleCategories])];
    return allCategories.filter(Boolean);
  }, [faqs, articles]);

  // Toggle expanded state for FAQ items
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter and sort items based on search relevance
  const filteredFAQs = useMemo(() => {
    if (!searchQuery) return faqs;
    
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [faqs, searchQuery]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [articles, searchQuery]);

  const isLoading = faqsLoading || articlesLoading;
  const hasError = faqsError || articlesError;

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Question className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Help Center</h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="pl-10 h-9"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('faq')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'faq' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'articles' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Articles
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mt-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="text-center py-8">
              <Warning className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">Unable to load help content</h3>
              <p className="text-sm text-gray-600 mb-4">Please try again or contact support.</p>
              <Button onClick={onStartChat} size="sm">
                Start Chat
              </Button>
            </div>
          )}

          {/* FAQ Tab Content */}
          {!isLoading && !hasError && activeTab === 'faq' && (
            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-8">
                  <Question className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No FAQs found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchQuery ? 'Try a different search term' : 'No FAQs available'}
                  </p>
                  <Button onClick={onStartChat} size="sm">
                    Ask a Question
                  </Button>
                </div>
              ) : (
                filteredFAQs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 pr-2">
                        {faq.question}
                      </span>
                      {expandedItems.has(faq.id) ? (
                        <CaretDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <CaretRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedItems.has(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200"
                        >
                          <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                            {faq.answer}
                            
                            {/* Tags */}
                            {faq.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {faq.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Articles Tab Content */}
          {!isLoading && !hasError && activeTab === 'articles' && (
            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No articles found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchQuery ? 'Try a different search term' : 'No articles available'}
                  </p>
                  <Button onClick={onStartChat} size="sm">
                    Get Help
                  </Button>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(article.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.content.substring(0, 150)}...
                        </p>
                        
                        {/* Tags */}
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <BookOpen className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Can't find what you're looking for?
          </p>
          <Button onClick={onStartChat} className="w-full" size="sm">
            <Lightbulb className="h-4 w-4 mr-2" />
            Start a Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
