import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secret.js';
import { JwtPayload } from '../typing/jwt.js';

export const jwtService = {
  async generateToken(userId: string) {
    const payload: JwtPayload = { userId };
    return await jwt.sign(payload, JWT_SECRET);
  },

  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      return await jwt.verify(token, JWT_SECRET) as JwtPayload | null;
    } catch (error) {
      console.error("Error verifying token: ", error);
      return null;
    }
  }
}