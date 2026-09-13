# Provider Integration Guide

All communication and analytics integrations must use official APIs and OAuth where supported. Do not store social media passwords or use browser automation to bypass provider login.

## Status Values
- NOT_CONFIGURED
- PENDING_ADMIN_AUTHORIZATION
- PENDING_PROVIDER_REVIEW
- PENDING_BUSINESS_VERIFICATION
- PENDING_WEBHOOK_VERIFICATION
- CONNECTED
- TOKEN_EXPIRED
- PERMISSION_REVOKED
- CONNECTION_ERROR
- DISABLED

## Providers
WhatsApp Business Cloud, Meta/Facebook, Instagram Business, email, SMS, Telegram, LinkedIn, TikTok, YouTube comments, Google Business Profile, X and website chat require configured credentials or provider approval before live operation.

## Current Verification
No live provider credentials or OAuth authorizations were available in this run. Provider status remains pending external authorization.
