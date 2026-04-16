import { PHONICS_DATA } from '../../content/phonics';
import { CONTENT_MANIFEST } from '../../content/manifest';
import type { PhonicsItem } from '../../core/types';
import { LearnSession } from './LearnSession';
import './learn.css';

export interface LearnModeProps {
  zoneId?: string;
  onBack?: () => void;
}

/**
 * Map a zone ID (kebab-case manifest ID, or legacy numeric set) to phonemes.
 *
 * Priority:
 *   1. Match a zone in CONTENT_MANIFEST by id → use its phonemeSets
 *   2. Parse as a number → treat as a single set number (legacy)
 *   3. Default to Set 1
 */
function getItemsForZone(zoneId: string): PhonicsItem[] {
  // 1. Look up by manifest zone id
  const zone = CONTENT_MANIFEST.zones.find((z) => z.id === zoneId);
  if (zone) {
    return PHONICS_DATA.filter((p) => zone.phonemeSets.includes(p.set));
  }

  // 2. Legacy: numeric set id
  const setNumber = parseInt(zoneId, 10);
  if (!isNaN(setNumber) && setNumber >= 1) {
    return PHONICS_DATA.filter((p) => p.set === setNumber);
  }

  // 3. Default
  return PHONICS_DATA.filter((p) => p.set === 1);
}

/**
 * LearnMode — top-level route component for learn sessions.
 *
 * Loads phonemes for the requested zone and renders a LearnSession.
 * Defaults to zone 1 (whispering-meadows) if no zone is specified.
 */
export function LearnMode({ zoneId = 'whispering-meadows', onBack }: LearnModeProps) {
  const items = getItemsForZone(zoneId);

  if (items.length === 0) {
    return (
      <div class="learn-session" role="main">
        <p>No phonemes found for this zone. Heading back...</p>
      </div>
    );
  }

  return (
    <LearnSession
      items={items}
      onBack={onBack}
    />
  );
}
