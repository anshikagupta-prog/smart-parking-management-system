
# Concurrency Test Results

## Objective

Verify that simultaneous reservation requests for the same parking space and overlapping time interval cannot create multiple active reservations.

## Test Configuration

- Total concurrent requests: 50
- Parking space: Same for all requests
- Reservation interval: Identical for all requests
- Execution method: Node.js Promise.all()
- Database: smart_parking_test

## Results

| Metric | Result |
|---|---:|
| Total requests | 50 |
| Successful (HTTP 201) | 1 |
| Conflicts (HTTP 409) | 49 |
| Server errors (HTTP 500) | 0 |
| Other errors | 0 |
| Execution time | 445 ms |

## Database Verification

After the requests completed, an independent database query confirmed that exactly one active reservation existed for the tested parking space and interval.

## Conclusion

The system successfully prevented overlapping reservations under simultaneous request load.

The PostgreSQL GiST exclusion constraint enforced the reservation invariant at the database level, ensuring that concurrent requests could not create conflicting active reservations.
