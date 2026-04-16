import { PHONICS_DATA } from '../../content/phonics';
import type { PhonicsItem } from '../../core/types';
import { LearnSession } from './LearnSession';
import './learn.css';

export interface LearnModeProps {
  zoneId?: string;
  onBack?: () => void;
}

/**
 * Map zone IDs to phoneme sets.
 * Zone 1 = Set 1, Zone 2 = Sets 1+2, etc.
 * This is a simple default mapping; the real zone config
 * will come from the content manifest once it's ready.
 */
function getItemsForZone(zoneId: string): PhonicsItem[] {
  const setNumber = parseInt(zoneId, 10);
  if (isNaN(setNumber) || setNumber < 1) {
    // Default to Set 1
    return PHONICS_DATA.filter((p) => p.set === 1);
  }
  return PHONICS_DATA.filter((p) => p.set === setNumber);
}

/**
 * LearnMode — top-level route component for learn sessions.
 *
 * Loads phonemes for the requested zone and renders a LearnSession.
 * Defaults to zone 1 if no zone is specified.
 */
export function LearnMode({ zoneId = '1', onBack }: LearnModeProps) {
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
