/**
 * Buffer API Integration for GlobeTimeZone
 * Publishes scheduled posts to Twitter/X and LinkedIn
 *
 * Setup Instructions:
 * 1. Get your Buffer Access Token: https://buffer.com/developers/apps
 * 2. Create an app with read/write permissions
 * 3. Set your API token as environment variable: BUFFER_ACCESS_TOKEN
 * 4. Configure your profile IDs for each social account
 */

const BUFFER_API_BASE = 'https://api.bufferapp.com/1';

// Configuration - Replace with your actual values
const CONFIG = {
  bufferAccessToken: process.env.BUFFER_ACCESS_TOKEN || 'YOUR_BUFFER_ACCESS_TOKEN',

  // Get these IDs from Buffer API: GET /profiles.json
  profiles: {
    twitter: 'YOUR_TWITTER_PROFILE_ID',
    linkedin: 'YOUR_LINKEDIN_PROFILE_ID'
  }
};

/**
 * Create a post on Buffer
 * @param {string} profileId - The profile ID (from Buffer)
 * @param {string} text - The post content
 * @param {string[]} mediaUrls - Optional array of image URLs
 * @returns {Promise<object>} - API response
 */
async function createPost(profileId, text, mediaUrls = []) {
  const url = new URL(`${BUFFER_API_BASE}/profiles/${profileId}/updates/create.json`);

  const params = {
    access_token: CONFIG.bufferAccessToken,
    text: text,
    ...(mediaUrls.length > 0 && { media: { link: mediaUrls[0] } }),
    shorten: false, // Keep full URLs for better CTR
    parse_urls: true
  };

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });

  const response = await fetch(url.toString(), {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Buffer API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Publish LA-Beijing announcement
 */
async function publishLABeijing() {
  const twitterText = `Working with teams in LA and Beijing? The 15-16 hour gap doesn't have to be painful.

New guide: https://globetimezone.com/time-difference/la-to-beijing

#timezone #remotework #LA #Beijing`;

  const linkedinText = `Working with teams in Los Angeles and Beijing? The 15-16 hour time difference can make scheduling a nightmare.

I wrote a practical guide covering:
• How the DST switch affects your meetings
• The best 2-hour windows for calls
• Industry-specific tips (Hollywood, Tech, Manufacturing)
• My embarrassing first Beijing call story

Check it out: https://globetimezone.com/time-difference/la-to-beijing`;

  console.log('Publishing LA-Beijing post...');

  // Twitter/X
  if (CONFIG.profiles.twitter !== 'YOUR_TWITTER_PROFILE_ID') {
    await createPost(CONFIG.profiles.twitter, twitterText);
    console.log('✓ Posted to Twitter/X');
  } else {
    console.log('⚠ Twitter profile not configured - skipping');
  }

  // LinkedIn
  if (CONFIG.profiles.linkedin !== 'YOUR_LINKEDIN_PROFILE_ID') {
    await createPost(CONFIG.profiles.linkedin, linkedinText);
    console.log('✓ Posted to LinkedIn');
  } else {
    console.log('⚠ LinkedIn profile not configured - skipping');
  }
}

/**
 * Publish Singapore-London announcement
 */
async function publishSingaporeLondon() {
  const twitterText = `Finance pros: Working between Singapore and London? There's actually a 2-3 hour overlap. Here's how to use it.

Guide: https://globetimezone.com/time-difference/singapore-to-london

#timezone #finance #Singapore #London`;

  const linkedinText = `The Singapore-London route is surprisingly manageable compared to transpacific. Why? There's actual business-hour overlap.

My new guide covers:
• The 2-3 hour golden window
• Finance/trading coordination tips
• When NOT to schedule calls
• The DST switch trap

Read it: https://globetimezone.com/time-difference/singapore-to-london`;

  console.log('Publishing Singapore-London post...');

  if (CONFIG.profiles.twitter !== 'YOUR_TWITTER_PROFILE_ID') {
    await createPost(CONFIG.profiles.twitter, twitterText);
    console.log('✓ Posted to Twitter/X');
  }

  if (CONFIG.profiles.linkedin !== 'YOUR_LINKEDIN_PROFILE_ID') {
    await createPost(CONFIG.profiles.linkedin, linkedinText);
    console.log('✓ Posted to LinkedIn');
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'la-beijing':
    publishLABeijing();
    break;
  case 'singapore-london':
    publishSingaporeLondon();
    break;
  case 'all':
    publishLABeijing().then(() => publishSingaporeLondon());
    break;
  default:
    console.log(`
Buffer API Publisher for GlobeTimeZone

Usage: node buffer-publisher.js <command>

Commands:
  la-beijing        Publish LA-Beijing guide announcement
  singapore-london  Publish Singapore-London guide announcement
  all               Publish all Week 2 announcements

Setup:
  1. Get Buffer Access Token from https://buffer.com/developers/apps
  2. Run: export BUFFER_ACCESS_TOKEN=your_token
  3. Get profile IDs: curl -H "Authorization: Bearer $BUFFER_ACCESS_TOKEN" \\
     https://api.bufferapp.com/1/profiles.json
  4. Update CONFIG.profiles in this file

Environment Variables:
  BUFFER_ACCESS_TOKEN - Your Buffer app access token
`);
}

// Export for programmatic use
module.exports = { createPost, publishLABeijing, publishSingaporeLondon };
