/**
 * Test script to understand Gmail API calls
 * 
 * Run with: npx tsx scripts/test-gmail-api.ts
 * 
 * This shows you exactly what API calls are being made
 */

import { google } from "googleapis";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

async function testGmailAPI() {
  console.log("🔍 Gmail API Test Script\n");
  console.log("=" .repeat(50));

  // Step 1: Create OAuth2 client
  console.log("\n1️⃣ Creating OAuth2 client...");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  console.log("   ✅ Client ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...");
  console.log("   ✅ Redirect URI:", process.env.GOOGLE_REDIRECT_URI);

  // Step 2: Generate auth URL
  console.log("\n2️⃣ Generating OAuth URL...");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    prompt: "consent",
  });

  console.log("   📋 Auth URL generated:");
  console.log("   ", authUrl.substring(0, 100) + "...");
  console.log("\n   👆 Visit this URL to authorize");
  console.log("   👆 After authorization, you'll get redirected with a code");

  // Step 3: Get the code from user
  console.log("\n3️⃣ After authorization, you'll be redirected to:");
  console.log("   ", process.env.GOOGLE_REDIRECT_URI);
  console.log("   📝 Copy the 'code' parameter from the URL");
  
  // For demonstration, we'll show what happens next
  console.log("\n4️⃣ Once you have the code, exchange it for a token:");
  console.log(`
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
  `);

  console.log("\n5️⃣ Use the access token to call Gmail API:");
  console.log(`
    oauth2Client.setCredentials({ access_token: tokens.access_token });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    // List messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
      q: "is:unread OR in:inbox"
    });
    
    console.log("Messages:", response.data.messages);
  `);

  console.log("\n" + "=".repeat(50));
  console.log("\n📚 See GMAIL_API_GUIDE.md for full details");
  console.log("🚀 Or test the actual flow by running: npm run dev");
}

// Run the test
testGmailAPI().catch(console.error);

