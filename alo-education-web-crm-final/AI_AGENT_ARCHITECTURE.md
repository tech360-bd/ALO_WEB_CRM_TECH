# AI Agent Architecture

## Principle
AI agents must use scoped service identities, approval rules, audit logging and rollback-aware actions. They must not receive unrestricted production access.

## Agent Classes
- CRM configuration agent
- Communication agent
- Marketing agent
- Document and OCR agent
- Report and analytics agent
- Security audit agent
- Database verification agent
- Deployment verification agent
- Backup and monitoring agent

## Required Controls
Every agent needs allowed modules, allowed actions, maximum record count, execution timeout, cost limit, approval threshold, retry policy and emergency disable.

## Current Verification
The active project exposes an agent registry route and AI command-center page, but persistent command/action/rollback records were not verified. The Command Center is not production complete.
