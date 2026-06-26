import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'queuestorm'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics based on architecture design
export const requestDuration = new client.Histogram({
  name: 'ticket_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30] // Up to 30s as per timeout limit
});
register.registerMetric(requestDuration);

export const groqCallDuration = new client.Histogram({
  name: 'groq_call_duration_seconds',
  help: 'Duration of Groq API calls in seconds',
  buckets: [0.5, 1, 2, 5, 10, 20]
});
register.registerMetric(groqCallDuration);

export const safetyViolationsBlocked = new client.Counter({
  name: 'safety_violations_blocked_total',
  help: 'Total number of safety violations caught by the safety gate'
});
register.registerMetric(safetyViolationsBlocked);

export const schemaRetries = new client.Counter({
  name: 'schema_validation_retries_total',
  help: 'Total number of Groq API retries due to schema validation failure'
});
register.registerMetric(schemaRetries);

// Middleware to expose metrics endpoint
export const metricsRoute = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
};

// Middleware to track request duration
export const trackMetrics = (req: Request, res: Response, next: NextFunction) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
  });
  next();
};
