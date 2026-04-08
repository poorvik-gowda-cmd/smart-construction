const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gsasnspvhmsdwyvcyuwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYXNuc3B2aG1zZHd5dmN5dXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDY1NDksImV4cCI6MjA5MTEyMjU0OX0.kTgO3tVFuIW-CiMeQ9GchyD4_0F8D8hmDSQcC0dkFVM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Testing login for Sarah Jenkins...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'sarah.jenkins@sitemaster.com',
    password: 'SiteMaster123!'
  });

  if (error) {
    console.error('Login FAILED:', error.message);
  } else {
    console.log('Login SUCCESSFUL!');
    console.log('User ID:', data.user.id);
  }
}

testLogin();
