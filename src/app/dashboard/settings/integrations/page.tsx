'use client';

import { useRouter } from 'next/navigation';
import { EmailIngestion } from '@/components/integrations/email-ingestion';
import { TelegramSetup } from '@/components/integrations/telegram-setup';
import { ExtractionSettings } from '@/components/integrations/extraction-settings';

export default function IntegrationsSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-[860px] mx-auto px-8 py-8 flex gap-8">
        <nav className="w-[200px] shrink-0 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings')}
            className="text-left px-3 py-2 rounded-sm text-[13.5px] font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings')}
            className="text-left px-3 py-2 rounded-sm text-[13.5px] font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
          >
            Notifications
          </button>
          <button
            type="button"
            className="text-left px-3 py-2 rounded-sm text-[13.5px] font-medium bg-accent-tint text-accent font-semibold"
            aria-current="page"
          >
            Integrations
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings')}
            className="text-left px-3 py-2 rounded-sm text-[13.5px] font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
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

        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <h1 className="text-h1">Integrations</h1>
            <p className="text-[13px] text-text-tertiary mt-1">
              Auto-import the jobs you apply to, straight from your inbox or Telegram.
            </p>
          </div>
          <EmailIngestion />
          <TelegramSetup />
          <ExtractionSettings />
        </div>
      </div>
    </div>
  );
}