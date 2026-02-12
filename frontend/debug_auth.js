/**
 * Paste this into browser console (F12) to debug auth state
 */

console.log("=== AUTH DEBUG ===");

// Check localStorage
const auth = localStorage.getItem('auth');
console.log("1. localStorage.getItem('auth'):", auth);

if (auth) {
  try {
    const parsed = JSON.parse(auth);
    console.log("2. Parsed auth object:", parsed);
    console.log("3. Has token?", !!parsed.token);
    console.log("4. Has user?", !!parsed.user);
    if (parsed.user) {
      console.log("5. User details:", {
        id: parsed.user.id,
        email: parsed.user.email,
        name: parsed.user.name,
      });
    }
  } catch (e) {
    console.error("Failed to parse auth:", e);
  }
} else {
  console.warn("❌ No auth data in localStorage!");
  console.log("This means the token wasn't saved after login.");
}

console.log("=== END DEBUG ===");

// Test API call
console.log("\n=== TESTING API CALL ===");
const testAuth = localStorage.getItem('auth');
if (testAuth) {
  const { token } = JSON.parse(testAuth);
  fetch('http://localhost:8000/api/v1/user/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => console.log("✅ API call successful:", data))
  .catch(err => console.error("❌ API call failed:", err));
} else {
  console.log("❌ Cannot test API - no token available");
}
