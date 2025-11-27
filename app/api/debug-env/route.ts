import { NextResponse } from "next/server";

/**
 * Debug endpoint to check if environment variables are loaded
 * Visit: http://localhost:3000/api/debug-env
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  return NextResponse.json({
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRedirectUri: !!redirectUri,
    clientIdValue: clientId?.includes("your_") || clientId?.includes("placeholder")
      ? "❌ PLACEHOLDER VALUE - Replace with real Client ID"
      : clientId?.substring(0, 30) + "...",
    clientSecretValue: clientSecret?.includes("your_") || clientSecret?.includes("placeholder")
      ? "❌ PLACEHOLDER VALUE - Replace with real Client Secret"
      : clientSecret ? "✅ Set (hidden)" : "❌ Missing",
    redirectUri: redirectUri || "❌ Missing",
    status: clientId && clientSecret && redirectUri && 
            !clientId.includes("your_") && !clientSecret.includes("your_")
      ? "✅ Ready"
      : "❌ Not configured - See OAUTH_TROUBLESHOOTING.md",
  });
}

