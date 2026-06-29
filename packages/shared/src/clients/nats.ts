import { connect, NatsConnection, StringCodec } from 'nats';

const sc = StringCodec();

export class NatsClient {
  private connection: NatsConnection | null = null;
  private static instance: NatsClient;

  private constructor() {}

  static getInstance(): NatsClient {
    if (!NatsClient.instance) {
      NatsClient.instance = new NatsClient();
    }
    return NatsClient.instance;
  }

  async connect(url: string = process.env.NATS_URL || 'nats://localhost:4223'): Promise<void> {
    try {
      this.connection = await connect({ servers: url });
      console.log('✅ Connected to NATS');
    } catch (error) {
      console.error('❌ Failed to connect to NATS:', error);
      throw error;
    }
  }

  async publish(subject: string, data: unknown): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS not connected');
    }
    const encoded = sc.encode(JSON.stringify(data));
    this.connection.publish(subject, encoded);
  }

  async subscribe(subject: string, callback: (data: unknown) => void): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS not connected');
    }
    const sub = this.connection.subscribe(subject);
    (async () => {
      for await (const msg of sub) {
        const decoded = JSON.parse(sc.decode(msg.data));
        callback(decoded);
      }
    })();
  }

  async request(subject: string, data: unknown, timeout: number = 5000): Promise<unknown> {
    if (!this.connection) {
      throw new Error('NATS not connected');
    }
    const encoded = sc.encode(JSON.stringify(data));
    const msg = await this.connection.request(subject, encoded, { timeout: timeout });
    return JSON.parse(sc.decode(msg.data));
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      console.log('🔌 NATS connection closed');
    }
  }
}

export const nats = NatsClient.getInstance();
