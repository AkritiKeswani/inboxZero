# Gmail API Integration - How It Works

## Overview: The Complete Flow

```
1. User clicks "Connect with Google"
   ↓
2. Frontend calls: GET /api/auth/google
   ↓
3. Backend generates Google OAuth URL
   ↓
4. User redirected to Google → Authorizes
   ↓
5. Google redirects back: GET /api/auth/callback?code=...
   ↓
6. Backend exchanges code for access token
   ↓
7. Token stored in browser localStorage
   ↓
8. User clicks "Process Emails"
   ↓
9. Frontend calls: POST /api/emails (with token)
   ↓
10. Backend uses token to call Gmail API
    ↓
11. Gmail API returns emails
    ↓
12. Emails analyzed and suggestions generated
```

## Step-by-Step: How We Call Gmail API

### Step 1: OAuth Setup (One-time)

**File:** `lib/gmail.ts`

```typescript
// We use Google's OAuth2 client library
import { google } from "googleapis";

// Create OAuth2 client with YOUR credentials from .env
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,      // Your app's ID
  process.env.GOOGLE_CLIENT_SECRET,  // Your app's secret
  process.env.GOOGLE_REDIRECT_URI    // Where Google sends user back
);
```

**What this does:**
- Creates a client that knows how to talk to Google
- Uses YOUR credentials (from your Google Cloud project)
- Sets up where Google should redirect after auth

### Step 2: Generate Auth URL

**File:** `app/api/auth/google/route.ts`

```typescript
// When user clicks "Connect with Google"
export async function GET() {
  const authUrl = getAuthUrl(); // Calls lib/gmail.ts
  return NextResponse.json({ authUrl });
}
```

**What `getAuthUrl()` does:**
```typescript
export function getAuthUrl(): string {
  const oauth2Client = getAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",  // Get refresh token too
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly"
    ],
    prompt: "consent",  // Always show consent screen
  });
}
```

**Returns:** A URL like:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/api/auth/callback&
  scope=gmail.readonly+calendar.readonly&
  response_type=code&
  access_type=offline
```

### Step 3: User Authorizes

- User is redirected to Google
- User logs in and clicks "Allow"
- Google generates an authorization code
- Google redirects back to: `/api/auth/callback?code=AUTHORIZATION_CODE`

### Step 4: Exchange Code for Token

**File:** `app/api/auth/callback/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  
  // Exchange the code for an access token
  const oauth2Client = getAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  
  // tokens.access_token = "ya29.a0AfH6SMBx..." (valid for 1 hour)
  // tokens.refresh_token = "1//0g..." (valid forever, use to get new access tokens)
  
  // Redirect to dashboard with token
  return NextResponse.redirect(
    `/dashboard?token=${tokens.access_token}`
  );
}
```

**What happens:**
- We send the code back to Google
- Google verifies it's valid
- Google returns an access token (and refresh token)
- We pass the token to the frontend

### Step 5: Store Token (Frontend)

**File:** `app/dashboard/page.tsx`

```typescript
// Token comes in URL: /dashboard?token=ya29.a0AfH6SMBx...
const tokenFromUrl = params.get("token");

// Store in browser localStorage
localStorage.setItem("google_access_token", tokenFromUrl);
```

### Step 6: Call Gmail API

**File:** `app/api/emails/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();
  
  // Call our function that uses the token
  const emails = await fetchEmails(accessToken, 20);
  
  return NextResponse.json({ results: emails });
}
```

### Step 7: Actually Call Gmail API

**File:** `lib/gmail.ts` - `fetchEmails()`

```typescript
export async function fetchEmails(accessToken: string) {
  // 1. Create authenticated Gmail client
  const gmail = await getGmailClient(accessToken);
  
  // 2. Call Gmail API to list messages
  const response = await gmail.users.messages.list({
    userId: "me",  // "me" = authenticated user
    maxResults: 50,
    q: "is:unread OR in:inbox"  // Gmail search query
  });
  
  // 3. For each message, get full details
  for (const message of response.data.messages) {
    const messageData = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full"  // Get full email content
    });
    
    // 4. Parse the email data
    const payload = messageData.data.payload;
    // Extract headers, body, etc.
  }
}
```

## The Actual Gmail API Calls

### API Endpoint 1: List Messages
```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages
Headers:
  Authorization: Bearer ya29.a0AfH6SMBx... (your access token)

Query params:
  maxResults: 50
  q: "is:unread OR in:inbox"
```

**Response:**
```json
{
  "messages": [
    { "id": "18c1234567890", "threadId": "18c9876543210" },
    { "id": "18c1111111111", "threadId": "18c2222222222" }
  ]
}
```

### API Endpoint 2: Get Message Details
```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages/18c1234567890
Headers:
  Authorization: Bearer ya29.a0AfH6SMBx...

Query params:
  format: "full"
```

**Response:**
```json
{
  "id": "18c1234567890",
  "threadId": "18c9876543210",
  "snippet": "Hi! Can we schedule a call...",
  "payload": {
    "headers": [
      { "name": "From", "value": "recruiter@company.com" },
      { "name": "Subject", "value": "Job Opportunity at Company" },
      { "name": "Date", "value": "Mon, 1 Jan 2024 10:00:00 -0800" }
    ],
    "body": {
      "data": "SGVsbG8gV29ybGQ="  // Base64 encoded email body
    },
    "parts": [...]  // For multipart emails
  }
}
```

## How We Parse the Response

```typescript
// 1. Extract headers
const fromHeader = headers.find((h) => h.name === "From");
const subjectHeader = headers.find((h) => h.name === "Subject");

// 2. Decode email body (it's base64 encoded)
const body = Buffer.from(payload.body.data, "base64").toString("utf-8");

// 3. Handle multipart emails (HTML + text)
if (payload.parts) {
  for (const part of payload.parts) {
    if (part.mimeType === "text/plain") {
      body = Buffer.from(part.body.data, "base64").toString("utf-8");
    }
  }
}

// 4. Extract sender name
const fromMatch = from.match(/^(.+?)\s*<(.+)>$/);
// "John Doe <john@example.com>" → name: "John Doe", email: "john@example.com"
```

## Key Libraries We Use

### `googleapis` Package
```typescript
import { google } from "googleapis";
```

**What it does:**
- Handles OAuth2 flow
- Makes authenticated requests to Google APIs
- Automatically adds `Authorization: Bearer TOKEN` header
- Handles token refresh (if we implement it)

**Installation:**
```bash
npm install googleapis
```

## Environment Variables Needed

```bash
# From Google Cloud Console
GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Testing the Gmail API Directly

You can test Gmail API calls using curl:

```bash
# 1. Get access token (after OAuth flow)
ACCESS_TOKEN="ya29.a0AfH6SMBx..."

# 2. List messages
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Get specific message
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MESSAGE_ID?format=full" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Common Issues & Solutions

### "Invalid credentials"
- Check `.env` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure redirect URI matches exactly

### "Access token expired"
- Access tokens expire after 1 hour
- Need to implement refresh token logic (see `refreshAccessToken()` in `lib/gmail.ts`)

### "Permission denied"
- Make sure Gmail API is enabled in Google Cloud Console
- User must authorize the app during OAuth flow

### "Rate limit exceeded"
- Gmail API has quotas (250 quota units per user per second)
- We batch requests to avoid hitting limits

## Next Steps to Improve

1. **Token Refresh**: Store refresh token, auto-refresh expired access tokens
2. **Caching**: Cache email list to avoid repeated API calls
3. **Pagination**: Handle large inboxes with pagination
4. **Error Retry**: Retry failed requests with exponential backoff
5. **Rate Limiting**: Implement proper rate limiting to respect Gmail quotas

