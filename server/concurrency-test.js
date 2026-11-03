
const TOTAL_REQUESTS = 50;

const API_URL = "http://localhost:5000/api/reservations";

const TOKEN = process.env.TEST_TOKEN;

if (!TOKEN) {
    console.error("Missing TEST_TOKEN environment variable.");
    process.exit(1);
}

// All 50 requests use exactly the same booking interval.
const startsAt = new Date(Date.now() + 10 * 60 * 1000);
const endsAt = new Date(Date.now() + 70 * 60 * 1000);

const bookingData = {
    vehicle_id: 1,
    space_id: 1,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString()
};

const runTest = async () => {
    console.log("Starting concurrency test...");
    console.log("Total requests:", TOTAL_REQUESTS);
    console.log("Space ID:", bookingData.space_id);
    console.log("Start:", bookingData.starts_at);
    console.log("End:", bookingData.ends_at);

    const startTime = Date.now();

    const requests = Array.from(
        { length: TOTAL_REQUESTS },
        async (_, index) => {
            const requestStart = Date.now();

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(bookingData)
                });

                const responseText = await response.text();

                let responseBody;

                try {
                    responseBody = JSON.parse(responseText);
                } catch {
                    responseBody = responseText;
                }

                return {
                    request: index + 1,
                    status: response.status,
                    duration: Date.now() - requestStart,
                    body: responseBody
                };
            } catch (error) {
                return {
                    request: index + 1,
                    status: "NETWORK_ERROR",
                    duration: Date.now() - requestStart,
                    error: error.message
                };
            }
        }
    );

    const results = await Promise.all(requests);

    const totalTime = Date.now() - startTime;

    const successful = results.filter(r => r.status === 201);
    const conflicts = results.filter(r => r.status === 409);
    const serverErrors = results.filter(r => r.status === 500);
    const otherErrors = results.filter(
        r => ![201, 409, 500].includes(r.status)
    );

    console.log("\n========== TEST RESULTS ==========");
    console.log("Total requests:", TOTAL_REQUESTS);
    console.log("Successful (201):", successful.length);
    console.log("Conflicts (409):", conflicts.length);
    console.log("Server errors (500):", serverErrors.length);
    console.log("Other errors:", otherErrors.length);
    console.log("Total execution time:", totalTime, "ms");

    console.log("\nIndividual responses:");

    results.forEach(result => {
        console.log(
            `Request ${result.request}: ${result.status} (${result.duration} ms)`
        );
    });

    console.log("\n==================================");

    if (
        successful.length === 1 &&
        conflicts.length === 49 &&
        serverErrors.length === 0 &&
        otherErrors.length === 0
    ) {
        console.log("PASS: Concurrency requirement satisfied.");
    } else {
        console.log("FAIL: Results differ from expected values.");
    }
};

runTest();
