import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secret.js';

export const jwtService = {
  async generateToken(userId) {
    return await jwt.sign({ userId }, JWT_SECRET);
  },

  async verifyToken(token) {
    try {
      return await jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error("Error verifying token: ", error);
      return null;
    }
  }
}