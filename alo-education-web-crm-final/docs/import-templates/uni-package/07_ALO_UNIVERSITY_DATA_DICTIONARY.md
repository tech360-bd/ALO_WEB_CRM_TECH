# ALO Education — University Master Data Dictionary

## Tables

### 1. ALO_UNIVERSITY_MASTER
Contains the profile of all 400 target institutions.
- `university_id`: Primary Key (UNI-XX-0001)
- `university_name`: String
- `country`: String
- `city`: String
- `verification_status`: String (VERIFIED_OFFICIAL | NEEDS_REVIEW)

### 2. ALO_CAMPUS_MASTER
Relational mapping of university campuses.
- `campus_id`: Primary Key
- `university_id`: Foreign Key

### 3. ALO_UNIVERSITY_SOURCES
Provenances of collected university profiles.
