# Building the Gmail Integration - Core Concepts

## The 3 Main Pieces

### 1. OAuth2 Authentication (`lib/gmail.ts`)

**What it does:** Gets permission from user to access their Gmail

```typescript
// Create OAuth client with YOUR app credentials
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,      // Your app's ID (from Google Cloud)
  GOOGLE_CLIENT_SECRET,  // Your app's secret
  REDIRECT_URI           // Where Google sends user back
);

// Generate URL for user to click
const authUrl = oauth2Client.generateAuthUrl({
  scope: ["gmail.readonly", "calendar.readonly"]
});

// After user authorizes, exchange code for token
const { tokens } = await oauth2Client.getToken(code);
// tokens.access_token = "ya29.a0AfH6SMBx..." (use this to call APIs)
```

**Key Point:** This is just getting permission. The actual Gmail API calls happen next.

---

### 2. Gmail API Client (`lib/gmail.ts`)

**What it does:** Creates a client that can call Gmail API with the token

```typescript
// Set the access token
oauth2Client.setCredentials({ 
  access_token: "ya29.a0AfH6SMBx..." 
});

// Create Gmail API client
const gmail = google.gmail({ 
  version: "v1",           // Use Gmail API v1
  auth: oauth2Client      // Use our authenticated OAuth client
});
```

**Key Point:** The `gmail` object now knows how to make authenticated requests.

---

### 3. Making API Calls (`lib/gmail.ts::fetchEmails()`)

**What it does:** Actually calls Gmail API to get emails

```typescript
// Call 1: List messages
const response = await gmail.users.messages.list({
  userId: "me",                    // "me" = authenticated user
  maxResults: 50,                  // How many to get
  q: "is:unread OR in:inbox"       // Gmail search query
});

// Response: { messages: [{ id: "...", threadId: "..." }] }

// Call 2: Get full message details (for each message)
for (const message of response.data.messages) {
  const messageData = await gmail.users.messages.get({
    userId: "me",
    id: message.id,
    format: "full"                 // Get full email content
  });
  
  // messageData.data.payload contains:
  // - headers (From, Subject, Date)
  // - body (email content, base64 encoded)
  // - parts (for multipart emails)
}
```

**Key Point:** We make 2 types of API calls:
1. `list()` - Get list of message IDs
2. `get()` - Get full details of each message

---

## The Complete Flow in Code

### Step 1: User Clicks "Connect"
**File:** `app/dashboard/page.tsx`
```typescript
const handleGoogleAuth = async () => {
  const response = await fetch("/api/auth/google");
  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to Google
};
```

### Step 2: Backend Generates Auth URL
**File:** `app/api/auth/google/route.ts`
```typescript
export async function GET() {
  const authUrl = getAuthUrl(); // From lib/gmail.ts
  return NextResponse.json({ authUrl });
}
```

### Step 3: User Authorizes on Google
- User sees Google login page
- User clicks "Allow"
- Google redirects to: `/api/auth/callback?code=ABC123`

### Step 4: Exchange Code for Token
**File:** `app/api/auth/callback/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  
  const oauth2Client = getAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  
  // Redirect with token
  return NextResponse.redirect(
    `/dashboard?token=${tokens.access_token}`
  );
}
```

### Step 5: Store Token
**File:** `app/dashboard/page.tsx`
```typescript
const token = params.get("token");
localStorage.setItem("google_access_token", token);
```

### Step 6: User Clicks "Process Emails"
**File:** `app/dashboard/page.tsx`
```typescript
const handleProcessEmails = async () => {
  const token = localStorage.getItem("google_access_token");
  
  const response = await fetch("/api/emails", {
    method: "POST",
    body: JSON.stringify({ accessToken: token })
  });
  
  const { results } = await response.json();
  // Display emails
};
```

### Step 7: Backend Calls Gmail API
**File:** `app/api/emails/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();
  
  // This is where we actually call Gmail API
  const emails = await fetchEmails(accessToken, 20);
  
  return NextResponse.json({ results: emails });
}
```

### Step 8: fetchEmails() Makes API Calls
**File:** `lib/gmail.ts`
```typescript
export async function fetchEmails(accessToken: string) {
  // 1. Create authenticated client
  const gmail = await getGmailClient(accessToken);
  
  // 2. Call Gmail API - List messages
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 50,
    q: "is:unread OR in:inbox"
  });
  
  // 3. For each message, get full details
  for (const message of response.data.messages) {
    const messageData = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full"
    });
    
    // 4. Parse the response
    const payload = messageData.data.payload;
    const headers = payload.headers;
    const body = payload.body.data; // Base64 encoded
    
    // 5. Extract what we need
    const from = headers.find(h => h.name === "From")?.value;
    const subject = headers.find(h => h.name === "Subject")?.value;
    const emailBody = Buffer.from(body, "base64").toString("utf-8");
  }
}
```

---

## What the `googleapis` Library Does

The `googleapis` library (from npm) handles:

1. **OAuth2 Flow**: Generating URLs, exchanging codes, refreshing tokens
2. **API Requests**: Making HTTP requests to Google APIs
3. **Authentication**: Automatically adding `Authorization: Bearer TOKEN` header
4. **Error Handling**: Converting API errors to JavaScript errors

**Without the library, you'd have to:**
```typescript
// Manual way (don't do this, use the library!)
const response = await fetch(
  "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  }
);
```

**With the library:**
```typescript
// Much easier!
const gmail = google.gmail({ version: "v1", auth: oauth2Client });
const response = await gmail.users.messages.list({ userId: "me" });
```

---

## The Actual HTTP Requests (Under the Hood)

When you call `gmail.users.messages.list()`, the library makes:

```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=is:unread
Headers:
  Authorization: Bearer ya29.a0AfH6SMBx...
  Content-Type: application/json
```

**Response:**
```json
{
  "messages": [
    { "id": "18c1234567890", "threadId": "18c9876543210" }
  ]
}
```

Then for each message, it calls:
```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages/18c1234567890?format=full
Headers:
  Authorization: Bearer ya29.a0AfH6SMBx...
```

**Response:**
```json
{
  "id": "18c1234567890",
  "payload": {
    "headers": [
      { "name": "From", "value": "recruiter@company.com" },
      { "name": "Subject", "value": "Job Opportunity" }
    ],
    "body": {
      "data": "SGVsbG8gV29ybGQ="  // Base64: "Hello World"
    }
  }
}
```

---

## Key Takeaways

1. **OAuth2** = Getting permission (one-time setup)
2. **Access Token** = Proof of permission (use this for API calls)
3. **Gmail API** = The actual endpoints to get email data
4. **googleapis library** = Makes it easy (handles auth, requests, errors)

---

## Next: Test It Yourself

1. Set up your `.env` with Google credentials
2. Run `npm run dev`
3. Go to dashboard, click "Connect with Google"
4. Watch the browser Network tab to see the API calls
5. Check server console for Gmail API responses

See `GMAIL_API_GUIDE.md` for detailed API documentation.

