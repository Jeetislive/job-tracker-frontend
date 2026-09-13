import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const router = useRouter();
  const storeLogout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const logout = useCallback(async () => {
    await storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  return { user, logout };
}