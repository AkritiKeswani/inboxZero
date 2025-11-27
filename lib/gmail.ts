import { google } from "googleapis";
import { Email } from "@/types";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getAuthClient(redirectUri?: string) {
  // Use provided redirectUri, or fall back to env var, or construct from request
  const redirect = redirectUri || process.env.GOOGLE_REDIRECT_URI;
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect
  );

  return oauth2Client;
}

export function getAuthUrl(redirectUri?: string): string {
  const oauth2Client = getAuthClient(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getGmailClient(accessToken: string) {
  const oauth2Client = getAuthClient(); // Redirect URI not needed for API calls, only for auth flow
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Refresh an expired access token using a refresh token
 * Note: This requires storing refresh tokens securely (database recommended)
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const oauth2Client = getAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw new Error("Token refresh failed. Please reconnect your account.");
  }
}

/**
 * Recursively extract text from email parts (handles nested multipart)
 */
function extractBodyFromParts(parts: any[]): { text: string; html: string } {
  let text = "";
  let html = "";

  for (const part of parts) {
    if (part.parts) {
      // Recursively handle nested parts
      const nested = extractBodyFromParts(part.parts);
      text += nested.text;
      html += nested.html;
    } else if (part.body?.data) {
      const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
      if (part.mimeType === "text/plain") {
        text += decoded;
      } else if (part.mimeType === "text/html") {
        html += decoded;
      }
    }
  }

  return { text, html };
}

/**
 * Extract plain text from HTML (simple strip, can be enhanced with a library)
 */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export async function fetchEmails(
  accessToken: string,
  maxResults: number = 50,
  query?: string
): Promise<Email[]> {
  try {
    const gmail = await getGmailClient(accessToken);

    // Default query: unread or in inbox, but allow custom queries
    const emailQuery = query || "is:unread OR in:inbox";

  // Fetch most recent emails, prioritizing unread and recent
  // Note: Gmail API returns messages sorted by internalDate by default (newest first)
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: emailQuery,
  });

    const messages = response.data.messages || [];
    const emails: Email[] = [];

    // Process messages sequentially with small delays to avoid rate limits
    // Gmail API allows 250 quota units/second, each message.get() uses 5 units
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Add delay between Gmail API calls (50ms = ~20 calls/second, well under limit)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const processMessage = async () => {
        if (!message.id) return null;

        try {
          const messageData = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
          });

          const payload = messageData.data.payload;
          if (!payload) return null;

          const headers = payload.headers || [];
          const fromHeader = headers.find((h) => h.name === "From");
          const subjectHeader = headers.find((h) => h.name === "Subject");
          const dateHeader = headers.find((h) => h.name === "Date");

          const from = fromHeader?.value || "";
          const subject = subjectHeader?.value || "";
          const date = dateHeader?.value
            ? new Date(dateHeader.value)
            : new Date();
          const snippet = messageData.data.snippet || "";

          // Extract body text - handle both simple and multipart emails
          let body = "";
          let bodyText = "";
          let bodyHtml = "";

          if (payload.body?.data) {
            // Simple email (not multipart)
            bodyText = Buffer.from(payload.body.data, "base64").toString(
              "utf-8"
            );
          } else if (payload.parts) {
            // Multipart email - extract from all parts
            const extracted = extractBodyFromParts(payload.parts);
            bodyText = extracted.text;
            bodyHtml = extracted.html;
          }

          // Prefer plain text, fallback to HTML converted to text
          body = bodyText || (bodyHtml ? htmlToText(bodyHtml) : "");

          // Check if it's a LinkedIn notification
          const isLinkedInNotification =
            from.includes("linkedin.com") ||
            from.includes("via LinkedIn") ||
            from.includes("noreply@linkedin.com") ||
            body.includes("linkedin.com") ||
            subject.toLowerCase().includes("linkedin");

          // Extract LinkedIn profile URL if present (check both body and HTML)
          let linkedInProfileUrl: string | undefined;
          const searchText = body + " " + bodyHtml;
          if (isLinkedInNotification) {
            const linkedInMatch = searchText.match(
              /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i
            );
            if (linkedInMatch) {
              linkedInProfileUrl = linkedInMatch[0];
            }
          }

          // Extract name from "Name <email@domain.com>" format
          const fromMatch = from.match(/^(.+?)\s*<(.+)>$/);
          const fromName = fromMatch
            ? fromMatch[1].replace(/"/g, "").trim()
            : from;

          return {
            id: message.id,
            threadId: message.threadId || "",
            from: fromMatch ? fromMatch[2] : from,
            fromName,
            subject,
            body,
            date,
            snippet,
            isLinkedInNotification,
            linkedInProfileUrl,
          };
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      };

      const result = await processMessage();
      if (result) {
        emails.push(result);
      }
    }

    return emails;
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    
    // Provide helpful error messages
    if (error.code === 401) {
      throw new Error(
        "Authentication failed. Please reconnect your Google account."
      );
    } else if (error.code === 403) {
      throw new Error(
        "Permission denied. Make sure Gmail API is enabled and you've authorized the app."
      );
    } else if (error.code === 429) {
      throw new Error(
        "Rate limit exceeded. Please wait a moment and try again."
      );
    }
    
    throw new Error(`Failed to fetch emails: ${error.message || "Unknown error"}`);
  }
}

