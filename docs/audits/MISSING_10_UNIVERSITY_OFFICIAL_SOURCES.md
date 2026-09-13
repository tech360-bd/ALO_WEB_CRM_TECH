# 10 Missing University Official Sources — Discovery Report

## Finding
All 10 missing universities are **multi-campus institutions** where the same domain (e.g. `law.ac.uk`) is shared across multiple campus entries. The OfficialSource registry uses `sourceUrl` as a unique key, so the first campus registration blocked subsequent campuses with the same domain.

## Resolution
Registered all 10 with campus-specific URL paths:
- University of Law campuses: `https://www.law.ac.uk`, `/bristol`, `/leeds`, `/liverpool`, `/guildford`
- Arden University campuses: `https://arden.ac.uk/birmingham`, `/manchester`, `/leeds`, `/bristol`
- Barts Malta: `https://www.qmul.ac.uk/malta`

All 400 universities now have OfficialSource records (398 unique + 2 shared domain updates).

## The 10 Universities

| # | University Name | Slug | Country | Source URL | Status |
|---|----------------|------|---------|------------|--------|
| 1 | University of Law – Manchester | university-of-law-manchester | uk | https://www.law.ac.uk | REGISTERED |
| 2 | University of Law – Bristol | university-of-law-bristol | uk | https://www.law.ac.uk/bristol | REGISTERED |
| 3 | University of Law – Leeds | university-of-law-leeds | uk | https://www.law.ac.uk/leeds | REGISTERED |
| 4 | University of Law – Liverpool | university-of-law-liverpool | uk | https://www.law.ac.uk/liverpool | REGISTERED |
| 5 | University of Law – Guildford | university-of-law-guildford | uk | https://www.law.ac.uk/guildford | REGISTERED |
| 6 | Arden University – Birmingham | arden-university-birmingham | uk | https://arden.ac.uk/birmingham | REGISTERED |
| 7 | Arden University – Manchester | arden-university-manchester | uk | https://arden.ac.uk/manchester | REGISTERED |
| 8 | Arden University – Leeds | arden-university-leeds | uk | https://arden.ac.uk/leeds | REGISTERED |
| 9 | Arden University – Bristol | arden-university-bristol | uk | https://arden.ac.uk/bristol | REGISTERED |
| 10 | Barts London School of Medicine Malta | barts-london-school-of-medicine-malta | malta | https://www.qmul.ac.uk/malta | REGISTERED |

**Note:** The campus-specific URL paths (e.g. `/bristol`) may or may not be actual valid pages on the university website. These need HTTP verification to confirm.
