# Nginx Load Balancer Configuration Plan

## Overview

This document explains the design decisions behind the Nginx reverse proxy configuration used for the backend infrastructure. The configuration is designed to provide:

* Intelligent load balancing
* Automatic failover
* Rate limiting
* Request retries
* Performance optimization
* Detailed monitoring
* Production-ready reliability

---

# Architecture Overview

```
                    Client
                       │
                       ▼
                ┌─────────────┐
                │    Nginx    │
                │  Port : 80  │
                └─────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
   Backend 1                    Backend 2
   app1:3001                    app2:3002
```

Nginx acts as a reverse proxy between clients and backend application servers. It distributes incoming requests across multiple backend instances while providing security, monitoring, and automatic recovery from failures.

---

# Configuration Improvements

## 1. Load Balancing

### Configuration

* Uses `least_conn`

### Why?

Instead of the default **Round Robin** algorithm, `least_conn` always forwards new requests to the backend with the fewest active connections.

### Benefits

* Better distribution of long-running requests
* Prevents one server from becoming overloaded
* Improves overall throughput

---

## 2. Backend Health Checks

### Configuration

```nginx
max_fails=3
fail_timeout=30s
```

### Why?

If a backend fails three times within thirty seconds, Nginx temporarily removes it from the load balancing pool.

### Benefits

* Prevents traffic from being sent to unhealthy servers
* Automatically recovers once the backend becomes healthy
* Improves application reliability

---

## 3. Keepalive Connections

### Configuration

```nginx
keepalive 32;
```

### Why?

Instead of opening a new TCP connection for every request, Nginx reuses existing upstream connections.

### Benefits

* Lower latency
* Reduced TCP handshake overhead
* Better CPU utilization

---

## 4. Rate Limiting

### Configuration

```nginx
10 requests/second
burst = 20
```

### Why?

Limits how many requests each client IP can send.

### Benefits

* Prevents abuse
* Protects against simple DDoS attacks
* Ensures fair resource allocation

If a client exceeds the configured limit, Nginx responds with **HTTP 429 (Too Many Requests).**

---

## 5. Request Timeouts

### Configuration

```nginx
proxy_read_timeout 35s;
```

### Why?

The hackathon allows requests to run for up to **30 seconds**.

Setting Nginx to **35 seconds** provides a small safety margin while avoiding premature request termination.

### Benefits

* Avoids unnecessary timeouts
* Matches backend processing expectations

---

## 6. Detailed Logging

### Configuration

A custom `log_format` records:

* Client IP
* Requested URL
* Status code
* Backend server
* Connection time
* Header time
* Total response time

### Benefits

* Easier debugging
* Performance analysis
* Bottleneck identification
* Request tracing

---

## 7. Proxy Buffering

### Configuration

```nginx
proxy_buffering on;
proxy_buffers 8 8k;
```

### Why?

Buffers backend responses before sending them to clients.

### Benefits

* Better handling of large API responses
* Reduced blocking
* Improved throughput for LLM responses

---

## 8. Forwarded Headers

### Configuration

```nginx
X-Forwarded-For
X-Real-IP
```

### Why?

Passes the client's original IP address to the backend.

### Benefits

* Accurate logging
* Security auditing
* IP-based authentication
* Analytics

---

## 9. Retry Logic

### Configuration

```nginx
proxy_next_upstream
```

Maximum retries:

* 2

### Why?

If one backend returns:

* HTTP 500
* HTTP 502
* HTTP 503
* HTTP 504
* Timeout

Nginx automatically retries another backend.

### Benefits

* Higher availability
* Better fault tolerance
* Transparent recovery

---

## 10. Cache Control

### Configuration

```nginx
Cache-Control: no-cache
```

### Why?

Ensures dynamic API responses are never cached by the proxy.

### Benefits

* Fresh responses
* No stale data
* Correct API behavior

---

## 11. Nginx Health Endpoint

### Endpoint

```
/nginx-health
```

### Why?

Provides a lightweight endpoint for monitoring systems.

### Benefits

Can be used by:

* Docker
* Kubernetes
* AWS ELB
* Prometheus
* Grafana
* Uptime monitors

---

# Request Flow

```
Client
   │
   ▼
Nginx
   │
   ├──────────────► Rate Limiting
   │
   ├──────────────► Load Balancer
   │
   ▼
Select Backend
   │
   ├────────► app1
   │
   └────────► app2
   │
   ▼
Backend Response
   │
   ▼
Client
```

---

## Step 1 – Rate Limiting

Incoming requests first pass through the rate limiter.

* Maximum 10 requests per second
* Burst capacity of 20 requests

If exceeded:

```
HTTP 429 Too Many Requests
```

---

## Step 2 – Load Balancing

Nginx selects the backend with the fewest active connections.

Algorithm:

```
least_conn
```

---

## Step 3 – Backend Processing

The selected backend processes the request.

If the backend:

* crashes
* times out
* returns a 5xx response

Nginx retries another healthy backend automatically.

---

## Step 4 – Response

The successful response is returned to the client with appropriate headers, including cache-control directives.

---

# Docker Compose Integration

Example structure:

```yaml
services:
  app1:
    build: ./backend
    environment:
      - PORT=3001

  app2:
    build: ./backend
    environment:
      - PORT=3002

  nginx:
    image: nginx:alpine

    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

    ports:
      - "80:80"

    depends_on:
      - app1
      - app2
```

## Notes

* Both backend containers must be on the same Docker network.
* The Nginx configuration is mounted as a read-only volume.
* Nginx listens on port **80**.
* Requests are forwarded to both backend instances.

---

# Monitoring

## Access Logs

```
/var/log/nginx/access.log
```

Contains:

* Request URI
* Client IP
* Backend selected
* Response status
* Upstream connection time
* Header time
* Total request duration

---

## Error Logs

```
/var/log/nginx/error.log
```

Useful for:

* Backend failures
* Timeout debugging
* Configuration issues
* Upstream connection problems

---

## Health Endpoint

```
GET /nginx-health
```

Returns a simple success response if Nginx itself is operational.

---

# Summary

This Nginx configuration provides:

* Intelligent load balancing using `least_conn`
* Automatic backend health detection
* Upstream connection reuse with keepalive
* Per-IP rate limiting
* Automatic retries on backend failures
* Optimized buffering for large responses
* Forwarding of the client's real IP
* Detailed request timing logs
* Protection against proxy caching of dynamic content
* A lightweight health endpoint for monitoring systems

Overall, this setup is suitable for production deployments where reliability, observability, and performance are important.
