// Test script to verify ADMINDGB login returns complete profile
const fetch = require("node-fetch");

async function testLogin() {
  try {
    const response = await fetch("http://localhost:3002/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "ADMINDGB",
        password: "bebas123",
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Login successful!");
      console.log("📋 Complete Profile Data:");
      console.log(JSON.stringify(data.data.profile, null, 2));
    } else {
      console.log("❌ Login failed:", data.message);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testLogin();
