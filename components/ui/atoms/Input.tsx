/**
 * Input Atom - Atomic Design System
 * 
 * Fundamental form input element with consistent styling and behavior.
 * Supports various input types, states, and accessibility features.
 */

'use client';

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

// ============================================================================
// INPUT VARIANTS
// ============================================================================

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-background px-3 py-2',
    'text-sm placeholder:text-muted-foreground',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-input',
          'focus-visible:ring-ring',
        ],
        error: [
          'border-destructive',
          'focus-visible:ring-destructive',
        ],
        success: [
          'border-green-500',
          'focus-visible:ring-green-500',
        ],
      },
      
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3',
        lg: 'h-11 px-4',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  success?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      leftIcon,
      rightIcon,
      error,
      success,
      helperText,
      label,
      required,
      showPasswordToggle = false,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;
    
    // Determine variant based on state
    const currentVariant = error ? 'error' : success ? 'success' : variant;
    
    // Determine if we need right icon space
    const hasRightContent = rightIcon || (isPassword && showPasswordToggle) || error || success;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-destructive' : 'text-foreground'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input Element */}
          <input
            type={actualType}
            id={inputId}
            ref={ref}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              leftIcon && 'pl-10',
              hasRightContent && 'pr-10',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right Content */}
          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Success Icon */}
              {success && !error && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              
              {/* Error Icon */}
              {error && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              
              {/* Password Toggle */}
              {isPassword && showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground',
                    'transition-colors duration-200',
                    'focus:outline-none focus:text-foreground'
                  )}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Custom Right Icon */}
              {rightIcon && !error && !success && (
                <span className="text-muted-foreground">
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Helper Text / Error / Success Message */}
        {(helperText || error || success) && (
          <div className="mt-1 text-xs">
            {error && (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </span>
            )}
            
            {success && !error && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {success}
              </span>
            )}
            
            {helperText && !error && !success && (
              <span className="text-muted-foreground">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };

// ============================================================================
// SEARCH INPUT COMPONENT
// ============================================================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, value, ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          hasValue && showClearButton && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        value={value}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      success,
      helperText,
      label,
      required,
      resize = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-destructive' : 'text-foreground'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2',
            'text-sm placeholder:text-muted-foreground',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-ring',
            success && !error ? 'border-green-500 focus-visible:ring-green-500' : '',
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            resize === 'both' && 'resize',
            className
          )}
          {...props}
        />

        {/* Helper Text / Error / Success Message */}
        {(helperText || error || success) && (
          <div className="mt-1 text-xs">
            {error && (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </span>
            )}
            
            {success && !error && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {success}
              </span>
            )}
            
            {helperText && !error && !success && (
              <span className="text-muted-foreground">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic input
<Input placeholder="Enter your name" />

// With label
<Input 
  label="Email Address" 
  type="email" 
  placeholder="you@example.com"
  required
/>

// With icons
<Input 
  leftIcon={<Mail className="h-4 w-4" />}
  placeholder="Email"
/>

// Password input with toggle
<Input 
  type="password"
  label="Password"
  showPasswordToggle
  placeholder="Enter password"
/>

// With error state
<Input 
  label="Username"
  error="Username is already taken"
  value="invalid-username"
/>

// With success state
<Input 
  label="Username"
  success="Username is available"
  value="valid-username"
/>

// Search input
<SearchInput 
  placeholder="Search conversations..."
  onClear={() => setValue('')}
  value={searchValue}
  onChange={(e) => setValue(e.target.value)}
/>

// Textarea
<Textarea 
  label="Message"
  placeholder="Type your message here..."
  rows={4}
  helperText="Maximum 500 characters"
/>

// Different sizes
<Input size="sm" placeholder="Small input" />
<Input size="lg" placeholder="Large input" />
*/

import { Search, X } from 'lucide-react';
