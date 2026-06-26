// src/metrics.ts
import client from 'prom-client';
import type { Request, Response } from 'express';

// Register default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Latency histogram (buckets match rubric)
export const requestDuration = new client.Histogram({
  name: 'ticket_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['status_code'],
  buckets: [0.5, 1, 2, 5, 10, 15, 30],
  registers: [register],
});

// Case type counter
export const caseTypeCounter = new client.Counter({
  name: 'ticket_case_type_total',
  help: 'Total cases by case_type and department',
  labelNames: ['case_type', 'department'],
  registers: [register],
});

// Evidence verdict counter
export const evidenceVerdictCounter = new client.Counter({
  name: 'ticket_evidence_verdict_total',
  help: 'Evidence verdict distribution',
  labelNames: ['verdict'],
  registers: [register],
});

// Safety gate interventions
export const safetyGateCounter = new client.Counter({
  name: 'safety_gate_interventions_total',
  help: 'Safety gate interventions',
  labelNames: ['reason'],
  registers: [register],
});

// Human review counter
export const humanReviewCounter = new client.Counter({
  name: 'ticket_human_review_total',
  help: 'Cases requiring human review',
  labelNames: ['case_type'],
  registers: [register],
});

// Metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};