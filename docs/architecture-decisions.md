# Aries AI — Architecture Decisions

Captured: 2026-03-01

## AD-001: Token Strategy — System User Tokens (No Expiry)

**Decision:** Guide users to create a Meta System User for the Marketing API app, which provides non-expiring tokens.

**Rationale:** Long-lived user tokens expire every 60 days — unacceptable for an automation product. System user tokens don't expire, eliminating the refresh dance entirely.

**User flow:**
1. User creates a Meta Business Manager (if they don't have one)
2. Creates a System User in Business Settings
3. Assigns the System User to their app with required permissions
4. Generates a non-expiring token
5. Pastes the token into Aries AI settings (one-time setup)

**Fallback:** If user can't create a System User (requires Business Manager), support long-lived tokens with auto-refresh reminders.

---

## AD-002: Image Storage — Upload → DB → Meta CDN → Swap URL

**Decision:** Images flow through three stages:

1. **Upload:** User or AI generates image → stored in app database (binary or local filesystem with DB reference)
2. **Publish:** When post is approved, upload image to Meta's CDN via Page Photos endpoint (unpublished) → get public URL
3. **Swap:** Replace local reference with Meta CDN URL in the post record → delete local binary to free space
4. **Display:** App always shows the image — either from local storage (pre-publish) or Meta CDN URL (post-publish)

**Schema implication:** Post.mediaUrls stores either local paths or CDN URLs. Add a Post.mediaStage enum: LOCAL | UPLOADING | CDN

---

## AD-003: Content Generation — Website-First Brand Analysis

**Decision:** Two-tier content generation approach:

### Primary: Website-based brand extraction
- User provides their website URL during onboarding
- Aries AI runs brand analysis (colors, fonts, style, voice, offerings) — similar to existing website-brand-analysis skill
- Stores brand profile per user/business
- All generated content matches extracted brand identity

### Fallback: Manual brand input
- For users without websites
- Guided form: upload logo, pick brand colors, describe tone of voice, list products/services
- Stored as same brand profile format

### Content prompts use brand profile as context for every generation.

---

## AD-004: Content Calendar — Two Flows

**Decision:** Separate content generation into two distinct flows:

### General Content Flow (evergreen)
- AI generates ongoing content based on brand profile
- Topics rotate: product highlights, behind-the-scenes, tips, engagement posts, testimonials
- User sets frequency (e.g., 3 posts/week)
- AI generates a week's worth of content at a time → all go to approval queue

### Special Occasion Flow (holidays/events)
- Calendar of holidays and key dates (Valentine's Day, Christmas, Black Friday, Mother's Day, etc.)
- Industry-specific dates (e.g., National Wine Day for wine businesses)
- User can add custom dates (store anniversary, product launch)
- AI generates themed content 2-3 weeks before each date
- Separate section in dashboard: "Upcoming Occasions"
- Optional: user specifies promos/offers tied to the occasion

### Both flows feed into the same approval queue.

---

## AD-005: Platform Support Rollout Order

1. ✅ Facebook (API ready)
2. ✅ Instagram (API ready)
3. 🔜 X / Twitter
4. 🔜 LinkedIn
5. 🔜 Reddit
6. 🔜 YouTube
7. 🔜 TikTok

---

## AD-006: Database — PostgreSQL

**Decision:** PostgreSQL for all persistent data.

**Rationale:** Production-grade, supports JSON columns for platform-specific metadata, scales with the product, Prisma ORM integration.
