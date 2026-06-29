import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  makeInMemoryStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMessage } from './handlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'silent' });

export class WhatsAppBot {
  private sock: WASocket | null = null;
  private static instance: WhatsAppBot;

  private constructor() {}

  static getInstance(): WhatsAppBot {
    if (!WhatsAppBot.instance) {
      WhatsAppBot.instance = new WhatsAppBot();
    }
    return WhatsAppBot.instance;
  }

  async start(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(__dirname, '../auth')
    );

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger,
      browser: ['CYTAXI Bot', 'Safari', '3.0'],
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 Escanea el código QR para conectar');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          '❌ Conexión cerrada:',
          statusCode,
          shouldReconnect ? 'Reconectando...' : 'No reconectando'
        );

        if (shouldReconnect) {
          this.start();
        }
      }

      if (connection === 'open') {
        console.log('✅ Bot de WhatsApp conectado exitosamente');
      }
    });

    this.sock.ev.on('messages.upsert', async (messageUpdate) => {
      const { messages } = messageUpdate;

      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          await handleMessage(this.sock!, message);
        }
      }
    });
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.sock) {
      throw new Error('Bot not connected');
    }

    await this.sock.sendMessage(jid, { text });
  }

  async sendLocation(
    jid: string,
    lat: number,
    lon: number,
    name?: string,
    address?: string
  ): Promise<void> {
    if (!this.sock) {
      throw new Error('Bot not connected');
    }

    await this.sock.sendMessage(jid, {
      location: {
        latitudeDegrees: lat,
        longitudeDegrees: lon,
        name,
        address,
      },
    });
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      this.sock.end(undefined);
      console.log('🔌 Bot desconectado');
    }
  }
}

export const bot = WhatsAppBot.getInstance();
