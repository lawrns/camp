"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Article, ChevronDown, CaretRight, Clock, Star } from "lucide-react";
import { cn } from '@/lib/utils';

interface HelpTabProps {
  organizationId: string;
  className?: string;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  helpful_count: number;
  created_at: string;
}

interface KnowledgeCollection {
  id: string;
  name: string;
  description: string;
  articles: KnowledgeArticle[];
}

export const HelpTab: React.FC<HelpTabProps> = ({
  organizationId,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeArticle[]>([]);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch knowledge base collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/widget/knowledge-base?organizationId=${organizationId}`, {
          headers: {
            'X-Organization-ID': organizationId,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections || []);
        } else {
          // Fallback to default collections
          setCollections([
            {
              id: 'getting-started',
              name: 'Getting Started',
              description: 'Basic information to help you get started',
              articles: [
                {
                  id: '1',
                  title: 'How to create an account',
                  content: 'Step-by-step guide to creating your account...',
                  category: 'Getting Started',
                  tags: ['account', 'signup'],
                  helpful_count: 15,
                  created_at: new Date().toISOString()
                },
                {
                  id: '2',
                  title: 'Setting up your profile',
                  content: 'Learn how to customize your profile...',
                  category: 'Getting Started',
                  tags: ['profile', 'setup'],
                  helpful_count: 12,
                  created_at: new Date().toISOString()
                }
              ]
            },
            {
              id: 'billing',
              name: 'Billing & Payments',
              description: 'Information about billing, payments, and subscriptions',
              articles: [
                {
                  id: '3',
                  title: 'Understanding your bill',
                  content: 'Breakdown of charges and billing cycles...',
                  category: 'Billing',
                  tags: ['billing', 'charges'],
                  helpful_count: 8,
                  created_at: new Date().toISOString()
                }
              ]
            }
          ]);
        }
      } catch (error) {
        console.error('[HelpTab] Failed to fetch collections:', error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [organizationId]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await fetch(`/api/widget/knowledge/search?q=${encodeURIComponent(query)}&organizationId=${organizationId}`, {
          headers: {
            'X-Organization-ID': organizationId,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.articles || []);
        } else {
          // Fallback search in local collections
          const allArticles = collections.flatMap(c => c.articles);
          const filtered = allArticles.filter(article => 
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.content.toLowerCase().includes(query.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('[HelpTab] Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [organizationId, collections]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Toggle collection expansion
  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for help articles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          /* Search Results */
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h3>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((article) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {article.content.substring(0, 120)}...
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Star size={12} className="mr-1" />
                            {article.helpful_count} helpful
                          </span>
                          <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatDate(article.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Article size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No articles found for "{searchQuery}"</p>
                <p className="text-sm mt-1">Try different keywords or browse collections below</p>
              </div>
            )}
          </div>
        ) : (
          /* Collections */
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Category</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => {
                  const isExpanded = expandedCollections.has(collection.id);
                  return (
                    <div key={collection.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCollection(collection.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{collection.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                          <span className="text-xs text-gray-500 mt-1">
                            {collection.articles.length} article{collection.articles.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <CaretRight size={16} className="text-gray-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-200 overflow-hidden"
                          >
                            <div className="p-3 space-y-2">
                              {collection.articles.map((article) => (
                                <div
                                  key={article.id}
                                  className="p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                >
                                  <h5 className="text-sm font-medium text-gray-900">{article.title}</h5>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <Star size={10} className="mr-1" />
                                      {article.helpful_count}
                                    </span>
                                    <span>{formatDate(article.created_at)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple debounce utility
function debounce<T extends (...args: unknown[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default HelpTab;
