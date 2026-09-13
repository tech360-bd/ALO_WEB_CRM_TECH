# Field Dictionary — ALO Education Data Schema

## Core Models

### University (`CrmUniversity`)
- `id`: Primary Key (cuid)
- `externalId`: Stable external ID for idempotent upsert
- `name`: Official University Name
- `country`: ISO 3166-1 alpha-2 Code (e.g. GB, US, CA, AU)
- `websiteUrl`: Canonical HTTPS domain

### Course (`CrmCourse`)
- `id`: Primary Key (cuid)
- `externalId`: Stable external ID for idempotent upsert
- `universityId`: Foreign Key to CrmUniversity
- `title`: Program Title
- `qualification`: Normalized qualification (e.g. BSc, MSc, MRes, PhD)
- `studyLevel`: Study level tier
- `availableToInternational`: Boolean flag
