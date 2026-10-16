import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ assets: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { brandAsset: { findMany: mocks.assets } } }));
import { getBrandKit, promptWithBrand } from '@/lib/marketing/brand-kit';
beforeEach(() => { mocks.assets.mockReset(); });
describe('stored brand kit never invents business contacts', () => {
  it('leaves missing contacts and logo empty on no settings or DB outage', async () => {
    mocks.assets.mockResolvedValue([]);
    expect(await getBrandKit()).toMatchObject({ logoUrl: '', phone: '', whatsapp: '', address: '', website: '' });
    mocks.assets.mockRejectedValue(new Error('offline'));
    const kit = await getBrandKit();
    expect(kit.phone).toBe('');
    expect(promptWithBrand('Draft', kit, 'SQUARE')).toContain('do not invent a logo');
  });
  it('filters invalid JSON, unsafe URLs, malformed phone/colors and preserves valid settings', async () => {
    mocks.assets.mockResolvedValue([{ assetType: 'BRAND_KIT', value: JSON.stringify({ logoUrl: 'javascript:alert(1)', phone: 'invented', website: 'http://unsafe.example', primary: 'red;script', cta: '#E8501A', address: 'Line\nInjection' }) }]);
    expect(await getBrandKit()).toMatchObject({ logoUrl: '', phone: '', website: '', primary: '#0057B8', cta: '#E8501A', address: '' });
    mocks.assets.mockResolvedValue([{ assetType: 'BRAND_KIT', value: JSON.stringify({ website: 'https://example.com', phone: '+447700900123', logoUrl: '/uploads/brand.png' }) }]);
    expect(await getBrandKit()).toMatchObject({ website: 'https://example.com/', phone: '+447700900123', logoUrl: '/uploads/brand.png' });
  });
});
