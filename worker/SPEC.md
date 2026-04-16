# API/Worker — SPEC.md

**Owner:** API/Worker Agent

## V1 Surface (Minimal)

```
GET  /api/manifest/version    -> { version: string, hash: string }
POST /api/telemetry            -> 202 Accepted
     Body: { events: TelemetryEvent[] }
```

## V2-Dormant (Feature-Flagged Off)

```
POST /api/sync/progress        -> 200 { merged: PhonemeProgress[] }
POST /api/auth/anon            -> 200 { token: string }
```

## D1 Schema

```sql
users            (id, created_at, anon_token)
progress         (user_id, phoneme_id, mastery_level, last_seen_at, attempts, correct)
sessions         (id, user_id, started_at, ended_at, stage, zone_id, score)
events           (id, session_id, kind, payload_json, at)
content_manifest (version, hash, released_at)
```

## Principles

- Don't build what V1 doesn't need
- The Worker exists for versioning backplane + telemetry pipe
- Never require a user to exist
- Schema exists from day one; write paths feature-flagged
- Miniflare-based integration tests
- Full OpenAPI description
