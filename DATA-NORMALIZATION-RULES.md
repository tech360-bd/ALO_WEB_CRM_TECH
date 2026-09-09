# Data Normalization Rules — ALO Education Engine

## Auto-Correction Rules
- **Degree Qualifications:**
  - `M.Sc.` / `Master of Science` -> `MSc`
  - `B.Sc.` / `Bachelor of Science` -> `BSc`
  - `Ph.D.` / `Doctor of Philosophy` -> `PhD`
  - `M.Res` / `Master of Research` -> `MRes`
- **Countries:**
  - `United Kingdom` / `UK` -> `GB`
  - `United States` / `USA` -> `US`
  - `Australia` -> `AU`
  - `Canada` -> `CA`
- **Currencies:**
  - `Pound Sterling` / `£` -> `GBP`
  - `US Dollar` / `$` -> `USD`
  - `Euro` / `€` -> `EUR`
- **CSV Formula Injection Safeguard:** Prepend `'` to strings starting with `=`, `+`, `-`, `@`.
