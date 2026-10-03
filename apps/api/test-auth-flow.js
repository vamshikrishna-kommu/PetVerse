async function run() {
  let cookie = '';
  let accessToken = '';
  
  const email = `test.user.${Date.now()}@example.com`;
  const baseUrl = 'http://localhost:3000/api/v1';
  
  console.log(`\n--- 1. Registering new user (${email}) ---`);
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: 'StrongPassword123!',
      })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    console.log('Registration Successful!', !!data.data.accessToken);
    accessToken = data.data.accessToken;
    cookie = res.headers.get('set-cookie') || '';
    console.log('Refresh Cookie Received:', !!cookie);
  } catch (err) {
    console.error('Registration Failed:', err);
    return;
  }

  console.log('\n--- 2. Fetching User Profile (Me) ---');
  try {
    const res = await fetch(`${baseUrl}/users/me`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw data;
    console.log('Profile Fetched:', data.data.email === email ? 'SUCCESS' : 'MISMATCH');
  } catch (err) {
    console.error('Fetch Profile Failed:', err);
  }

  console.log('\n--- 3. Logging Out ---');
  try {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookie
      }
    });
    if (!res.ok) throw await res.json();
    console.log('Logout Successful');
  } catch (err) {
    console.error('Logout Failed:', err);
  }

  console.log('\n--- 4. Logging In ---');
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'StrongPassword123!',
      })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    console.log('Login Successful!', !!data.data.accessToken);
    accessToken = data.data.accessToken;
    cookie = res.headers.get('set-cookie') || '';
  } catch (err) {
    console.error('Login Failed:', err);
    return;
  }

  console.log('\n--- 5. Testing Refresh Token ---');
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    if (!res.ok) throw data;
    console.log('Refresh Successful! New token received:', !!data.data.accessToken);
  } catch (err) {
    console.error('Refresh Failed:', err);
  }
}

run();
