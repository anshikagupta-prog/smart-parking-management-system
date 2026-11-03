
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "smart_parking_test",
  user: "postgres",
  password: process.env.DB_PASSWORD,
});

let completedChecks = 0;
let releaseChecks;

const bothChecksDone = new Promise((resolve) => {
  releaseChecks = resolve;
});

async function makeReservation(requestName) {
  const client = await pool.connect();

  try {
    // Step 1: Check availability
    const check = await client.query(`
      SELECT COUNT(*) AS count
      FROM naive_reservations
      WHERE space_id = 1
        AND starts_at < '2030-01-01 12:00:00+00'
        AND ends_at > '2030-01-01 10:00:00+00'
    `);

    const available = Number(check.rows[0].count) === 0;

    console.log(`${requestName}: Availability = ${available}`);

    // Step 2: Wait until BOTH requests finish checking
    completedChecks++;

    if (completedChecks === 2) {
      releaseChecks();
    }

    await bothChecksDone;

    // Step 3: Insert if available
    if (available) {
      await client.query(`
        INSERT INTO naive_reservations
        (space_id, starts_at, ends_at)
        VALUES (
          1,
          '2030-01-01 10:00:00+00',
          '2030-01-01 12:00:00+00'
        )
      `);

      console.log(`${requestName}: Reservation SUCCESS`);
      return "SUCCESS";
    }

    return "CONFLICT";
  } catch (error) {
    console.error(`${requestName}: ERROR`, error.message);
    return "ERROR";
  } finally {
    client.release();
  }
}

async function runTest() {
  try {
    await pool.query("DELETE FROM naive_reservations");

    const results = await Promise.all([
      makeReservation("Request A"),
      makeReservation("Request B"),
    ]);

    const verification = await pool.query(`
      SELECT COUNT(*) AS count
      FROM naive_reservations
      WHERE space_id = 1
    `);

    console.log("\n--- RESULTS ---");
    console.log("Successful requests:", results.filter(r => r === "SUCCESS").length);
    console.log("Failed requests:", results.filter(r => r !== "SUCCESS").length);
    console.log("Reservations in database:", verification.rows[0].count);
  } finally {
    await pool.end();
  }
}

runTest();
