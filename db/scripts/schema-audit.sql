-- Comprehensive Database Schema Audit Script
-- This script identifies mismatches between Drizzle schema and actual database

-- 1. Check if mailboxes table exists and its structure
SELECT 
  'mailboxes_table_check' as audit_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mailboxes') 
    THEN 'mailboxes table exists'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mailboxes_mailbox')
    THEN 'mailboxes_mailbox table exists (old name)'
    ELSE 'NO MAILBOXES TABLE FOUND'
  END as status;

-- 2. Check mailboxes table columns
SELECT 
  'mailboxes_columns' as audit_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('mailboxes', 'mailboxes_mailbox')
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for gmail_support_email_id column specifically
SELECT 
  'gmail_support_email_id_check' as audit_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name IN ('mailboxes', 'mailboxes_mailbox')
      AND column_name = 'gmail_support_email_id'
    ) THEN 'gmail_support_email_id column EXISTS'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name IN ('mailboxes', 'mailboxes_mailbox')
      AND column_name = 'gmailSupportEmailId'
    ) THEN 'gmailSupportEmailId column EXISTS (camelCase)'
    ELSE 'gmail_support_email_id column MISSING'
  END as status;

-- 4. Check gmailsupportemail table
SELECT 
  'gmail_support_emails_table_check' as audit_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mailboxes_gmailsupportemail') 
    THEN 'mailboxes_gmailsupportemail table exists'
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gmail_support_emails')
    THEN 'gmail_support_emails table exists'
    ELSE 'NO GMAIL SUPPORT EMAILS TABLE FOUND'
  END as status;

-- 5. Check foreign key constraints
SELECT 
  'foreign_key_check' as audit_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('mailboxes', 'mailboxes_mailbox')
  AND kcu.column_name LIKE '%gmail%';

-- 6. Check all tables that might be affected by naming conventions
SELECT 
  'table_naming_audit' as audit_type,
  table_name,
  CASE 
    WHEN table_name LIKE '%_mailbox%' THEN 'Legacy naming pattern'
    WHEN table_name LIKE 'mailboxes_%' THEN 'Prefixed naming pattern'
    ELSE 'Modern naming pattern'
  END as naming_pattern
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%mailbox%' OR table_name LIKE '%gmail%')
ORDER BY table_name;

-- 7. Check for camelCase vs snake_case column mismatches
SELECT 
  'column_naming_audit' as audit_type,
  table_name,
  column_name,
  CASE 
    WHEN column_name ~ '[A-Z]' THEN 'camelCase detected'
    WHEN column_name ~ '_' THEN 'snake_case'
    ELSE 'lowercase'
  END as naming_convention
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN ('mailboxes', 'mailboxes_mailbox', 'mailboxes_gmailsupportemail', 'gmail_support_emails')
ORDER BY table_name, column_name;

-- 8. Check organization_id columns across tables
SELECT 
  'organization_id_audit' as audit_type,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND column_name IN ('organization_id', 'organizationId', 'clerk_organization_id')
ORDER BY table_name;
