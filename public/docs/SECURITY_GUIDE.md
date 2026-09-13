# Security Guide

This guide reflects the current ALO Education Web CRM source. Authentication, RBAC, file access and provider integrations must be verified by backend tests before production use.

## Core Controls
- Sessions must use `httpOnly`, `sameSite` and production `secure` cookies.
- Passwords must be hashed with a one-way password hashing function.
- Reset tokens, OTPs and provider tokens must not be returned in JSON responses.
- Private documents must be downloaded through authorization-controlled APIs.
- Public pages may be anonymous; CRM, portal and admin APIs require authentication unless explicitly public.

## Required Production Checks
1. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:integration`, `npm run test:e2e`.
2. Run `npm audit --omit=dev` and resolve critical/high production advisories.
3. Run a dedicated secret scanner before deployment.
4. Verify every protected route returns 401/403 for anonymous or wrong-role users.
5. Verify student, partner, employee and branch ownership scopes on backend queries.

## Current Blockers
Prisma migration deployment fails in the current verification run. Until migrations pass and clean-extract verification completes, production security cannot be fully accepted.
