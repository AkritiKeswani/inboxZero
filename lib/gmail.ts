import { google } from "googleapis";
import { Email } from "@/types";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

export function getAuthUrl(): string {
  const oauth2Client = getAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getGmailClient(accessToken: string) {
  const oauth2Client = getAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function fetchEmails(
  accessToken: string,
  maxResults: number = 50
): Promise<Email[]> {
  const gmail = await getGmailClient(accessToken);

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "is:unread OR in:inbox",
  });

  const messages = response.data.messages || [];
  const emails: Email[] = [];

  for (const message of messages) {
    if (!message.id) continue;

    const messageData = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });

    const payload = messageData.data.payload;
    if (!payload) continue;

    const headers = payload.headers || [];
    const fromHeader = headers.find((h) => h.name === "From");
    const subjectHeader = headers.find((h) => h.name === "Subject");
    const dateHeader = headers.find((h) => h.name === "Date");

    const from = fromHeader?.value || "";
    const subject = subjectHeader?.value || "";
    const date = dateHeader?.value ? new Date(dateHeader.value) : new Date();
    const snippet = messageData.data.snippet || "";

    // Extract body text
    let body = "";
    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        }
      }
    }

    // Check if it's a LinkedIn notification
    const isLinkedInNotification =
      from.includes("linkedin.com") ||
      from.includes("via LinkedIn") ||
      body.includes("linkedin.com") ||
      subject.toLowerCase().includes("linkedin");

    // Extract LinkedIn profile URL if present
    let linkedInProfileUrl: string | undefined;
    if (isLinkedInNotification) {
      const linkedInMatch = body.match(
        /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i
      );
      if (linkedInMatch) {
        linkedInProfileUrl = linkedInMatch[0];
      }
    }

    // Extract name from "Name <email@domain.com>" format
    const fromMatch = from.match(/^(.+?)\s*<(.+)>$/);
    const fromName = fromMatch ? fromMatch[1].replace(/"/g, "") : from;

    emails.push({
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
    });
  }

  return emails;
}

