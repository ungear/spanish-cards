import { describe, it, expect } from 'vitest';
import { levelupCard, leveldownCard } from './trainingService.js';

describe('levelupCard', () => {
  it('should increment level from 0 to 1 and set repeat date to 1 day later', () => {
    const result = levelupCard(0);
    expect(result.newLevel).toBe(1);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now());
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 25 * 60 * 60 * 1000); // Within 25 hours
  });

  it('should increment level from 1 to 2 and set repeat date to 3 days later', () => {
    const result = levelupCard(1);
    expect(result.newLevel).toBe(2);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now() + 2.5 * 24 * 60 * 60 * 1000);
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 3.5 * 24 * 60 * 60 * 1000);
  });

  it('should increment level from 2 to 3 and set repeat date to 7 days later', () => {
    const result = levelupCard(2);
    expect(result.newLevel).toBe(3);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now() + 6.5 * 24 * 60 * 60 * 1000);
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 7.5 * 24 * 60 * 60 * 1000);
  });

  it('should increment level from 3 to 4 and set repeat date to 14 days later', () => {
    const result = levelupCard(3);
    expect(result.newLevel).toBe(4);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now() + 13.5 * 24 * 60 * 60 * 1000);
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 14.5 * 24 * 60 * 60 * 1000);
  });

  it('should increment level from 4 to 5 and set repeat date to 28 days later', () => {
    const result = levelupCard(4);
    expect(result.newLevel).toBe(5);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now() + 27.5 * 24 * 60 * 60 * 1000);
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 28.5 * 24 * 60 * 60 * 1000);
  });

  it('should keep level 5 and set repeat date to 28 days later', () => {
    const result = levelupCard(5);
    expect(result.newLevel).toBe(5);
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now() + 27.5 * 24 * 60 * 60 * 1000);
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 28.5 * 24 * 60 * 60 * 1000);
  });
});

describe('leveldownCard', () => {
  it('should set repeat date to 1 day later', () => {
    const result = leveldownCard();
    expect(result.newRepeatDate.getTime()).toBeGreaterThan(Date.now());
    expect(result.newRepeatDate.getTime()).toBeLessThan(Date.now() + 25 * 60 * 60 * 1000); // Within 25 hours
  });
}); 