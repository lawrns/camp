const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugOrganizationMembership() {
  console.log('🔍 Debugging Organization Membership\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError);
      return;
    }

    console.log('✅ Login successful:', user.email);
    console.log('User ID:', user.id);
    console.log('Organization ID from metadata:', user.user_metadata?.organization_id);

    // 2. Check organization_members table
    console.log('\n2. Checking organization_members table...');
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('❌ Organization members query error:', membershipError);
    } else {
      console.log('✅ Organization members query successful');
      console.log('   Found memberships:', memberships?.length || 0);
      if (memberships && memberships.length > 0) {
        console.log('   Memberships:', memberships);
      }
    }

    // 3. Check specific organization membership
    const organizationId = user.user_metadata?.organization_id;
    if (organizationId) {
      console.log('\n3. Checking specific organization membership...');
      const { data: specificMembership, error: specificError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();

      if (specificError) {
        console.error('❌ Specific membership query error:', specificError);
      } else {
        console.log('✅ Specific membership found:', specificMembership);
      }
    }

    // 4. Check organizations table
    console.log('\n4. Checking organizations table...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId);

    if (orgError) {
      console.error('❌ Organizations query error:', orgError);
    } else {
      console.log('✅ Organizations query successful');
      console.log('   Found organizations:', organizations?.length || 0);
      if (organizations && organizations.length > 0) {
        console.log('   Organization:', organizations[0]);
      }
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugOrganizationMembership(); 