'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

type Section = 'profile' | 'notifications' | 'danger';

export default function SettingsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [section, setSection] = useState<Section>('profile');
  const [name, setName] = useState(user?.name ?? '');

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-[860px] mx-auto px-8 py-8 flex gap-8">
        {/* Side nav */}
        <nav className="w-[200px] shrink-0 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSection('profile')}
            className={`text-left px-3 py-2 rounded-sm text-[13.5px] font-medium ${
              section === 'profile'
                ? 'bg-accent-tint text-accent font-semibold'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setSection('notifications')}
            className={`text-left px-3 py-2 rounded-sm text-[13.5px] font-medium ${
              section === 'notifications'
                ? 'bg-accent-tint text-accent font-semibold'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
            }`}
          >
            Notifications
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings/integrations')}
            className="text-left px-3 py-2 rounded-sm text-[13.5px] font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
          >
            Integrations
          </button>
          <button
            type="button"
            onClick={() => setSection('danger')}
            className={`text-left px-3 py-2 rounded-sm text-[13.5px] font-medium ${
              section === 'danger'
                ? 'bg-accent-tint text-accent font-semibold'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
            }`}
          >
            Danger zone
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-left px-3 py-2 rounded-sm text-[13px] text-text-tertiary hover:text-text-primary"
          >
            ← Back to board
          </button>
        </nav>

        {/* Sections */}
        <div className="flex-1 min-w-0">
          {section === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                  <span className="text-[12px] text-text-tertiary">
                    Saving your name requires a backend profile endpoint.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled />
                </div>
                <Button
                  disabled
                  onClick={() => toast.info('Profile updates coming soon.')}
                >
                  Save profile
                </Button>
              </CardContent>
            </Card>
          )}

          {section === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Control what you hear about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md border border-border bg-surface">
                  <div>
                    <div className="text-[14px] font-semibold">Email reminders</div>
                    <div className="text-[12px] text-text-tertiary mt-0.5">
                      We&apos;ll email you when a follow-up date arrives.
                    </div>
                  </div>
                  <span className="text-[12px] text-text-tertiary">
                    Always on (coming soon: per-user toggle)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'danger' && (
            <Card>
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
                <CardDescription>Irreversible actions for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md border border-danger/40 bg-danger-tint">
                  <div>
                    <div className="text-[14px] font-semibold text-danger">Delete account</div>
                    <div className="text-[12px] text-text-tertiary mt-0.5">
                      Deletes your account, applications, notes, and documents. Cannot be undone.
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    disabled
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete your account?',
                        description: 'This permanently deletes everything. Cannot be undone.',
                        confirmText: 'Delete account',
                        destructive: true,
                      });
                      if (!ok) return;
                      // TODO(BE): DELETE /api/auth/me — currently no endpoint
                      toast.info('Account deletion endpoint is coming soon.');
                      clear();
                      router.push('/login');
                    }}
                  >
                    Delete account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}