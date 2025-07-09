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

  updateCardLevel(id, newLevel, newRepeatDate) {
    const stmt = this.db.prepare(
      'UPDATE cards SET level = ?, next_repeat = datetime(?) WHERE id = ?'
    );
    const result = stmt.run(newLevel, newRepeatDate.toISOString(), id);
    return result.changes;
  }

  getAllCards() {
    return this.db.prepare('SELECT * FROM cards ORDER BY created_at DESC').all();
  }

  getCardsToTrain() {
    const now = new Date().toISOString();
    return this.db.prepare('SELECT * FROM cards WHERE next_repeat < ? ORDER BY next_repeat ASC').all(now);
  }
  resetAllCards() {
    const now = new Date().toISOString();
    return this.db.prepare('UPDATE cards SET level = 0, next_repeat = datetime(?)').run(now);
  }
  createUser(name, email, password) {
    const stmt = this.db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, password);
    return result.lastInsertRowid;
  }
  
  getUserByPassword(email, password) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
    const result = stmt.get(email, password);
    return result;
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(id);
    return result;
  }
}
