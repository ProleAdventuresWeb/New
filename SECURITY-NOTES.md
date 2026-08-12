# Security Audit & Supply Chain Hardening Notes

## Audit Overview
- **Incident**: Shai-Hulud / `keyv` npm supply-chain compromise.
- **Audit Date**: 2026-08-12
- **Audit Scope**: `package.json`, `pnpm-lock.yaml`, dependency tree analysis.

## Key Findings
1. **Dependency Audit (`keyv`)**:
   - `keyv` and its direct dependent modules were audited across the entire dependency graph using `pnpm list keyv --recursive` and lockfile inspection.
   - **Result**: `keyv` is **not present** in the dependency tree of this project.
   - 0 compromised or untrusted packages identified.

2. **Build Script & Lifecycle Hardening**:
   - Updated `.npmrc` with strict script execution block:
     - `ignore-scripts=true`
     - `enable-prepost-scripts=false`
   - Created `pnpm-workspace.yaml` with explicit `onlyBuiltDependencies` allowlist containing only trusted native build targets (`esbuild`).
   - Disabled arbitrary dependency install scripts by default.

## Maintenance & Script Approval Process
- Any new package requesting build/install script execution must be audited for authenticity before adding to `onlyBuiltDependencies` in `pnpm-workspace.yaml` and `package.json`.
- Blanket script executions (`dangerouslyAllowAllBuilds` or blanket `ignore-scripts=false`) remain prohibited.
