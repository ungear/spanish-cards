import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'cards.db');

export class DbService {
  constructor() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating data directory:', err);
    }

    this.db = new Database(dbPath);
  }

  saveCard(word, translation, example) {
    const stmt = this.db.prepare(
      'INSERT INTO cards (word, translation, example) VALUES (?, ?, ?)'
    );
    const result = stmt.run(word, translation, example || null);
    return result.lastInsertRowid;
  }

  getAllCards() {
    return this.db.prepare('SELECT * FROM cards ORDER BY created_at DESC').all();
  }
}
