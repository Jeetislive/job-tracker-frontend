import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceBadge } from '@/components/source-badge';

describe('SourceBadge', () => {
  it('shows the correct label for known sources', () => {
    const { rerender } = render(<SourceBadge source="email:naukri" />);
    expect(screen.getByText('Naukri')).toBeInTheDocument();
    rerender(<SourceBadge source="telegram" />);
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    rerender(<SourceBadge source="email:linkedin" />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    rerender(<SourceBadge source="manual" />);
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('falls back to Manual for unknown or empty sources', () => {
    const { rerender } = render(<SourceBadge source={undefined} />);
    expect(screen.getByText('Manual')).toBeInTheDocument();
    rerender(<SourceBadge source="email:some-random-thing" />);
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });
});