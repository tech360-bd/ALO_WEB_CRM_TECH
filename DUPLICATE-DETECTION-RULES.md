# Duplicate Detection & Conflict Rules — ALO Education

## Classification Outcomes
1. `EXACT_DUPLICATE`: Identical external ID or canonical website domain. Skipped automatically.
2. `SAME_RECORD_UNCHANGED`: Matching record attributes. Ignored.
3. `SAME_RECORD_UPDATED`: Matching external ID with modified fields. Staged for approval.
4. `PROBABLE_DUPLICATE`: Matching name & country with different domain. Requires Super Admin decision.
5. `NEW_RECORD`: Staged for review prior to publication.
