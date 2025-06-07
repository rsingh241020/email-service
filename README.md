Email Service Project
Overview
A resilient email-sending service built in JavaScript, using mock providers to simulate email sending. This project demonstrates key features like retries, fallback, idempotency, rate limiting, and status tracking, along with bonus features like a circuit breaker, logging, and a queue system. It also includes an Express API for sending emails.
Setup

Clone the repository.
Install dependencies: npm install.
Run the API server: npm start.
Run the demo (in a separate terminal): npm run demo.
Run tests: npm test.

Running the Demo

Use npm run demo to run the demo in index.js.
The demo sends 15 emails in three phases:
Emails 1–5: Shows retry logic, fallback, and circuit breaker.
Resend Email-1: Demonstrates idempotency by skipping duplicate sends.
Emails 6–15: Demonstrates rate limiting (emails 11–15 should fail due to the 10 emails/minute limit).



API Usage
The project includes an Express API with the following endpoints:
Deployed API
The API is deployed on Render and can be accessed at:

Base URL: https://email-service-js.onrender.com

POST /send-email

Description: Queues an email to be sent.
Request Body:{
  "to": "rsingh241020@gmail.com",
  "subject": "Test Email",
  "body": "Hello, World!"
}


Response (202 Accepted):{
  "emailId": "email-123456789",
  "status": "QUEUED"
}


Example:curl -X POST https://email-service-js.onrender.com/send-email -H "Content-Type: application/json" -d '{"to":"test@example.com","subject":"Test Email","body":"Hello!"}'




GET /status/:emailId

Description: Retrieves the status of an email.
Response (200 OK):{
  "status": "SENT",
  "provider": "PrimaryProvider",
  "error": null,
  "timestamp": "2025-06-07T07:10:07.023Z"
}


Example:curl https://email-service-1gu2.onrender.com/status/email-123456789





Features

Retry Mechanism: Retries failed sends with exponential backoff (1s, 2s, 4s).
Fallback: Switches to a secondary provider if the primary fails.
Idempotency: Prevents duplicate emails using an in-memory Set.
Rate Limiting: Limits to 10 emails per minute.
Status Tracking: Tracks email status (PENDING, SENT, FAILED).
Circuit Breaker: Stops sending to failing providers after 3 failures.
Logging: Logs operations with timestamps.
Queue System: Processes emails asynchronously.

Assumptions

Uses mock providers (no real email sending).
In-memory storage for idempotency and status tracking (using Set and Map).
Rate limit is 10 emails per minute.
Circuit breaker reset timeout is 30 seconds.
Exponential backoff for retries uses delays of 1s, 2s, and 4s.

Project Structure

src/
emailService.js: Core email-sending logic.
mockProviders.js: Mock email providers.
circuitBreaker.js: Circuit breaker implementation.
logger.js: Logging utility.
queue.js: Queue system for async processing.
server.js: Express API server.


tests/
emailService.test.js: Unit tests.


index.js: Demo script.
package.json: Project metadata and scripts.

