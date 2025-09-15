const fetch = require("node-fetch");

async function testLogin() {
  try {
    console.log("Testing login...");

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

    const contentType = response.headers.get("content-type");
    console.log("Response status:", response.status);
    console.log("Content-Type:", contentType);

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("Response text:", text);
    }
  } catch (error) {
    console.error("Login test failed:", error.message);
  }
}

testLogin();
