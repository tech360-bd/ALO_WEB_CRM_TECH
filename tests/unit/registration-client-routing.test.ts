import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePortalStore } from '@/lib/stores/portal-store';
const fetchMock=vi.fn();
const storage=new Map<string,string>();
beforeEach(()=>{
  vi.stubGlobal('fetch',fetchMock);vi.stubGlobal('window',{});
  vi.stubGlobal('localStorage',{setItem:(key:string,value:string)=>storage.set(key,value),getItem:(key:string)=>storage.get(key),removeItem:(key:string)=>storage.delete(key)});
  fetchMock.mockReset();storage.clear();usePortalStore.setState({currentView:'register',isAuthenticated:false,token:null,loginLoading:false,loginError:null});
});
afterEach(()=>vi.unstubAllGlobals());
const input={name:'Synthetic student',email:'synthetic@example.test',phone:'01700000000',password:'Not-a-real-password',portalType:'student',agreeTerms:true};
it('public student signup calls canonical registration, then verification; never establishes fake session',async()=>{
  fetchMock.mockResolvedValue(Response.json({success:true},{status:201}));
  expect(await usePortalStore.getState().register(input)).toBe(true);
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/register');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({name:input.name,email:input.email,phone:input.phone,password:input.password,role:'STUDENT',termsAccepted:true});
  expect(storage.get('portal_otp_type')).toBe('canonical-student');
  expect(usePortalStore.getState()).toMatchObject({currentView:'verify-otp',isAuthenticated:false,token:null});
});
it('partner signup retains existing portal architecture and approval verification',async()=>{
  fetchMock.mockResolvedValue(Response.json({success:true,requireVerification:true},{status:201}));
  await usePortalStore.getState().register({...input,portalType:'partner'});
  expect(fetchMock.mock.calls[0][0]).toBe('/api/portal-auth/register');expect(storage.get('portal_otp_type')).toBe('partner');
});
it('committed account with email failure opens recovery verification, not duplicate signup or login',async()=>{
  fetchMock.mockResolvedValue(Response.json({success:false,accountCreated:true,error:'Delivery unavailable'},{status:503}));
  expect(await usePortalStore.getState().register(input)).toBe(false);
  expect(usePortalStore.getState()).toMatchObject({currentView:'verify-otp',isAuthenticated:false,loginError:'Delivery unavailable'});
  expect(storage.get('portal_otp_type')).toBe('canonical-student');
});
it('noncommitted registration failure preserves form and does not enter verification',async()=>{
  fetchMock.mockResolvedValue(Response.json({success:false,error:'Transaction failed'},{status:503}));
  await usePortalStore.getState().register(input);
  expect(usePortalStore.getState().currentView).toBe('register');expect(storage.size).toBe(0);
});

it.each([false, undefined])('student signup never invents consent when agreeTerms is %s', async (agreeTerms) => {
  fetchMock.mockResolvedValue(Response.json({ success: false, error: 'Terms acceptance required' }, { status: 400 }));
  expect(await usePortalStore.getState().register({ ...input, agreeTerms })).toBe(false);
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).termsAccepted).toBe(false);
  expect(usePortalStore.getState()).toMatchObject({ currentView: 'register', isAuthenticated: false, token: null });
  expect(storage.size).toBe(0);
});
