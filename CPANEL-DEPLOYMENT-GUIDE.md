# Hostinger deployment guide (compatibility filename)

The only supported production architecture is **Hostinger + Node.js 22.x + npm**, serving **aloeducation.com**.

See [HOSTINGER-RUNTIME-STANDARD.md](HOSTINGER-RUNTIME-STANDARD.md) for the authoritative build/start/environment/database contract, and [DEPLOYMENT_ENTRYPOINT_MATRIX.md](DEPLOYMENT_ENTRYPOINT_MATRIX.md) for branch ownership.

Use the repository root: `npm ci` → `npm run build` → `npm start`. If Hostinger asks for a startup file, select `server.js`. No generic cPanel hook, static/PHP fallback, SSH transport or system process manager is required or authorized.

Production uses the actual Hostinger-provisioned MySQL connection in `DATABASE_URL`. Do not substitute a sample database or infer credentials from historical deployment files. Verify persistent private storage outside overwritten releases before deployment.

GitHub Actions validates only. Hostinger's selected production branch must be `main`, with Arena/feature/development excluded from production triggers. Actual hPanel settings remain UNKNOWN and must be inspected before complete push safety can be asserted. No production deployment is authorized here.

Actual build/start, database health, artifact identity and full runtime verification remain BLOCKED. Prior discovery material is retained in [LEGACY-CPANEL-GUIDE.md](docs/runtime-standard/LEGACY-CPANEL-GUIDE.md), not as current instructions.
