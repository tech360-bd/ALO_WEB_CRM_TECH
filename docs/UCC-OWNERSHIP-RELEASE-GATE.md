# Private UCC ownership and messaging release gate

Status: **HOLD — proposed requirements, not business approval.** No assignment or external-send enablement is authorized by this document.

## Current access rules
- Canonical `User` ADMIN/SUPER_ADMIN only on the contained private UCC paths.
- PortalUser, Student, counselor, missing-domain sessions denied even if IDs match.
- Assignment returns `UCC_ASSIGNMENT_NAMESPACE_PENDING` (503); external replies return `OUTBOUND_REPLY_POLICY_UNVERIFIED` (503). Do not add environment bypasses.
- Download requires authorized attachment/conversation/application, verified private storage/hash, supported MIME and successful audit. Failure must not return bytes.
- Legacy CommunicationThread and UccConversation histories keep distinct source-prefixed keys. A shared phone/email/channel is not proof that histories should merge.

## Ownership design to approve before implementation
1. Business owner defines conversation owner, assigned counselor, branch supervisor, transfer rights, coverage during absence/offboarding, confidential B2B permissions and student participation boundaries.
2. Persist an explicit owner/assignee identity domain and exact reference; avoid untyped `assignedToUserId` joins across User and PortalUser. Define foreign-key/validation strategy for each domain before schema approval.
3. Produce a read-only legacy reconciliation queue. Ambiguous rows remain quarantined. Never backfill by matching email, phone or coincident IDs. Obtain reviewed evidence per mapping.
4. Reassignment must atomically validate current actor/target role and active status, check current version, mutate assignment and append namespace-aware before/after audit. Race tests must demonstrate stale edits fail and failed audit rolls back.
5. List/detail/export/download/AI context/analytics must all use the same approved scope. B2B restrictions cannot be bypassed by a student-level history or raw attachment URL.

## Sending policy approval
Business/privacy owner approves recipient provenance, explicit permitted purpose, consent/opt-out, provider service window/template rules, human review, rate limits and attachment classification. Credentials or a stored “connected” flag are never enough.

Provider intent and idempotency must be durable before sending. Distinguish rejected, accepted, delivered and unknown outcomes. Never retry an uncertain paid send automatically. Reconcile signed receipts against exact provider/account/message IDs. Audit failure and timeout paths must be tested with mocks before sandbox-provider verification. No real recipients in this audit.

## Required evidence and approval
- Independent synthetic roles: owner, other counselor, canonical admin, Portal admin, student A/B, suspended user, anonymous; read/write/export/IDOR matrix.
- Real MySQL commit/rollback, concurrent transfer, offboarding and history isolation tests on disposable DB.
- Actual filesystem traversal/symlink/hash/audit failure tests; authenticated staging HTTP downloads and denied URL substitutions.
- Approved policy record, reviewer, test run commit and logs; sandbox provider only until explicit send authorization.
- Separate explicit approval to enable assignment; separate approval to enable external replies. Release owner signs after security/privacy/business review. No approvals have been recorded here.
