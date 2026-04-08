const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gsasnspvhmsdwyvcyuwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYXNuc3B2aG1zZHd5dmN5dXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDY1NDksImV4cCI6MjA5MTEyMjU0OX0.kTgO3tVFuIW-CiMeQ9GchyD4_0F8D8hmDSQcC0dkFVM';

const supabase = createClient(supabaseUrl, supabaseKey);

const engineers = [
  { email: 'sarah.jenkins@sitemaster.com', password: 'SiteMaster123!', full_name: 'Sarah Jenkins' },
  { email: 'arjun.mehta@sitemaster.com', password: 'SiteMaster123!', full_name: 'Arjun Mehta' },
  { email: 'viktor.volkov@sitemaster.com', password: 'SiteMaster123!', full_name: 'Viktor Volkov' }
];

async function register() {
  for (const eng of engineers) {
    console.log(`Registering ${eng.full_name}...`);
    const { data, error } = await supabase.auth.signUp({
      email: eng.email,
      password: eng.password,
      options: {
        data: { full_name: eng.full_name, role: 'engineer' }
      }
    });

    if (error) {
       // If user already exists, we'll confirm them anyway in the next step
       console.log(`Note for ${eng.email}: ${error.message}`);
    } else {
       console.log(`SUCCESS: Registered ${eng.email}`);
    }
  }
}

register();
