import net from 'net';
import tls from 'tls';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './encryption';

const prisma = new PrismaClient();

// Helper to decode length prefix from MikroTik API
function decodeLength(buffer, offset) {
  if (offset >= buffer.length) return { value: -1, bytes: 0 };
  const first = buffer[offset];
  if ((first & 0x80) === 0x00) {
    return { value: first, bytes: 1 };
  } else if ((first & 0xC0) === 0x80) {
    if (offset + 1 >= buffer.length) return { value: -1, bytes: 0 };
    const value = ((first & 0x3F) << 8) | buffer[offset + 1];
    return { value, bytes: 2 };
  } else if ((first & 0xE0) === 0xC0) {
    if (offset + 2 >= buffer.length) return { value: -1, bytes: 0 };
    const value = ((first & 0x1F) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2];
    return { value, bytes: 3 };
  }
  // Let's assume standard short words for simplicity
  return { value: first, bytes: 1 };
}

// Helper to encode length prefix
function encodeLength(len) {
  if (len < 0x80) {
    return Buffer.from([len]);
  } else if (len < 0x4000) {
    return Buffer.from([(len >> 8) | 0x80, len & 0xFF]);
  } else if (len < 0x200000) {
    return Buffer.from([(len >> 16) | 0xC0, (len >> 8) & 0xFF, len & 0xFF]);
  }
  return Buffer.from([0]);
}

// Helper to encode a sentence
function encodeSentence(words) {
  const buffers = [];
  for (const word of words) {
    const wordBuf = Buffer.from(word, 'utf8');
    buffers.push(encodeLength(wordBuf.length));
    buffers.push(wordBuf);
  }
  buffers.push(Buffer.from([0])); // Sentence terminator
  return Buffer.concat(buffers);
}

// RouterOS API connection class
class RouterOSConnection {
  constructor(host, port, user, password, useSsl = false) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.useSsl = useSsl;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.connected = false;
    this.replyCallbacks = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const options = { host: this.host, port: this.port, rejectUnauthorized: false };
        this.socket = this.useSsl 
          ? tls.connect(options)
          : net.connect({ host: this.host, port: this.port });

        this.socket.on('connect', () => {
          this.connected = true;
          this.login()
            .then(resolve)
            .catch((err) => {
              this.close();
              reject(err);
            });
        });

        this.socket.on('data', (data) => {
          this.buffer = Buffer.concat([this.buffer, data]);
          this.parseBuffer();
        });

        this.socket.on('error', (err) => {
          reject(err);
        });

        this.socket.on('close', () => {
          this.connected = false;
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  login() {
    // Standard API login (v6.43+)
    return this.send([
      '/login',
      `=name=${this.user}`,
      `=password=${this.password}`
    ]).then((replies) => {
      const isDone = replies.some(r => r.sentence[0] === '!done');
      const isTrap = replies.some(r => r.sentence[0] === '!trap');
      if (isDone && !isTrap) {
        return true;
      }
      throw new Error(replies.find(r => r.sentence[0] === '!trap')?.message || 'Login failed');
    });
  }

  send(words) {
    if (!this.connected) return Promise.reject(new Error('Not connected'));
    return new Promise((resolve) => {
      const callback = (replies) => {
        resolve(replies);
      };
      this.replyCallbacks.push({ replies: [], callback });
      this.socket.write(encodeSentence(words));
    });
  }

  parseBuffer() {
    let offset = 0;
    while (offset < this.buffer.length) {
      const sentenceWords = [];
      let sentenceEnded = false;

      let currentOffset = offset;
      while (currentOffset < this.buffer.length) {
        const { value: wordLen, bytes: lenBytes } = decodeLength(this.buffer, currentOffset);
        if (wordLen === -1) break; // Not enough data for length prefix
        if (wordLen === 0) {
          // Zero length word means sentence is finished
          currentOffset += lenBytes;
          sentenceEnded = true;
          break;
        }

        currentOffset += lenBytes;
        if (currentOffset + wordLen > this.buffer.length) {
          // Not enough data for word content
          break;
        }

        const word = this.buffer.toString('utf8', currentOffset, currentOffset + wordLen);
        sentenceWords.push(word);
        currentOffset += wordLen;
      }

      if (sentenceEnded) {
        // We fully parsed a sentence
        this.buffer = this.buffer.subarray(currentOffset);
        offset = 0; // restart parsing the new subarray

        this.handleSentence(sentenceWords);
      } else {
        // Sentence not complete, wait for more data
        break;
      }
    }
  }

  handleSentence(words) {
    if (words.length === 0) return;
    const currentCallbackObj = this.replyCallbacks[0];
    if (!currentCallbackObj) return;

    const sentenceType = words[0];
    const item = { sentence: words, message: '' };

    // Format error message if trap
    if (sentenceType === '!trap') {
      const messageWord = words.find(w => w.startsWith('=message='));
      if (messageWord) {
        item.message = messageWord.substring(9);
      }
    }

    currentCallbackObj.replies.push(item);

    if (sentenceType === '!done' || sentenceType === '!fatal') {
      this.replyCallbacks.shift();
      currentCallbackObj.callback(currentCallbackObj.replies);
    }
  }

  close() {
    if (this.socket) {
      this.socket.destroy();
    }
    this.connected = false;
  }
}

// Main service helper to fetch router settings and create a connection instance
async function getRouterConnection() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'single-settings' }
  });

  if (!settings || !settings.routerHost || !settings.routerUser) {
    throw new Error('Router is not configured');
  }

  const password = decrypt(settings.routerPasswordEnc);
  const conn = new RouterOSConnection(
    settings.routerHost,
    settings.routerPort,
    settings.routerUser,
    password,
    settings.routerPort === 8729 // Use SSL if port is 8729
  );

  await conn.connect();
  return conn;
}

export async function checkRouterConnection() {
  try {
    const conn = await getRouterConnection();
    conn.close();
    return { status: 'ONLINE', message: 'Connected to MikroTik Router successfully' };
  } catch (error) {
    console.error('Router connection failed:', error.message);
    return { status: 'OFFLINE', message: error.message };
  }
}

export async function addHotspotUser(username, password, profile, limitUptimeSec = 0, macAddress = null) {
  let conn;
  try {
    conn = await getRouterConnection();

    // 1. Check if user already exists
    const findRes = await conn.send([
      '/ip/hotspot/user/print',
      `?name=${username}`
    ]);

    const userExists = findRes.some(r => r.sentence[0] === '!re');

    const cmd = userExists ? ['/ip/hotspot/user/set'] : ['/ip/hotspot/user/add'];
    
    if (userExists) {
      const idWord = findRes.find(r => r.sentence[0] === '!re')?.sentence.find(w => w.startsWith('=.id='));
      if (idWord) cmd.push(idWord);
    } else {
      cmd.push(`=name=${username}`);
    }

    cmd.push(`=password=${password}`);
    cmd.push(`=profile=${profile}`);

    if (limitUptimeSec > 0) {
      // MikroTik limit-uptime format is e.g. "1h", "2d", or seconds
      cmd.push(`=limit-uptime=${limitUptimeSec}s`);
    } else {
      cmd.push('=limit-uptime=0'); // unlimited
    }

    if (macAddress) {
      cmd.push(`=mac-address=${macAddress}`);
    }

    const res = await conn.send(cmd);
    const hasTrap = res.some(r => r.sentence[0] === '!trap');
    if (hasTrap) {
      throw new Error(res.find(r => r.sentence[0] === '!trap').message);
    }
    return { success: true };
  } catch (error) {
    console.error('Add hotspot user failed:', error.message);
    throw error;
  } finally {
    if (conn) conn.close();
  }
}

export async function removeHotspotUser(username) {
  let conn;
  try {
    conn = await getRouterConnection();

    const findRes = await conn.send([
      '/ip/hotspot/user/print',
      `?name=${username}`
    ]);

    const idWord = findRes.find(r => r.sentence[0] === '!re')?.sentence.find(w => w.startsWith('=.id='));
    if (idWord) {
      const res = await conn.send([
        '/ip/hotspot/user/remove',
        idWord
      ]);
      const hasTrap = res.some(r => r.sentence[0] === '!trap');
      if (hasTrap) throw new Error(res.find(r => r.sentence[0] === '!trap').message);
    }
    return { success: true };
  } catch (error) {
    console.error('Remove hotspot user failed:', error.message);
    throw error;
  } finally {
    if (conn) conn.close();
  }
}

export async function disconnectHotspotUser(username) {
  let conn;
  try {
    conn = await getRouterConnection();

    // Find and remove active session
    const findRes = await conn.send([
      '/ip/hotspot/active/print',
      `?user=${username}`
    ]);

    const idWord = findRes.find(r => r.sentence[0] === '!re')?.sentence.find(w => w.startsWith('=.id='));
    if (idWord) {
      const res = await conn.send([
        '/ip/hotspot/active/remove',
        idWord
      ]);
      const hasTrap = res.some(r => r.sentence[0] === '!trap');
      if (hasTrap) throw new Error(res.find(r => r.sentence[0] === '!trap').message);
    }
    return { success: true };
  } catch (error) {
    console.error('Disconnect hotspot user failed:', error.message);
    throw error;
  } finally {
    if (conn) conn.close();
  }
}
