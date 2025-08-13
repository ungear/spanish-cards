import crypto from 'node:crypto';
import { jwtService } from './jwtService.js';
import { DbService } from './dbService.js';

export const userService = {
  async createUser(name: string, email: string, password: string, dbService: DbService) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    return dbService.createUser(name, email, hashedPassword);
  },

  async loginUser(email: string, password: string, dbService: DbService) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = dbService.getUserByPassword(email, hashedPassword);
    if(!user) return null;

    const jwt = await jwtService.generateToken(user.id);
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email
    }
    return { jwt, userData };
  }
}
