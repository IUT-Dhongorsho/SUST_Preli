import { describe, expect, test, afterAll } from "bun:test";
import pool from "../src/config/db";

describe("Database Connectivity", () => {
    test("should connect to the database and execute a simple query", async () => {
        // We do a simple SELECT 1 to verify the connection is alive
        const result = await pool.query("SELECT 1 AS connected;");
        expect(result.rows[0].connected).toBe(1);
    });

    afterAll(async () => {
        // Close the pool after tests are done so the test runner doesn't hang
        await pool.end();
    });
});
