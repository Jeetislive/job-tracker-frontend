'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[0-9]/, 'Needs a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/reset-password', {
        token: params.token,
        newPassword: data.password,
      });
      // BE revokes all refresh tokens → clear local session
      clear();
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      const text = typeof msg === 'string' ? msg : 'Failed to reset password';
      toast.error(text);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden bg-bg">
      <div className="bg-glow" />
      <div className="bg-grid" />
      <Card className="relative z-10 w-full max-w-[380px] border-border bg-surface shadow-lg-dark">
        <CardHeader className="items-center text-center pb-6">
          <CardTitle className="text-[21px] font-bold">Set a new password</CardTitle>
          <CardDescription className="text-[13.5px] text-text-secondary">
            Choose a strong password to secure your account.
          </CardDescription>
        </CardHeader>

        {done ? (
          <CardContent className="pt-0 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent mb-4" />
            <p className="text-[13px] text-text-secondary">
              Password updated. Redirecting to sign in…
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-3.5 pt-0">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-[12px] text-danger">{errors.password.message}</span>
                )}
                <span className="text-[12px] text-text-tertiary">
                  ≥ 8 chars, with upper, lower and a number.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirm')}
                />
                {errors.confirm && (
                  <span className="text-[12px] text-danger">{errors.confirm.message}</span>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
              <Link
                href="/login"
                className="text-[13px] text-accent font-semibold hover:underline text-center"
              >
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </main>
  );
}