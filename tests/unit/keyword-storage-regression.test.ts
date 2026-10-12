import {beforeEach, expect, it, vi} from 'vitest';
const db=vi.hoisted(()=>({keywordResearch:{findFirst:vi.fn(),create:vi.fn(),update:vi.fn(),updateMany:vi.fn()}}));
vi.mock('@/lib/db',()=>({db}));
import {recordKeyword,clusterKeywords} from '@/lib/keyword-research-engine';
beforeEach(()=>{vi.resetAllMocks();db.keywordResearch.findFirst.mockResolvedValue({id:'keyword-A',searchVolume:42,difficulty:10,cpc:1.5,competition:'HIGH',intent:'COMMERCIAL',relatedKeywords:'["study"]',serpFeatures:'["faq"]'});db.keywordResearch.updateMany.mockResolvedValue({count:1});});
it('editing keyword priority without metrics does not replace existing measurements with zero',async()=>{
 await recordKeyword({keyword:'synthetic',priority:'HIGH'});expect(db.keywordResearch.update.mock.calls[0][0].data).toMatchObject({searchVolume:42,difficulty:10,cpc:1.5,competition:'HIGH',relatedKeywords:'["study"]'});
});
it('explicit measured zero remains zero',async()=>{await recordKeyword({keyword:'synthetic',searchVolume:0});expect(db.keywordResearch.update.mock.calls[0][0].data.searchVolume).toBe(0);});
it('two clusters in the same millisecond never intentionally share a clock-truncated key',async()=>{const [a,b]=await Promise.all([clusterKeywords(['A'],'A'),clusterKeywords(['B'],'B')]);expect(a.clusterId).not.toBe(b.clusterId);expect(a.clusterId).toMatch(/^cluster-[a-f0-9-]{36}$/);});
