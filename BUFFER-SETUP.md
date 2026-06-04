# Buffer API Integration Guide

## Overview

This guide explains how to set up automated publishing from GlobeTimeZone to Twitter/X and LinkedIn using Buffer.

## Prerequisites

1. A Buffer account (https://buffer.com)
2. Your social accounts connected to Buffer
3. A Buffer API access token

## Step 1: Get Buffer API Token

1. Go to https://buffer.com/developers/apps
2. Click "Create New App"
3. Set App Name: `GlobeTimeZone Publisher`
4. Set Permissions: `Create updates`, `Read profiles`
5. After creating, copy your **Access Token**

## Step 2: Get Profile IDs

Run this command to get your profile IDs:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.bufferapp.com/1/profiles.json
```

You'll get a response like:
```json
[
  {
    "id": "abc123",
    "service": "twitter",
    "formatted_service": "Twitter"
  },
  {
    "id": "def456",
    "service": "linkedin",
    "formatted_service": "LinkedIn"
  }
]
```

Copy the `id` values for Twitter and LinkedIn.

## Step 3: Configure the Script

Edit `buffer-publisher.js` and update:

```javascript
const CONFIG = {
  bufferAccessToken: 'YOUR_ACTUAL_BUFFER_TOKEN',
  profiles: {
    twitter: 'abc123',
    linkedin: 'def456'
  }
};
```

## Step 4: Publish Posts

### Publish LA-Beijing (5/22)
```bash
export BUFFER_ACCESS_TOKEN=your_token
node buffer-publisher.js la-beijing
```

### Publish Singapore-London (5/25)
```bash
node buffer-publisher.js singapore-london
```

### Publish Both
```bash
node buffer-publisher.js all
```

## Alternative: Manual Scheduling in Buffer

If you prefer not to use the API, you can manually schedule in Buffer:

1. Log into Buffer (https://buffer.com)
2. Click "Compose"
3. Paste the content from below
4. Select your Twitter and LinkedIn profiles
5. Schedule for your desired date/time

### LA-Beijing Content

**Twitter:**
```
Working with teams in LA and Beijing? The 15-16 hour gap doesn't have to be painful.

New guide: https://globetimezone.com/time-difference/la-to-beijing

#timezone #remotework #LA #Beijing
```

**LinkedIn:**
```
Working with teams in Los Angeles and Beijing? The 15-16 hour time difference can make scheduling a nightmare.

I wrote a practical guide covering:
• How the DST switch affects your meetings
• The best 2-hour windows for calls
• Industry-specific tips (Hollywood, Tech, Manufacturing)
• My embarrassing first Beijing call story

Check it out: https://globetimezone.com/time-difference/la-to-beijing
```

### Singapore-London Content

**Twitter:**
```
Finance pros: Working between Singapore and London? There's actually a 2-3 hour overlap. Here's how to use it.

Guide: https://globetimezone.com/time-difference/singapore-to-london

#timezone #finance #Singapore #London
```

**LinkedIn:**
```
The Singapore-London route is surprisingly manageable compared to transpacific. Why? There's actual business-hour overlap.

My new guide covers:
• The 2-3 hour golden window
• Finance/trading coordination tips
• When NOT to schedule calls
• The DST switch trap

Read it: https://globetimezone.com/time-difference/singapore-to-london
```

## Next Steps

After publishing Week 2 content:
1. Monitor engagement (likes, clicks, comments)
2. Reply to any comments with engagement
3. Set up Buffer analytics tracking
4. Prepare Week 3 content (Sydney-London, Paris-NY)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Check your access token is correct |
| "Profile not found" | Verify the profile ID matches Buffer |
| Rate limiting | Wait 1 minute between posts |
