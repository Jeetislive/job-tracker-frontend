import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { VerifyEmailBanner } from '@/components/verify-email-banner';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('sonner', () => {
  const callable = vi.fn((..._args: unknown[]) => '');
  return {
    toast: Object.assign(callable, {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

describe('VerifyEmailBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.post as ReturnType<typeof vi.fn>).mockReset();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    sessionStorage.clear();
    useAuthStore.setState({ user: null, isHydrated: true });
  });

  it('is hidden when the user is verified', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com', name: 'A', emailVerified: true } });
    render(<VerifyEmailBanner />);
    expect(screen.queryByText(/Verify your email/)).not.toBeInTheDocument();
  });

  it('is hidden when there is no user', () => {
    render(<VerifyEmailBanner />);
    expect(screen.queryByText(/Verify your email/)).not.toBeInTheDocument();
  });

  it('is shown when the user is unverified', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com', name: 'A', emailVerified: false } });
    render(<VerifyEmailBanner />);
    expect(screen.getByText(/Verify your email to keep your account safe/)).toBeInTheDocument();
  });

  it('resends to /auth/resend-verification with the user email and enters cooldown', async () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com', name: 'A', emailVerified: false } });
    render(<VerifyEmailBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Resend verification email/i }));
    expect(api.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'a@b.com' });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const resendButton = screen.getByRole('button', { name: /Resend in 30s/i });
    expect(resendButton).toBeDisabled();
  });

  it('can be dismissed for the session', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com', name: 'A', emailVerified: false } });
    render(<VerifyEmailBanner />);
    expect(screen.getByText(/Verify your email to keep your account safe/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(screen.queryByText(/Verify your email to keep your account safe/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('jt:verify-banner-dismissed')).toBe('1');
  });
});