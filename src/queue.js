class Queue {
  constructor(processor) {
    this.items = [];
    this.isProcessing = false;
    this.processor = processor;
  }

  async enqueue(task) {
    this.items.push(task);
    if (!this.isProcessing) {
      await this.process();
    }
  }

  async process() {
    this.isProcessing = true;
    while (this.items.length > 0) {
      const task = this.items.shift();
      try {
        await this.processor(task);
      } catch (error) {
        console.error(`Queue processing error: ${error.message}`);
      }
    }
    this.isProcessing = false;
  }
}

module.exports = Queue;