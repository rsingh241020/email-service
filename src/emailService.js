const Logger = require("./logger");
const { PrimaryProvider, SecondaryProvider } = require("./mockProviders");
const CircuitBreaker = require("./circuitBreaker");
const Queue = require("./queue");

class EmailService {
  constructor() {
    this.logger = new Logger();
    this.primaryProvider = new PrimaryProvider();
    this.secondaryProvider = new SecondaryProvider();
    this.primaryBreaker = new CircuitBreaker();
    this.secondaryBreaker = new CircuitBreaker();
    this.sentEmails = new Set(); // For idempotency
    this.statuses = new Map(); // For status tracking
    this.rateLimitWindow = 60 * 1000; // 1 minute
    this.rateLimitMax = 10; // 10 emails per minute
    this.rateLimitCount = 0;
    this.rateLimitStart = Date.now();
    this.queue = new Queue(async ({ emailId, to, subject, body }) => {
      await this.sendEmail(emailId, to, subject, body);
    });
  }

  async retryOperation(operation, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) break;
        const delay = initialDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Retry attempt ${attempt} failed, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimitStart > this.rateLimitWindow) {
      this.rateLimitStart = now;
      this.rateLimitCount = 0;
    }
    if (this.rateLimitCount >= this.rateLimitMax) {
      throw new Error("Rate limit exceeded");
    }
    this.rateLimitCount++;
  }

  updateStatus(emailId, status, provider = null, error = null) {
    this.statuses.set(emailId, { status, provider, error, timestamp: new Date() });
    this.logger.log(`Email ${emailId}: ${status}${error ? ` - ${error.message}` : ""}`);
  }

  async sendEmail(emailId, to, subject, body) {
    if (this.sentEmails.has(emailId)) {
      this.logger.log(`Email ${emailId} already sent, skipping`);
      return { success: true, provider: this.statuses.get(emailId).provider, emailId };
    }

    this.checkRateLimit();
    this.updateStatus(emailId, "PENDING");

    try {
      try {
        const result = await this.retryOperation(() =>
          this.primaryBreaker.execute(() =>
            this.primaryProvider.sendEmail(emailId, to, subject, body)
          )
        );
        this.sentEmails.add(emailId);
        this.updateStatus(emailId, "SENT", result.provider);
        return result;
      } catch (error) {
        this.logger.error(`Primary provider failed: ${error.message}`);
        this.updateStatus(emailId, "FAILED_PRIMARY", null, error);

        const result = await this.retryOperation(() =>
          this.secondaryBreaker.execute(() =>
            this.secondaryProvider.sendEmail(emailId, to, subject, body)
          )
        );
        this.sentEmails.add(emailId);
        this.updateStatus(emailId, "SENT", result.provider);
        return result;
      }
    } catch (error) {
      this.updateStatus(emailId, "FAILED", null, error);
      throw error;
    }
  }

  async queueEmail(emailId, to, subject, body) {
    await this.queue.enqueue({ emailId, to, subject, body });
  }

  getEmailStatus(emailId) {
    return this.statuses.get(emailId) || { status: "NOT_FOUND" };
  }
}

module.exports = EmailService;