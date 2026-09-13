# ALO Education — Course Master Data Dictionary

## Tables

### 1. ALO_COURSE_MASTER
Contains the canonical catalog of verified active courses.
- `course_id`: Primary Key
- `university_id`: Foreign Key
- `course_name`: String
- `official_course_url`: String

### 2. ALO_COURSE_INTAKES_2027
Contains intake dates and verification statuses.
- `course_intake_id`: Primary Key
- `course_id`: Foreign Key
- `verification_status`: String (REQUIRES_REVIEW)
