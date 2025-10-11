import { describe, it, expect } from 'vitest';
import { addPoints, multiplierForStreak, updateStreak, applyBadgeUnlocks, applyStreakAchievements, ACHIEVEMENTS } from './logic';

describe('gamification logic', () => {
  it('caps multiplier at 1.5', () => {
    expect(multiplierForStreak(0)).toBe(1);
    expect(multiplierForStreak(3)).toBeCloseTo(1.3);
    expect(multiplierForStreak(10)).toBe(1.5);
  });

  it('updates streak correctly across days', () => {
    const p0 = { points: 0, badges: [], achievements: [], lastPlayDate: null, streak: 0 };
    const p1 = updateStreak(p0, '2025-01-01');
    expect(p1.streak).toBe(1);
    const p2 = updateStreak(p1, '2025-01-02');
    expect(p2.streak).toBe(2);
    const p3 = updateStreak(p2, '2025-01-05'); // gap resets
    expect(p3.streak).toBe(1);
  });

  it('adds points with streak multiplier and records achievements', () => {
    const start = { points: 0, badges: [], achievements: [], gamesPlayed: 0, streak: 3 };
    const next = addPoints(start, 10, { mission: 'quiz', event: 'completed' });
    expect(next.points).toBe(13); // 10 * 1.3 rounded
    expect(next.gamesPlayed).toBe(1);
    expect(next.achievements).toContain(ACHIEVEMENTS.FIRST_QUIZ);
  });

  it('unlocks badges when thresholds met', () => {
    const p = { points: 160, badges: [], achievements: [] };
    const withBadges = applyBadgeUnlocks(p);
    expect(withBadges.badges).toEqual(expect.arrayContaining(['seedling', 'streamkeeper', 'river-guardian']));
  });

  it('adds streak achievements at day 3 and 7', () => {
    let p = { points: 0, badges: [], achievements: [], streak: 3 };
    p = applyStreakAchievements(p);
    expect(p.achievements).toContain(ACHIEVEMENTS.STREAK_3);
    p = { ...p, streak: 7 };
    p = applyStreakAchievements(p);
    expect(p.achievements).toContain(ACHIEVEMENTS.STREAK_7);
  });
});
