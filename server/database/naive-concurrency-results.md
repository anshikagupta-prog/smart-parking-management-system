
# Naive Concurrency Test Results

## Objective
Demonstrate the race condition in an application-level check-then-act reservation implementation.

## Test Configuration
- Concurrent requests: 2
- Parking space: Same for both requests
- Reservation interval: 10:00–12:00
- Database: smart_parking_test
- Table: naive_reservations
- No database exclusion constraint

## Results

| Metric | Result |
|---|---:|
| Requests | 2 |
| Requests that saw availability | 2 |
| Successful reservations | 2 |
| Failed requests | 0 |
| Overlapping reservations created | 2 |

## Observation
Both requests checked availability before either request inserted its reservation. Consequently, both requests considered the space available and successfully inserted overlapping reservations.

## Conclusion
Application-level availability checks alone are insufficient to prevent concurrent booking conflicts. Database-level enforcement is required.
