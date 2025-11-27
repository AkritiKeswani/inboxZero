# How Profile Preferences Feed Into Email Processing

## The Complete Flow

```
1. User fills out Profile page
   ↓
2. Preferences saved to localStorage
   ↓
3. User clicks "Process Emails"
   ↓
4. Dashboard loads preferences from localStorage
   ↓
5. Preferences sent to API along with access token
   ↓
6. For each email:
   a. Grok analyzes email WITH user context (skills, roles, companies)
   b. Priority system calculates score using preferences
   c. Action items generated based on analysis + priority
   ↓
7. Results sorted by priority score
   ↓
8. Displayed in dashboard
```

## Step-by-Step: How Your Profile Is Used

### Step 1: Profile Input
**File:** `app/profile/page.tsx`

User enters:
- Skills: "React, TypeScript, Node.js"
- Desired Roles: "Staff Engineer, Engineering Manager"
- High Priority Companies: "Stripe, OpenAI"
- etc.

### Step 2: Save to localStorage
**File:** `app/profile/page.tsx::handleSave()`

```typescript
localStorage.setItem("inboxzero_preferences", JSON.stringify(preferences));
```

### Step 3: Load When Processing
**File:** `app/dashboard/page.tsx::handleProcessEmails()`

```typescript
// Load user preferences from localStorage
const savedPrefs = localStorage.getItem("inboxzero_preferences");
const preferences = savedPrefs ? JSON.parse(savedPrefs) : null;

// Send to API
fetch("/api/emails", {
  body: JSON.stringify({ 
    accessToken,
    preferences, // ← Your profile data
  }),
});
```

### Step 4: Grok Analysis WITH Context
**File:** `lib/grok.ts::analyzeEmail()`

```typescript
// Grok receives:
- Email content
- User skills: ["React", "TypeScript"]
- Desired roles: ["Staff Engineer"]
- High priority companies: ["Stripe"]

// Grok can now:
- Understand if email matches user's skills
- See if role aligns with what user wants
- Consider company priority
```

### Step 5: Priority Calculation
**File:** `lib/priority.ts::calculatePriorityScore()`

```typescript
// Checks email against YOUR preferences:

if (email mentions "Stripe" && "Stripe" in highPriorityCompanies) {
  score += 30; // Big boost!
}

if (email mentions "Staff Engineer" && "Staff Engineer" in desiredRoles) {
  score += 25; // Perfect match!
}

if (email mentions "React" && "React" in skills) {
  score += 15; // Relevant skill!
}
```

### Step 6: Action Generation
**File:** `lib/priority.ts::generateDefinitiveAction()`

Uses priority + analysis to create specific actions:
- High priority + schedule = "Schedule call with Stripe for Friday"
- High priority + deadline = "Complete task by Thursday - Send resume"

### Step 7: Display Sorted Results
**File:** `app/dashboard/page.tsx`

```typescript
// Sort by priority score (highest first)
results.sort((a, b) => b.priorityScore - a.priorityScore);
```

## Real Example

**Your Profile:**
- Skills: React, TypeScript
- Desired Roles: Staff Engineer
- High Priority Companies: Stripe

**Email:** "Hi! Staff Engineer role at Stripe - can we chat Friday?"

**Processing:**
1. Grok sees: "Staff Engineer" + "Stripe" + user context
2. Priority calculation:
   - Base: 50
   - Stripe (high priority): +30
   - Staff Engineer (desired role): +25
   - Schedule intent: +20
   - **Total: 125 → 100 = HIGH**
3. Action: "Schedule call with Stripe recruiter for Friday"
4. Display: Top of list with red "HIGH" badge

## What Gets Used From Profile

✅ **Skills** → +15 points if email mentions your skills
✅ **Desired Roles** → +25 points if email mentions roles you want
✅ **Past Roles** → +20 points if email mentions your experience
✅ **High Priority Companies** → +30 points if from dream company
✅ **Medium Priority Companies** → +15 points
✅ **Low Priority Companies** → -20 points (deprioritize)
✅ **High Priority Keywords** → +15 points each
✅ **Low Priority Keywords** → -25 points (spam filter)

## Verification

To verify it's working:

1. Fill out your Profile with:
   - Skills: "React"
   - Desired Roles: "Staff Engineer"
   - High Priority Companies: "Stripe"

2. Process emails

3. Check if emails mentioning these get higher scores

4. Look at priority scores - should see higher scores for matches

The connection is there! Your profile directly influences:
- Priority scores (0-100)
- Sorting order (highest first)
- Action item generation
- What gets shown first

