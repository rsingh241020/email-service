const EmailService = require("./src/emailService");

module.exports = { EmailService };

if (require.main === module) {
  const emailService = new EmailService();

  async function demo() {
    console.log("Starting email sending demo...\n");

    // Send 5 emails to show retries, fallback, and circuit breaker
    for (let i = 1; i <= 5; i++) {
      const emailId = `email-${i}`;
      console.log(`Sending email ${i} (ID: ${emailId})...`);
      try {
        await emailService.queueEmail(
          emailId,
          `user${i}@example.com`,
          `Test Subject ${i}`,
          `Hello, World! This is email ${i}.`
        );
        // Wait for the queue to process the email (up to 10 seconds for retries)
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log(`Email status for ${emailId}:`, emailService.getEmailStatus(emailId));
      } catch (error) {
        console.error(`Error sending email ${emailId}:`, error.message);
      }
    }

    // Demonstrate idempotency by resending email-1
    console.log("\nDemonstrating idempotency by resending email-1...");
    try {
      await emailService.queueEmail(
        "email-1",
        "user1@example.com",
        "Test Subject 1",
        "Hello, World! This is email 1."
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Email status for email-1 (after resend):`, emailService.getEmailStatus("email-1"));
    } catch (error) {
      console.error(`Error resending email-1:`, error.message);
    }

    // Demonstrate rate limiting by sending 10 more emails
    console.log("\nDemonstrating rate limiting by sending 10 more emails...");
    for (let i = 6; i <= 15; i++) {
      const emailId = `email-${i}`;
      console.log(`Sending email ${i} (ID: ${emailId})...`);
      try {
        await emailService.queueEmail(
          emailId,
          `user${i}@example.com`,
          `Test Subject ${i}`,
          `Hello, World! This is email ${i}.`
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Email status for ${emailId}:`, emailService.getEmailStatus(emailId));
      } catch (error) {
        console.error(`Error sending email ${emailId}:`, error.message);
      }
    }

    console.log("\nDemo complete!");
  }

  demo();
}