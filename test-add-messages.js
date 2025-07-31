// Test script to add sample messages to conversations
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleMessages() {
  try {
    console.log('Fetching conversations...');
    
    // Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, customer_name, customer_email')
      .limit(5);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return;
    }

    console.log(`Found ${conversations.length} conversations`);

    // Sample messages for each conversation
    const sampleMessages = [
      "Hi there! I have a question about your product.",
      "Thanks for getting back to me so quickly!",
      "I'm having trouble with the login process.",
      "Can you help me with my order?",
      "The widget isn't working as expected."
    ];

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      const message = sampleMessages[i % sampleMessages.length];
      
      console.log(`Adding message to conversation ${conversation.id}: "${message}"`);
      
      // Add a message to the conversation
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: message,
          sender_type: 'visitor',
          sender_name: conversation.customer_name || 'Visitor',
          sender_email: conversation.customer_email || 'visitor@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (msgError) {
        console.error(`Error adding message to conversation ${conversation.id}:`, msgError);
      } else {
        console.log(`✅ Added message: "${message}"`);
      }
    }

    console.log('Sample messages added successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
addSampleMessages(); 