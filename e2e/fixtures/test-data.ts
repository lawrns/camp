export const testUsers = {
  admin: {
    email: 'jam@jam.com',
    password: 'password123',
    name: 'Jam User'
  },
  customer: {
    email: 'customer@campfire.test',
    password: 'testpassword123',
    name: 'Customer User'
  }
};

export const testOrganizations = {
  default: {
    id: 'test-org-123',
    name: 'Test Organization',
    slug: 'test-org'
  }
};

export const testConversations = {
  simple: {
    id: 'test-conv-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    messages: [
      { content: 'Hello, I need help', sender: 'customer' },
      { content: 'Hi John! How can I assist you today?', sender: 'agent' }
    ]
  }
};

export const testMessages = {
  short: 'Hello, this is a test message',
  long: 'This is a very long test message that should test the UI handling of longer content and ensure that the message bubbles and layout work correctly with extended text content.',
  specialChars: 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
  emoji: 'Hello! 👋 How are you? 😊',
  links: 'Check out our website: https://campfire.com and our docs: https://docs.campfire.com'
};
