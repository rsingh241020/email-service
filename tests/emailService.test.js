const EmailService = require("../src/emailService");

jest.mock("../src/mockProviders", () => {
  class MockProvider {
    constructor(name) {
      this.name = name;
    }
    async sendEmail(emailId, to, subject, body) {
      return { success: true, provider: this.name, emailId };
    }
  }
  return {
    PrimaryProvider: class extends MockProvider {
      constructor() {
        super("PrimaryProvider");
      }
    },
    SecondaryProvider: class extends MockProvider {
      constructor() {
        super("SecondaryProvider");
      }
    },
  };
});

describe("EmailService", () => {
  let emailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  test("sends email successfully with primary provider", async () => {
    await emailService.queueEmail("1", "test@example.com", "Subject", "Body");
    await new Promise(resolve => setTimeout(resolve, 100));
    const status = emailService.getEmailStatus("1");
    expect(status.status).toBe("SENT");
    expect(status.provider).toBe("PrimaryProvider");
  });

  test("prevents duplicate sends with idempotency", async () => {
    await emailService.queueEmail("2", "test@example.com", "Subject", "Body");
    await new Promise(resolve => setTimeout(resolve, 100));
    await emailService.queueEmail("2", "test@example.com", "Subject", "Body");
    await new Promise(resolve => setTimeout(resolve, 100));
    const status = emailService.getEmailStatus("2");
    expect(status.status).toBe("SENT");
  });

  test("enforces rate limiting", async () => {
    for (let i = 0; i < 10; i++) {
      await emailService.queueEmail(`${i}`, "test@example.com", "Subject", "Body");
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await expect(
      emailService.queueEmail("11", "test@example.com", "Subject", "Body")
    ).rejects.toThrow("Rate limit exceeded");
  });

  test("queues emails correctly", async () => {
    await emailService.queueEmail("3", "test@example.com", "Subject", "Body");
    await new Promise(resolve => setTimeout(resolve, 100));
    const status = emailService.getEmailStatus("3");
    expect(status.status).toBe("SENT");
  });
});