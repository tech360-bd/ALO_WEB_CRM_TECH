import { describe, expect, it } from 'vitest';
import { getCountryDestination } from '@/lib/country-destinations-data';

describe('country destination resolver', () => {
  it('resolves canonical country slugs', () => {
    expect(getCountryDestination('uk')?.slug).toBe('uk');
    expect(getCountryDestination('canada')?.name).toBe('Canada');
  });

  it('resolves public URL aliases to the canonical destination record', () => {
    expect(getCountryDestination('united-kingdom')?.slug).toBe('uk');
    expect(getCountryDestination('united-states')?.slug).toBe('usa');
    expect(getCountryDestination('dubai-uae')?.slug).toBe('dubai');
  });

  it('normalizes surrounding whitespace and rejects unknown slugs', () => {
    expect(getCountryDestination('  NZ ')?.slug).toBe('new-zealand');
    expect(getCountryDestination('not-a-country')).toBeNull();
    expect(getCountryDestination('')).toBeNull();
  });
});
