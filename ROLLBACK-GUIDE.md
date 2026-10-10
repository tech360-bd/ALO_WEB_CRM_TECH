# cPanel recovery

**BLOCKED until the provider's release-selection and managed restart mechanism is verified.** Recovery workflow fails explicitly and does not pretend to roll back.

Before a release, preserve a known-good validated artifact/SHA and its manifest, runtime compatibility, application configuration, and independently backed-up persistent data. Do not bundle secrets with public artifacts. Record the provider deployment identifier.

On failure stop further deployment. Inspect sanitized hosting logs and distinguish startup, database, build/native dependency, storage, authentication and network failures. Use only the provider-supported release selector/API to restore the prior compatible artifact and restart the managed Node application. Run HTTPS readiness and authenticated portal/CRM smoke checks before recording recovery success.

A code rollback does not roll back schema or data. Do not reset, seed or replace the database, student uploads or environment configuration. If a migration makes the previous application incompatible, use the approved database recovery/forward-fix plan and verified backups with owner approval. This procedure has not been exercised on the actual host.
