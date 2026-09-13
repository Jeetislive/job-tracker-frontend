'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useResendVerification } from '@/hooks/use-resend-verification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[0-9]/, 'Needs a number'),
});

type FormValues = z.infer<typeof schema>;

function passwordStrength(v: string): number {
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  return score;
}

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { resend, countdown, isPending } = useResendVerification();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Bounce signed-in users away from /register
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (isHydrated && user && !pendingEmail) router.replace('/dashboard');
  }, [isHydrated, user, pendingEmail, router]);

  const pw = watch('password') ?? '';
  const score = passwordStrength(pw);

  const onSubmit = async (data: FormValues) => {
    if (!terms) {
      setTermsError(true);
      toast.error('Please accept the terms to continue');
      return;
    }
    setTermsError(false);
    try {
      await registerUser(data.email, data.password, data.name);
      setPendingEmail(data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    }
  };

  const filledBars = pw.length === 0 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : score === 4 ? 3 : 4;
  const tier = pw.length === 0 ? null : score <= 2 ? 'weak' : score === 5 ? 'strong' : 'medium';
  const tierColor =
    tier === 'weak'
      ? 'bg-danger'
      : tier === 'medium'
      ? 'bg-stage-interview'
      : 'bg-accent';

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="bg-glow" />
      <div className="bg-grid" />

      <Card className="relative z-10 w-full max-w-[380px] border-border bg-surface shadow-lg-dark">
        <CardHeader className="items-center text-center pb-6">
          <Link href="/" className="flex items-center gap-2 mb-6 font-bold">
            <div className="h-[22px] w-[22px] rounded-md bg-accent" />
            <span className="text-[15px] font-bold">JobTrack</span>
          </Link>
          {pendingEmail ? (
            <>
              <CardTitle className="text-[21px] font-bold">Verify your email</CardTitle>
              <CardDescription className="text-[13.5px] text-text-secondary">
                We sent a link to <span className="text-text-primary font-medium">{pendingEmail}</span>.
                Click it to activate your account.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-[21px] font-bold">Create your account</CardTitle>
              <CardDescription className="text-[13.5px] text-text-secondary">
                Free while you&apos;re job hunting. No card required.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {pendingEmail ? (
          <>
            <CardContent className="pt-0 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent-tint flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-accent" />
              </div>
              <p className="text-[13px] text-text-secondary">
                You can start using JobTrack right away — but please confirm your email to keep
                your account safe.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                asChild
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <a href={`mailto:${pendingEmail}?subject=JobTrack%20email%20verification`}>
                  Open email client
                </a>
              </Button>
              <Button
                type="button"
                variant="default"
                className="w-full"
                size="lg"
                disabled={isPending || countdown > 0}
                onClick={() => resend(pendingEmail)}
              >
                {countdown > 0
                  ? `Resend email (${countdown}s)`
                  : isPending
                    ? 'Sending…'
                    : 'Resend email'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Continue to dashboard →
              </Button>
              <p className="text-[13px] text-text-secondary text-center pt-2 border-t border-border w-full mt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-accent font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3.5 pt-0">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Jordan Diaz"
                {...register('name')}
                className={cn(errors.name && 'border-danger')}
              />
              {errors.name && (
                <span className="text-[12px] text-danger">{errors.name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                {...register('email')}
                className={cn(errors.email && 'border-danger')}
              />
              {errors.email && (
                <span className="text-[12px] text-danger">{errors.email.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register('password')}
                className={cn(errors.password && 'border-danger')}
              />
              {pw.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-[3px] flex-1 rounded-full transition-colors',
                        i < filledBars ? tierColor : 'bg-border',
                      )}
                    />
                  ))}
                </div>
              )}
              <span className="text-[12px] text-text-tertiary">
                {pw.length === 0
                  ? 'At least 8 characters, one uppercase letter and one number'
                  : score < 5
                  ? 'Needs 8+ characters, an uppercase letter and a number'
                  : 'Strong password'}
              </span>
              {errors.password && (
                <span className="text-[12px] text-danger">{errors.password.message}</span>
              )}
            </div>

            <label
              className={cn(
                'flex items-start gap-2 text-[12.5px] text-text-secondary leading-snug pt-1 cursor-pointer',
                termsError && 'text-danger',
              )}
            >
              <input
                type="checkbox"
                className="h-[15px] w-[15px] mt-0.5 accent-accent"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  if (e.target.checked) setTermsError(false);
                }}
              />
              <span>
                I agree to the{' '}
                <a className="text-accent font-semibold hover:underline">Terms of Service</a> and{' '}
                <a className="text-accent font-semibold hover:underline">Privacy Policy</a>
              </span>
            </label>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-[13px] text-text-secondary text-center pt-2 border-t border-border w-full mt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
          </form>
        )}
      </Card>
    </main>
  );
}