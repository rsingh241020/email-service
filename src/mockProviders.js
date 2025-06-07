class MockEmailProvider {
  constructor(name) {
    this.name = name;
  }

  async sendEmail(emailId, to, subject, body) {
    if (Math.random() < 0.8) { // 80% failure rate for PrimaryProvider
      throw new Error(`${this.name} failed to send email`);
    }
    return { success: true, provider: this.name, emailId };
  }
}

class PrimaryProvider extends MockEmailProvider {
  constructor() {
    super("PrimaryProvider");
  }
}

class SecondaryProvider extends MockEmailProvider {
  constructor() {
    super("SecondaryProvider");
  }

  async sendEmail(emailId, to, subject, body) {
    // Always succeed for SecondaryProvider
    return { success: true, provider: this.name, emailId };
  }
}

module.exports = { PrimaryProvider, SecondaryProvider };