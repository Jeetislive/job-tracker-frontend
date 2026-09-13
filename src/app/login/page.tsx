'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Bounce signed-in users away from /login
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (isHydrated && user) router.replace('/dashboard');
  }, [isHydrated, user, router]);

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      const signedIn = useAuthStore.getState().user;
      if (signedIn?.emailVerified === false) {
        toast.info('Please verify your email — check your inbox for the confirmation link.');
      }
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="bg-glow" />
      <div className="bg-grid" />

      <Card className="relative z-10 w-full max-w-[360px] border-border bg-surface shadow-lg-dark">
        <CardHeader className="items-center text-center pb-6">
          <Link href="/" className="flex items-center gap-2 mb-6 font-bold">
            <div className="h-[22px] w-[22px] rounded-md bg-accent" />
            <span className="text-[15px] font-bold">JobTrack</span>
          </Link>
          <CardTitle className="text-[21px] font-bold">Welcome back</CardTitle>
          <CardDescription className="text-[13.5px] text-text-secondary">
            Sign in to pick up your search where you left it.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-0">
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(errors.password && 'border-danger', 'pr-9')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[12px] text-danger">{errors.password.message}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer">
                <input type="checkbox" className="h-[15px] w-[15px] accent-accent" />
                Remember me
              </label>
              <button
                type="button"
                className="text-[13px] font-semibold text-accent hover:underline bg-transparent p-0"
                onClick={() => toast.info('Password reset is coming soon.')}
              >
                Forgot password?
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-[13px] text-text-secondary text-center pt-2 border-t border-border w-full mt-2">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-accent font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}