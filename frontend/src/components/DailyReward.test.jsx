import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyReward from './DailyReward';

describe('DailyReward UI', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows claim button when not claimed today and calls onClaim', () => {
    const onClaim = vi.fn();
    render(<DailyReward progress={{ streak: 2 }} onClaim={onClaim} />);
    expect(screen.getByText(/Daily bonus available/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(onClaim).toHaveBeenCalled();
  });

  it("shows 'claimed today' message after claim", () => {
    const onClaim = vi.fn();
    render(<DailyReward progress={{ streak: 1 }} onClaim={onClaim} />);
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(screen.getByText(/You have claimed today's reward/i)).toBeInTheDocument();
  });
});
