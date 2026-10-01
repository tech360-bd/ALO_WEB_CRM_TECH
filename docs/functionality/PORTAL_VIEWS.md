# SPA view and rewrite supplement

200 PortalView type literals; 9 rewrite aliases. Canonical page and API matrices are separate. Missing root map is not dead-code proof; nested dispatch and URL-store synchronization require browser tests. All entries NOT VERIFIED.

| VIEW | ROOT MAPPING LINE (src/app/page.tsx) | STATUS |
|---|---|---|
| portals | 192 | NOT VERIFIED |
| website | 203 | NOT VERIFIED |
| login | 193 | NOT VERIFIED |
| register | 195 | NOT VERIFIED |
| student-login | 193 | NOT VERIFIED |
| student-register | 195 | NOT VERIFIED |
| partner-login | 193 | NOT VERIFIED |
| partner-register | 195 | NOT VERIFIED |
| employee-login | 193 | NOT VERIFIED |
| admin-login | 193 | NOT VERIFIED |
| forgot-password | 200 | NOT VERIFIED |
| reset-password | 201 | NOT VERIFIED |
| verify-otp | 202 | NOT VERIFIED |
| account-suspended | 197 | NOT VERIFIED |
| account-pending | 198 | NOT VERIFIED |
| unauthorized | 199 | NOT VERIFIED |
| public-consultation | 205 | NOT VERIFIED |
| public-contact | 206 | NOT VERIFIED |
| public-course-finder | 207 | NOT VERIFIED |
| public-destination | 208 | NOT VERIFIED |
| public-universities | 209 | NOT VERIFIED |
| public-scholarships | 210 | NOT VERIFIED |
| public-services | 211 | NOT VERIFIED |
| public-about | 212 | NOT VERIFIED |
| public-success-stories | 213 | NOT VERIFIED |
| public-team | 214 | NOT VERIFIED |
| public-faqs | 215 | NOT VERIFIED |
| public-resources | 216 | NOT VERIFIED |
| public-language-prep | 217 | NOT VERIFIED |
| public-english-test | 217 | NOT VERIFIED |
| public-visa-readiness | 219 | NOT VERIFIED |
| public-privacy | 220 | NOT VERIFIED |
| public-terms | 221 | NOT VERIFIED |
| public-cookie | 223 | NOT VERIFIED |
| public-cookies | 222 | NOT VERIFIED |
| public-accessibility | 224 | NOT VERIFIED |
| public-communication-policy | 225 | NOT VERIFIED |
| public-lead-data-policy | 226 | NOT VERIFIED |
| public-user-guide | 227 | NOT VERIFIED |
| student-dashboard | 234 | NOT VERIFIED |
| student-profile | 235 | NOT VERIFIED |
| student-applications | 240 | NOT VERIFIED |
| student-applications-detail | 241 | NOT VERIFIED |
| student-documents | 242 | NOT VERIFIED |
| student-messages | 243 | NOT VERIFIED |
| student-course-finder | 236 | NOT VERIFIED |
| student-favorites | 238 | NOT VERIFIED |
| student-compare | 239 | NOT VERIFIED |
| student-sop | 245 | NOT VERIFIED |
| student-cv | 246 | NOT VERIFIED |
| student-visa | 244 | NOT VERIFIED |
| student-scholarships | 247 | NOT VERIFIED |
| student-appointments | 248 | NOT VERIFIED |
| student-payments | 249 | NOT VERIFIED |
| student-notifications | 250 | NOT VERIFIED |
| student-settings | 251 | NOT VERIFIED |
| student-help | 252 | NOT VERIFIED |
| student-ai-advisor | 253 | NOT VERIFIED |
| student-recommendations | 237 | NOT VERIFIED |
| student-interviews | 257 | NOT VERIFIED |
| student-referrals | 254 | NOT VERIFIED |
| student-events | 255 | NOT VERIFIED |
| student-onboarding | 256 | NOT VERIFIED |
| employee-dashboard | 269 | NOT VERIFIED |
| employee-profile | 270 | NOT VERIFIED |
| employee-tasks | 271 | NOT VERIFIED |
| employee-leads | 272 | NOT VERIFIED |
| employee-students | 273 | NOT VERIFIED |
| employee-applications | 274 | NOT VERIFIED |
| employee-documents | 275 | NOT VERIFIED |
| employee-messages | 276 | NOT VERIFIED |
| employee-whatsapp | 277 | NOT VERIFIED |
| employee-calendar | 278 | NOT VERIFIED |
| employee-attendance | 279 | NOT VERIFIED |
| employee-leave | 280 | NOT VERIFIED |
| employee-salary | 281 | NOT VERIFIED |
| employee-performance | 282 | NOT VERIFIED |
| employee-reports | 283 | NOT VERIFIED |
| employee-notifications | 284 | NOT VERIFIED |
| employee-settings | 285 | NOT VERIFIED |
| employee-help | 286 | NOT VERIFIED |
| employee-visa-dashboard | 432 | NOT VERIFIED |
| employee-visa-officer | 433 | NOT VERIFIED |
| employee-visa-interview-officer | 434 | NOT VERIFIED |
| employee-visa-cases | 435 | NOT VERIFIED |
| employee-visa-interviews | 436 | NOT VERIFIED |
| employee-visa-documents | 437 | NOT VERIFIED |
| employee-visa-readiness | 438 | NOT VERIFIED |
| employee-visa-reports | 439 | NOT VERIFIED |
| partner-dashboard | 310 | NOT VERIFIED |
| partner-profile | 311 | NOT VERIFIED |
| partner-leads | 312 | NOT VERIFIED |
| partner-students | 313 | NOT VERIFIED |
| partner-applications | 314 | NOT VERIFIED |
| partner-documents | 315 | NOT VERIFIED |
| partner-commission | 316 | NOT VERIFIED |
| partner-reports | 317 | NOT VERIFIED |
| partner-messages | 318 | NOT VERIFIED |
| partner-resources | 319 | NOT VERIFIED |
| partner-referrals | 320 | NOT VERIFIED |
| partner-notifications | 321 | NOT VERIFIED |
| partner-settings | 322 | NOT VERIFIED |
| partner-help | 323 | NOT VERIFIED |
| partner-admin-dashboard | 429 | NOT VERIFIED |
| partner-admin-company-profile | Not statically mapped here | NOT VERIFIED |
| partner-admin-users | Not statically mapped here | NOT VERIFIED |
| partner-admin-users-create | Not statically mapped here | NOT VERIFIED |
| partner-admin-roles | Not statically mapped here | NOT VERIFIED |
| partner-admin-students | Not statically mapped here | NOT VERIFIED |
| partner-admin-leads | Not statically mapped here | NOT VERIFIED |
| partner-admin-applications | Not statically mapped here | NOT VERIFIED |
| partner-admin-documents | Not statically mapped here | NOT VERIFIED |
| partner-admin-course-finder | Not statically mapped here | NOT VERIFIED |
| partner-admin-marketing-studio | 430 | NOT VERIFIED |
| partner-admin-content-generator | 431 | NOT VERIFIED |
| partner-admin-image-generator | Not statically mapped here | NOT VERIFIED |
| partner-admin-video-generator | Not statically mapped here | NOT VERIFIED |
| partner-admin-social-scheduler | Not statically mapped here | NOT VERIFIED |
| partner-admin-mock-tests | Not statically mapped here | NOT VERIFIED |
| partner-admin-interview-prep | Not statically mapped here | NOT VERIFIED |
| partner-admin-voucher-codes | Not statically mapped here | NOT VERIFIED |
| partner-admin-usage-quota | Not statically mapped here | NOT VERIFIED |
| partner-admin-reports | Not statically mapped here | NOT VERIFIED |
| partner-admin-support-request | Not statically mapped here | NOT VERIFIED |
| partner-admin-settings | Not statically mapped here | NOT VERIFIED |
| crm-dashboard | 393 | NOT VERIFIED |
| crm-users | 449 | NOT VERIFIED |
| crm-roles | 450 | NOT VERIFIED |
| crm-permissions | 451 | NOT VERIFIED |
| crm-leads | 396 | NOT VERIFIED |
| crm-students | 397 | NOT VERIFIED |
| crm-analytics | 394 | NOT VERIFIED |
| crm-partners | 443 | NOT VERIFIED |
| crm-applications | 398 | NOT VERIFIED |
| crm-documents | 399 | NOT VERIFIED |
| crm-communications | 408 | NOT VERIFIED |
| crm-whatsapp | 406 | NOT VERIFIED |
| crm-social | 407 | NOT VERIFIED |
| crm-reports | 446 | NOT VERIFIED |
| crm-audit-logs | 447 | NOT VERIFIED |
| crm-settings | 448 | NOT VERIFIED |
| crm-finance | 441 | NOT VERIFIED |
| crm-commissions | 442 | NOT VERIFIED |
| crm-marketing | 444 | NOT VERIFIED |
| crm-hrm | 452 | NOT VERIFIED |
| crm-ai-command | 454 | NOT VERIFIED |
| crm-tasks | 417 | NOT VERIFIED |
| crm-appointments | 418 | NOT VERIFIED |
| crm-course-finder | 402 | NOT VERIFIED |
| crm-universities | 403 | NOT VERIFIED |
| crm-visa | 420 | NOT VERIFIED |
| crm-visa-dashboard | 421 | NOT VERIFIED |
| crm-visa-cases | 422 | NOT VERIFIED |
| crm-visa-interviews | 423 | NOT VERIFIED |
| crm-visa-readiness | 424 | NOT VERIFIED |
| crm-visa-reports | 425 | NOT VERIFIED |
| crm-import-center | 426 | NOT VERIFIED |
| crm-university-updates | 427 | NOT VERIFIED |
| crm-access-control-center | 428 | NOT VERIFIED |
| crm-scholarships | 400 | NOT VERIFIED |
| crm-support | 419 | NOT VERIFIED |
| crm-inbox | 405 | NOT VERIFIED |
| crm-seo-dashboard | 456 | NOT VERIFIED |
| crm-seo-keywords | 457 | NOT VERIFIED |
| crm-seo-content | 458 | NOT VERIFIED |
| crm-seo-competitors | 459 | NOT VERIFIED |
| crm-seo-technical | 460 | NOT VERIFIED |
| crm-seo-policy | 461 | NOT VERIFIED |
| marketing-dashboard | 351 | NOT VERIFIED |
| marketing-campaigns | 352 | NOT VERIFIED |
| marketing-social | 353 | NOT VERIFIED |
| marketing-analytics | 354 | NOT VERIFIED |
| marketing-inbox | 355 | NOT VERIFIED |
| marketing-approvals | 362 | NOT VERIFIED |
| marketing-brand-assets | 363 | NOT VERIFIED |
| marketing-keywords | 364 | NOT VERIFIED |
| marketing-whatsapp | 365 | NOT VERIFIED |
| marketing-leads | 366 | NOT VERIFIED |
| marketing-ai-replies | 367 | NOT VERIFIED |
| marketing-assignment | 368 | NOT VERIFIED |
| marketing-handoff | 369 | NOT VERIFIED |
| marketing-workflows | 370 | NOT VERIFIED |
| marketing-audit | 371 | NOT VERIFIED |
| knowledge-sharing-hub | 463 | NOT VERIFIED |
| knowledge-sharing-detail | 464 | NOT VERIFIED |
| international-officer-dashboard | 466 | NOT VERIFIED |
| international-officer-research | 467 | NOT VERIFIED |
| international-officer-communications | 468 | NOT VERIFIED |
| international-officer-contacts | 469 | NOT VERIFIED |
| international-officer-agreements | 470 | NOT VERIFIED |
| international-officer-strategy | 471 | NOT VERIFIED |
| super-admin-master-command | 473 | NOT VERIFIED |
| super-admin-website-cms | 474 | NOT VERIFIED |
| super-admin-crm-command | 475 | NOT VERIFIED |
| social-media-hub | 410 | NOT VERIFIED |
| social-inbox | 411 | NOT VERIFIED |
| social-analytics | 412 | NOT VERIFIED |
| social-content | 413 | NOT VERIFIED |
| social-posts | 414 | NOT VERIFIED |
| social-automation | 415 | NOT VERIFIED |

| SOURCE | DESTINATION | STATUS |
|---|---|---|
| /book-appointment | /book-consultation | NOT VERIFIED |
| /staff/login | /employee/login | NOT VERIFIED |
| /admin | /admin/login | NOT VERIFIED |
| /admin/students | /admin/crm-command | NOT VERIFIED |
| /admin/partners | /admin/access-control-center | NOT VERIFIED |
| /admin/tasks | /admin/crm-command | NOT VERIFIED |
| /portal | /portal/login | NOT VERIFIED |
| /auth/login | /login | NOT VERIFIED |
| /course-finder/saved | /?p=saved-courses | NOT VERIFIED |
