import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../../../app';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Production Health, Readiness & Metrics Endpoints', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('GET /health returns process liveness and memory stats with X-Response-Time header', async () => {
    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.data.memoryMb).toBeDefined();
    expect(res.headers.get('x-response-time')).toMatch(/ms$/);
  });

  it('GET /ready returns live database dependency health and replica set status', async () => {
    const res = await fetch(`${baseUrl}/ready`);

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ready');
    expect(body.data.dependencies.mongodb).toBeDefined();
    expect(body.data.dependencies.mongodb.status).toBe('up');
    expect(body.data.system).toBeDefined();
  });

  it('GET /metrics returns aggregated request telemetry', async () => {
    const res = await fetch(`${baseUrl}/metrics`);

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalRequests).toBeGreaterThanOrEqual(1);
    expect(body.data.statusCodes).toBeDefined();
    expect(body.data.memoryUsageMb).toBeDefined();
  });
});
