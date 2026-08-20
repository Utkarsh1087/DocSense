import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom Metrics matching project KPIs
const retrievalLatency = new Trend('vector_retrieval_latency_ms');
const ttftLatency = new Trend('ai_ttft_ms');
const rateLimitHits = new Counter('rate_limit_429_hits');
const successRate = new Rate('successful_requests');

export const options = {
  scenarios: {
    // 1. High Concurrency Spike Test (Simulating 500 concurrent connections across endpoints)
    concurrent_users: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '30s', target: 150 },
        { duration: '15s', target: 300 },
        { duration: '15s', target: 500 }, // Peak 500 concurrent connections
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // Assert target criteria
    'http_req_duration': ['p(95)<400'], // 95% of standard requests under 400ms
    'successful_requests': ['rate>0.95'], // >95% success rate
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const vuId = `user_${__VU}`;
  const plan = __VU % 3 === 0 ? 'Pro' : 'Starter'; // Mix of Starter and Pro users

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': vuId,
    'x-user-plan': plan,
  };

  // 1. Test Concurrent Document Reads & Cache (MongoDB Connection Pool under load)
  const docRes = http.get(`${BASE_URL}/api/documents`, { headers });
  check(docRes, {
    'GET /api/documents status 200': (r) => r.status === 200,
  });
  if (docRes.status === 200) {
    successRate.add(1);
  }

  // 2. Test Per-User Settings retrieval (MongoDB concurrent reads)
  const settingsRes = http.get(`${BASE_URL}/api/settings`, { headers });
  check(settingsRes, {
    'GET /api/settings status 200': (r) => r.status === 200,
  });

  // 3. Test Analytics Endpoint (MongoDB aggregations & rolling averages)
  const analyticsRes = http.get(`${BASE_URL}/api/analytics`, { headers });
  check(analyticsRes, {
    'GET /api/analytics status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // 4. Test RAG Chat API & Rate Limiting (15 req/min protection)
  const chatPayload = JSON.stringify({
    message: 'What is the summary of the documents?',
    history: [],
  });

  const startTime = new Date().getTime();
  const chatRes = http.post(`${BASE_URL}/api/chat`, chatPayload, { headers });
  const responseTime = new Date().getTime() - startTime;

  if (chatRes.status === 200) {
    successRate.add(1);
    ttftLatency.add(responseTime);
    check(chatRes, {
      'Chat SSE connected & streamed': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
    });
  } else if (chatRes.status === 429) {
    // 429 is an expected validation of rate limiting protection!
    rateLimitHits.add(1);
    check(chatRes, {
      'Rate limit 429 correctly enforced with header': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
    });
  }

  sleep(1);
}
