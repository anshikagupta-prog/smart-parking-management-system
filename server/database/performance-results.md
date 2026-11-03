
# Performance Evaluation

## 1. Dataset

The performance database contains:
- 11 users
- 20 vehicles
- 10 parking lots
- 100 parking spaces
- 5,000 reservations

## 2. Query Tested

The availability query checks whether a parking space has an overlapping active reservation within a requested time interval.

The reservation-history query retrieves the latest 20 reservations for a particular user.

## 3. Availability Query — Index Evaluation

The availability query was tested using EXPLAIN ANALYZE before and after adding a composite index on parking_spaces(lot_id, status).

The additional index was not selected by PostgreSQL. The query planner continued to use:
- GiST index: no_overlapping_reservations
- Sequential scan: parking_spaces
- Sequential scan: parking_sessions

This indicates that the additional index was not beneficial for this dataset size.

## 4. Reservation History — Composite Index Evaluation

Query:

```sql
SELECT id, starts_at, ends_at, status
FROM reservations
WHERE user_id = 2
ORDER BY starts_at DESC
LIMIT 20;
```

| Measurement | Before | After |
|---|---:|---:|
| Average execution time | 0.1014 ms | 0.0760 ms |

The composite index was created on (user_id, starts_at DESC). However, the normal query planner continued to use the existing starts_at index rather than the new composite index.

A diagnostic test with regular index scans disabled showed that PostgreSQL could use the composite index through a Bitmap Index Scan, but this plan was slower.

Therefore, the observed timing difference cannot be attributed conclusively to the composite index.

## 5. Conclusion

PostgreSQL's GiST exclusion index efficiently supports interval-overlap checks and enforces reservation conflict prevention.

The experiments also demonstrate that adding indexes does not automatically improve query performance. PostgreSQL selects execution plans based on table size, data distribution, and estimated query cost.
