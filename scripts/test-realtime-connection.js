const { createClient } = require('@supabase/supabase-js');

const url = 'https://yvntokkncxbhapqjesti.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

console.log('🔍 Testing Supabase realtime connection...');

const client = createClient(url, key, {
  realtime: {
    params: { apikey: key },
    timeout: 10000,
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: function(tries) { return Math.min(tries * 1000, 10000); }
  }
});

const channelName = 'test-channel-' + Date.now();
console.log('📡 Creating channel:', channelName);

const channel = client.channel(channelName, {
  config: { broadcast: { self: true } }
});

let connected = false;
let timeout;

channel.on('broadcast', { event: 'test' }, function(payload) {
  console.log('✅ Broadcast received:', payload);
  connected = true;
  clearTimeout(timeout);
  client.removeChannel(channel);
  process.exit(0);
});

channel.subscribe(function(status) {
  console.log('📡 Channel status:', status);
  if (status === 'SUBSCRIBED') {
    console.log('🚀 Sending test broadcast...');
    channel.send({
      type: 'broadcast',
      event: 'test',
      payload: { message: 'Hello from Node.js test' }
    });
  } else if (status === 'CHANNEL_ERROR') {
    console.error('❌ Channel error occurred');
    clearTimeout(timeout);
    process.exit(1);
  } else if (status === 'TIMED_OUT') {
    console.error('❌ Channel subscription timed out');
    clearTimeout(timeout);
    process.exit(1);
  }
});

timeout = setTimeout(function() {
  if (!connected) {
    console.error('❌ Realtime connection test failed - timeout after 15s');
    client.removeChannel(channel);
    process.exit(1);
  }
}, 15000);

console.log('⏳ Waiting for connection...');
