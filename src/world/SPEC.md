# World Map — SPEC.md

**Owner:** World Agent

## V1 Zones: 7 zones populated, all reachable when unlocked

## ADR-009: Zone entry now routes to the flash-and-mask drill

Clicking an available zone on the map navigates to `#/drill/:zoneId`.
DrillSession loads that zone's phonemes as a per-session list override;
the teacher's localStorage custom list is preserved.

## Map Design Principles

- The map is the retention system, not decoration
- Must feel like a place, not a progress bar
- Avatar reflects total mastery points, 3 visual tiers
- Zones progress locked → available → completed
- In-progress status is legacy (was driven by LearnSession mastery
  writes, which no longer happens under ADR-009); zones now flow
  primarily via Beat boss passes

## Unlock Logic

Boss-based: passing `#/beat/:zoneId` calls
`PersistenceAdapter.unlockZone(nextZoneId)`. The UnlockEngine's
canUnlock check still works off phoneme mastery levels, but under
ADR-009 the primary path to mastery is the boss pass itself.
