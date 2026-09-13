'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
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
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch {
      // Even on error, show the same generic success — anti-enumeration
      setSent(true);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden bg-bg">
      <div className="bg-glow" />
      <div className="bg-grid" />
      <Card className="relative z-10 w-full max-w-[360px] border-border bg-surface shadow-lg-dark">
        <CardHeader className="items-center text-center pb-6">
          <CardTitle className="text-[21px] font-bold">Forgot your password?</CardTitle>
          <CardDescription className="text-[13.5px] text-text-secondary">
            Enter your email and we&apos;ll send a reset link if an account exists.
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="pt-0 text-center">
            <p className="text-[13px] text-text-secondary">
              If an account exists for that email, we&apos;ve sent a password reset link. Check
              your inbox.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-3.5 pt-0">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-[12px] text-danger">{errors.email.message}</span>
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
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </CardFooter>
          </form>
        )}

        <div className="px-5 pb-5 text-center text-[13px] text-text-secondary">
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Back to sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}