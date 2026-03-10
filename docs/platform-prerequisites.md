# Platform Setup Guide — Connecting Your Accounts to Aries AI

## Introduction
To publish posts for you, Aries AI needs secure, authorized access to your social accounts. You stay in control at all times: **We never post without your approval.**

This guide walks you through each setup step in plain language so you can connect your accounts quickly and confidently.

---

## Facebook Prerequisites & Setup

### 1. Account Requirements
Before you begin, make sure:
- You have a **Facebook Business Page** (not a personal profile)
- You are an **Admin** of that Page
- Your Page is **published** (not in draft/unpublished mode)

**Screenshot guidance:**
- Open Facebook Page settings and capture:
  - `Professional dashboard` or `Settings`
  - `Page access` showing your role as **Admin**
  - `General` page status showing the Page is published

### 2. Create a Meta Developer App (for API access)
1. Go to <https://developers.facebook.com>
2. Click **My Apps** (top-right)
3. Click **Create App**
4. Select **Business** as the app type
5. Enter any app name, for example: `My Aries AI Connection`
6. Create the app
7. In your app dashboard, add **Facebook Login for Business**
8. Make sure these permissions are requested:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `publish_video`

**Screenshot guidance:**
- Capture the **Create App** screen with **Business** selected
- Capture the **Products** section showing **Facebook Login for Business** added
- Capture the permissions selection screen with all required scopes checked

#### Generate a Long-Lived Page Access Token
Use Graph API Explorer:
1. Go to <https://developers.facebook.com/tools/explorer/>
2. Select your app from the app dropdown
3. Click **Generate Access Token**
4. Check the required permissions listed above
5. Copy the short-lived token

Then convert it to a long-lived token:
- In simple terms: this swaps a temporary token for one that lasts longer.
- Aries AI can help with a one-click token exchange in **Aries AI Settings** (recommended).
- If needed, this is the Meta token exchange call (your team can run it for you):

```bash
curl -X GET "https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
```

**Token lifespan:** 60 days. Aries AI will remind you before refresh is needed.

**Screenshot guidance:**
- Capture Graph API Explorer with your app selected
- Capture the permission popup when generating token
- Capture Aries AI Settings page where token is pasted or exchanged

### 3. What Aries AI Needs From You
Please provide:
- **Page Access Token**
- **Facebook Page ID**
  - Find it in: `Page Settings` → `About` → `Page ID`
- **App ID** and **App Secret**
  - Found in Meta Developer App dashboard

**Screenshot guidance:**
- Capture `About` section showing Page ID
- Capture app dashboard area showing App ID (keep App Secret private in screenshots)

### 4. Troubleshooting
- **"I don't see my Page"**
  - Make sure your Facebook account is a **Page Admin**
- **"Token expired"**
  - Generate a new token and refresh it (or use Aries AI one-click refresh)
- **"Permission denied"**
  - Confirm required permissions are granted and app review/access mode is set correctly

---

## Instagram Prerequisites & Setup

### 1. Account Requirements
You must use:
- An **Instagram Business or Creator** account
- Personal Instagram accounts are not supported by the API (this is a Meta restriction, not ours)

How to switch:
1. Open Instagram
2. Go to `Settings` → `Account`
3. Tap **Switch to Professional Account**
4. Choose **Business** (or Creator)

Your Instagram must also be connected to a Facebook Page:
1. Instagram `Settings` → `Account` → `Linked Accounts`
2. Tap **Facebook**
3. Select the correct Facebook Page

**Screenshot guidance:**
- Capture `Account type` screen showing Business/Creator
- Capture `Linked Accounts` screen showing connected Facebook Page

### 2. Permissions Needed
Instagram publishing uses these permissions:
- `instagram_basic` (read profile info)
- `instagram_content_publish` (create and publish posts)
- `pages_read_engagement` (read page data)

These are requested in the **same Meta app** you used for Facebook.

**Screenshot guidance:**
- Capture permissions list in Meta app settings with Instagram-related scopes enabled

### 3. Getting Your Instagram Account ID
Important: this is **not** your `@username`.

Find it using Graph API Explorer:
- Run: `GET /{page-id}?fields=instagram_business_account`

Or use Aries AI auto-detection:
- Aries AI can detect this automatically from your connected Facebook Page.

**Screenshot guidance:**
- Capture Graph API Explorer request field with `/{page-id}?fields=instagram_business_account`
- Capture response showing `instagram_business_account.id`

### 4. What Aries AI Needs From You
- Same Meta App credentials used for Facebook
- Instagram Business Account ID (auto-detected or manually provided)
- Confirmation that Facebook Page and Instagram account are linked

### 5. Limitations
- Personal accounts are not supported (Meta API restriction)
- Stories can only be posted to Business/Creator accounts
- Carousel posts: 2-10 items
- Video/Reels: media must be a publicly accessible URL during upload
- Rate limit: 25 posts per 24 hours per account
- Images: JPEG or PNG, max 8MB
- Videos: MP4, max 100MB, 3-60 seconds for Reels

### 6. Troubleshooting
- **"Can't find Instagram Business Account"**
  - Confirm account is Business/Creator and connected to a Facebook Page
- **"Permission denied on publish"**
  - Confirm `instagram_content_publish` permission is granted
- **"Image URL not accessible"**
  - Ensure image URL is public and uses HTTPS

---

## Reddit Prerequisites & Setup (Coming Soon)
**Coming Soon — details will be added when Reddit integration launches.**

Expected requirements:
- Reddit account
- Reddit App (script type) for API access
- OAuth2 setup flow
- Subreddit posting rules and rate limits

---

## YouTube Prerequisites & Setup (Coming Soon)
**Coming Soon — details will be added when YouTube integration launches.**

Expected requirements:
- Google account
- YouTube channel
- Google Cloud project with YouTube Data API v3 enabled
- OAuth2 consent screen setup

---

## LinkedIn Prerequisites & Setup (Coming Soon)
**Coming Soon — details will be added when LinkedIn integration launches.**

Expected requirements:
- LinkedIn Page
- LinkedIn Developer App
- Marketing Developer Platform access

---

## X (Twitter) Prerequisites & Setup (Coming Soon)
**Coming Soon — details will be added when X integration launches.**

Expected requirements:
- X Developer account
- App with OAuth 2.0
- API tier selection (Free tier is very limited)

---

## TikTok Prerequisites & Setup (Coming Soon)
**Coming Soon — details will be added when TikTok integration launches.**

Expected requirements:
- TikTok Business account
- TikTok for Developers app
- Content Posting API access

---

## Quick Reference Table

| Platform | Account Type Required | Key Credentials Needed | Token Lifespan | Post Limit | Status |
|---|---|---|---|---|---|
| Facebook | Business Page | Page Token, Page ID, App ID/Secret | 60 days | 25/day | ✅ Ready |
| Instagram | Business/Creator | Same as Facebook + IG Account ID | 60 days | 25/day | ✅ Ready |
| Reddit | Any | Client ID, Client Secret | 1 hour (refresh) | Varies | 🔜 Coming |
| YouTube | Channel | Google OAuth | Refresh token | 6 uploads/day | 🔜 Coming |
| LinkedIn | Company Page | OAuth token | 60 days | 100/day | 🔜 Coming |
| X | Developer | OAuth 2.0 | 2 hours (refresh) | Tier-dependent | 🔜 Coming |
| TikTok | Business | OAuth token | 24 hours (refresh) | 20/day | 🔜 Coming |

---

If you'd like, Aries AI support can also walk you through this setup live in under 15 minutes. 🙂
