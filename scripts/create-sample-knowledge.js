/**
 * Script to create sample knowledge documents in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvntokkncxbhapqjesti.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NTE1NCwiZXhwIjoyMDYwMDYxMTU0fQ.JSWc3lQWc3qKQaju1gGu7MSLhZn41DDd24n5Ojm0KLQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleDocuments = [
  {
    organization_id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    title: 'Getting Started with Customer Support',
    content: 'This comprehensive guide covers the fundamentals of providing excellent customer support, including communication best practices, escalation procedures, and common troubleshooting steps. Learn how to handle customer inquiries professionally, manage difficult situations, and ensure customer satisfaction.',
    content_type: 'guide',
    category: 'Support Basics',
    tags: ['onboarding', 'support', 'basics', 'customer service'],
    is_public: true,
    isActive: true,
    metadata: { 
      priority: 'high',
      difficulty: 'beginner',
      estimated_read_time: '10 minutes'
    }
  },
  {
    organization_id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    title: 'Frequently Asked Questions',
    content: 'Common questions and answers about our products and services, including billing, technical support, and account management. This FAQ covers the most frequent customer inquiries and provides standardized responses to ensure consistency across all support interactions.',
    content_type: 'faq',
    category: 'General',
    tags: ['faq', 'common', 'questions', 'billing', 'technical'],
    is_public: true,
    isActive: true,
    metadata: { 
      priority: 'medium',
      difficulty: 'beginner',
      estimated_read_time: '5 minutes'
    }
  },
  {
    organization_id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    title: 'Escalation Procedures',
    content: 'Step-by-step procedures for escalating customer issues to appropriate teams, including severity levels and response time expectations. This policy document outlines when and how to escalate issues, who to contact, and what information to provide.',
    content_type: 'policy',
    category: 'Policies',
    tags: ['escalation', 'procedures', 'policy', 'management'],
    is_public: true,
    isActive: true,
    metadata: { 
      priority: 'high',
      difficulty: 'intermediate',
      estimated_read_time: '8 minutes'
    }
  },
  {
    organization_id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    title: 'Product Feature Documentation',
    content: 'Detailed documentation of all product features, including setup instructions, configuration options, and troubleshooting tips. This comprehensive manual covers every aspect of our product to help support agents provide accurate information to customers.',
    content_type: 'article',
    category: 'Product',
    tags: ['product', 'features', 'documentation', 'manual'],
    is_public: false,
    isActive: false,
    metadata: { 
      priority: 'medium',
      difficulty: 'advanced',
      estimated_read_time: '15 minutes'
    }
  },
  {
    organization_id: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
    title: 'Handling Difficult Customers',
    content: 'Strategies and techniques for managing challenging customer interactions with empathy and professionalism. Learn de-escalation techniques, active listening skills, and how to turn negative experiences into positive outcomes.',
    content_type: 'guide',
    category: 'Advanced Support',
    tags: ['difficult customers', 'de-escalation', 'communication', 'psychology'],
    is_public: true,
    isActive: true,
    metadata: { 
      priority: 'high',
      difficulty: 'advanced',
      estimated_read_time: '12 minutes'
    }
  }
];

async function createSampleDocuments() {
  console.log('🚀 Creating sample knowledge documents...');
  
  try {
    // First, check if documents already exist
    const { data: existingDocs, error: checkError } = await supabase
      .from('knowledge_documents')
      .select('id, title')
      .eq('organization_id', 'b5e80170-004c-4e82-a88c-3e2166b169dd');

    if (checkError) {
      console.error('❌ Error checking existing documents:', checkError);
      return;
    }

    if (existingDocs && existingDocs.length > 0) {
      console.log(`📚 Found ${existingDocs.length} existing documents:`);
      existingDocs.forEach(doc => console.log(`   - ${doc.title}`));
      console.log('✅ Sample documents already exist, skipping creation.');
      return;
    }

    // Create new documents
    for (const doc of sampleDocuments) {
      console.log(`📝 Creating: ${doc.title}...`);
      
      const { data, error } = await supabase
        .from('knowledge_documents')
        .insert(doc)
        .select('id, title, content_type, is_active');
      
      if (error) {
        console.error(`❌ Error creating "${doc.title}":`, error.message);
      } else {
        const created = data[0];
        console.log(`✅ Created: ${created.title} (${created.content_type}, ${created.isActive ? 'active' : 'draft'})`);
      }
    }

    console.log('\n🎉 Sample knowledge documents created successfully!');
    
    // Verify creation
    const { data: finalDocs, error: finalError } = await supabase
      .from('knowledge_documents')
      .select('id, title, content_type, is_active')
      .eq('organization_id', 'b5e80170-004c-4e82-a88c-3e2166b169dd');

    if (finalError) {
      console.error('❌ Error verifying documents:', finalError);
    } else {
      console.log(`\n📊 Total documents in database: ${finalDocs.length}`);
      console.log('   Active:', finalDocs.filter(d => d.isActive).length);
      console.log('   Draft:', finalDocs.filter(d => !d.isActive).length);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createSampleDocuments()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
