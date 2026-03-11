
async function main() {
  const uzapiUrl = 'http://localhost:21465';
  const adminToken = 'admin_token_123';
  
  console.log(`Checking admin/users at ${uzapiUrl} with token ${adminToken}`);
  
  try {
    const res = await fetch(`${uzapiUrl}/admin/users`, {
      headers: { 'Authorization': adminToken }
    });
    
    console.log('Admin List Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Raw Response:', text.substring(0, 500));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
