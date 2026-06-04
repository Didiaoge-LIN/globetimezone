# GlobeTimeZone API v1

Static API endpoints for time zone data. For dynamic endpoints (current time, conversion), deploy a Cloudflare Worker at `/api/v1/*`.

## Static Endpoints

### GET /api/v1/timezones.json
Returns a JSON array of all supported IANA time zones with metadata.

## Dynamic Endpoints (requires Cloudflare Workers)

These endpoints require server-side compute for real-time time zone calculations:

- `GET /api/v1/current?tz=Asia/Tokyo` — current time in a timezone
- `GET /api/v1/convert?from=X&to=Y` — convert time between zones
- `GET /api/v1/overlap?zones=X,Y,Z` — find overlapping work hours

To enable: create a Cloudflare Worker with a `fetch` handler that uses `Intl.DateTimeFormat` for browser-native time zone math.

## Rate Limiting

Refer to `/pages/api.html` for plan details.
Free tier: 1,000 req/month, no API key needed.
