import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { User } from '../typing/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../', 'data', 'cards.db');

export class DbService {
  private db: Database.Database;
  constructor() {
    try {
      const dataDir = path.join(__dirname, '../../', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating data directory:', err);
    }

    this.db = new Database(dbPath);
  }

  saveCard(word: string, translation: string, example: string, userId: string) {
    const stmt = this.db.prepare(
      'INSERT INTO cards (word, translation, example, user_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(word, translation, example || null, userId);
    return result.lastInsertRowid;
  }

  updateCardLevel(id: string, newLevel: number, newRepeatDate: Date) {
    const stmt = this.db.prepare(
      'UPDATE cards SET level = ?, next_repeat = datetime(?) WHERE id = ?'
    );
    const result = stmt.run(newLevel, newRepeatDate.toISOString(), id);
    return result.changes;
  }

  updateCard(id: string, word: string, translation: string, example: string) {
    const stmt = this.db.prepare('UPDATE cards SET word = ?, translation = ?, example = ? WHERE id = ?');
    const result = stmt.run(word, translation, example || null, id);
    return result.changes;
  }

  getAllCards(userId: string) {
    return this.db.prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC').all(userId );
  }

  getCardsToTrain(userId: string) {
    const now = new Date().toISOString();
    return this.db.prepare('SELECT * FROM cards WHERE user_id = ? AND next_repeat < ? ORDER BY next_repeat ASC').all(userId, now);
  }
  resetAllCards() {
    const now = new Date().toISOString();
    return this.db.prepare('UPDATE cards SET level = 0, next_repeat = datetime(?)').run(now);
  }
  createUser(name: string, email: string, password: string) {
    const stmt = this.db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, password);
    return result.lastInsertRowid;
  }
  
  getUserByPassword(email: string, password: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
    const result = stmt.get(email, password) as User;
    return result;
  }

  getUserById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(id);
    return result;
  }
}
