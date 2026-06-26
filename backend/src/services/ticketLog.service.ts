import pool from '../config/db';
import { AnalyzeRequest, AnalyzeResponse } from '../core/schemas';

export class TicketLogService {
  /**
   * Fire-and-forget logging to NeonDB.
   * Does not block the main request path, ensuring it doesn't affect P95 latency.
   */
  static async insertLog(
    ticketId: string, 
    request: AnalyzeRequest, 
    response: AnalyzeResponse, 
    latencyMs: number
  ): Promise<void> {
    const query = `
      INSERT INTO ticket_logs (ticket_id, request, response, latency_ms)
      VALUES ($1, $2, $3, $4)
    `;
    const values = [
      ticketId,
      JSON.stringify(request),
      JSON.stringify(response),
      latencyMs
    ];

    try {
      await pool.query(query, values);
    } catch (error) {
      // Catch and log errors without crashing the main request thread
      console.error(`[DB Error] Failed to log ticket ${ticketId} to NeonDB:`, error);
    }
  }
}
