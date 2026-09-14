// ALO — Column Mapping Engine (Part: Column Mapping)
// Not assuming old CRM headers. Auto-suggest + manual mapping + save/reuse template.

export type CanonicalField = 'oldCrmId'|'studentName'|'firstName'|'lastName'|'phone'|'whatsapp'|'email'|'passportNumber'|'dateOfBirth'|'countryInterest'|'courseInterest'|'universityInterest'|'applicationStatus'|'counselorName'|'gender'|'nationality'|'address'|'city'|'country'|'postCode'|'leadSource'|'branch'|'intake'|'courseName'|'tuitionFee';

const HEADER_ALIASES: Record<CanonicalField,string[]> = {
  oldCrmId: ['old crm id','oldcrid','crm id','legacy id','external id','old_crm_id'],
  studentName: ['student name','name','full name','applicant name','candidate name','studentname'],
  firstName: ['first name','firstname','given name'],
  lastName: ['last name','lastname','family name','surname'],
  phone: ['phone','mobile','mobile number','phone number','contact number','cell','mob','phone no'],
  whatsapp: ['whatsapp','whatsapp number','wa','whatsapp no','wa number'],
  email: ['email','email address','e-mail','mail'],
  passportNumber: ['passport','passport no','passport number','passport_number','pp no','passportno'],
  dateOfBirth: ['dob','date of birth','birth date','birthdate','dob (dd/mm/yyyy)','date_of_birth'],
  countryInterest: ['country interest','interested country','destination','study country','country_interest','country'],
  courseInterest: ['course interest','interested course','course','course_interest','preferred course'],
  universityInterest: ['university interest','university','institution','preferred university','university_interest'],
  applicationStatus: ['application status','status','app status','stage'],
  counselorName: ['counselor','counsellor','counselor name','assigned counselor','agent'],
  gender: ['gender','sex'], nationality:['nationality'], address:['address'], city:['city'], country:['country2'], postCode:['postcode','post code','zip'],
  leadSource:['lead source','source','campaign','utm_source'], branch:['branch','office'], intake:['intake','intake semester','session'], courseName:['course name','program','program name'], tuitionFee:['tuition fee','fee','tuition']
};

function normHeader(h:string){ return String(h||'').toLowerCase().replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ').trim(); }

export function suggestColumnMapping(headers: string[]): Record<string, CanonicalField | null> {
  const out: Record<string, CanonicalField|null> = {};
  for (const h of headers) {
    const n = normHeader(h);
    let best: CanonicalField|null=null, bestLen=0;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[CanonicalField,string[]]>) {
      for (const alias of aliases) {
        const an = normHeader(alias);
        if (n===an) { best=field; bestLen=999; break; }
        if (n.includes(an) || an.includes(n)) {
          if (an.length > bestLen) { best=field; bestLen=an.length; }
        }
      }
      if (bestLen===999) break;
    }
    out[h]=best;
  }
  return out;
}

export interface MappingTemplate { id:string; name:string; sourceCrmName:string; mappings: Record<string,CanonicalField|null>; createdAt:string; }

const LS_KEY = 'alo.import.mappingTemplates';
export function loadTemplates(): MappingTemplate[] {
  try { if (typeof localStorage==='undefined') return []; return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { return []; }
}
export function saveTemplate(t: MappingTemplate){
  const all = loadTemplates(); all.unshift(t); localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0,20)));
}
export function applyMapping(row: Record<string,string>, mapping: Record<string, CanonicalField|null>): Record<string,string> {
  const out: Record<string,string> = {};
  for (const [header, canonical] of Object.entries(mapping)) {
    if (canonical && row[header]!==undefined) out[canonical]= row[header];
  }
  return out;
}
