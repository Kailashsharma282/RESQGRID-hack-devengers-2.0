import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Initialize Prometheus registry
export const register = new client.Registry();

// Enable default runtime metrics (heap, cpu, event loop)
client.collectDefaultMetrics({ register, prefix: 'resqgrid_' });

// HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: 'resqgrid_http_requests_total',
  help: 'Total number of HTTP requests made to ResQGrid API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'resqgrid_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2.5, 5],
  registers: [register],
});

// Active incidents gauge
export const activeIncidentsGauge = new client.Gauge({
  name: 'resqgrid_active_incidents_count',
  help: 'Current count of active emergency incidents across the grid',
  registers: [register],
});

// Dispatched resources gauge
export const dispatchedResourcesGauge = new client.Gauge({
  name: 'resqgrid_dispatched_resources_count',
  help: 'Current count of emergency units actively assigned or en route',
  registers: [register],
});

// Middleware to record request metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    const route = req.baseUrl + (req.route?.path || req.path);

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      },
      durationInSeconds
    );
  });

  next();
}
