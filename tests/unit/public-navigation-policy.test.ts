import { describe, expect, it } from 'vitest';
import { mergePublicDestinations } from '@/lib/public-navigation-policy';
const required=[{label:'UK',href:'/destinations/uk'},{label:'Australia',href:'/destinations/australia'},{label:'More Countries',href:'/destinations'}];
describe('required public destination navigation',()=>{
 it('keeps required destinations when CMS is empty, malformed or contains only one country',()=>{for(const items of [null,{},[],[{label:'Different UK label',href:'/destinations/uk'}]])expect(mergePublicDestinations(required,items)).toEqual(required);});
 it('adds valid published links before More Countries and removes duplicates',()=>{expect(mergePublicDestinations(required,[{label:'Ireland',href:'https://aloeducation.com/destinations/ireland'},{label:'Duplicate',href:'/destinations/ireland'}])).toEqual([required[0],required[1],{label:'Ireland',href:'/destinations/ireland'},required[2]]);});
 it.each(['javascript:alert(1)','https://evil.invalid/destinations/uk','//evil.invalid/destinations/uk','/api/admin/secrets','/destinations/../admin','/destinations/uk?next=other','/destinations/uk#other','https://user:dummy-password@aloeducation.com/destinations/uk'])('rejects unsafe CMS href %s',href=>{expect(mergePublicDestinations(required,[{label:'Published',href}])).toEqual(required);});
});
