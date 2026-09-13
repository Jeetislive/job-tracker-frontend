'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Mail, Unplug } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui/button';
import {
  useDisconnectSource,
  useIngestSources,
  useUpdateIngestSettings,
} from '@/hooks/use-ingest-sources';

export function EmailIngestion() {
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirm();
  const { data } = useIngestSources();
  const updateSettings = useUpdateIngestSettings();
  const disconnect = useDisconnectSource();

  const settings = data?.settings;
  const emailSource = data?.sources.find((s) => s.type === 'email');
  const estimated = `auto-${(user?.id ?? '').slice(0, 8)}@jobtrack.app`;
  const address = emailSource?.identifier ?? estimated;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Forwarding address copied');
    } catch {
      toast.error('Could not copy — select the address manually');
    }
  };

  const toggle = async (key: 'saveEmailBody' | 'telegramNotifyEnabled' | 'emailIngestEnabled') => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({ [key]: !settings[key] } as never);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleDisconnect = async () => {
    if (!emailSource) return;
    const ok = await confirm({
      title: 'Disconnect email?',
      description: 'Email forwarding will stop. Existing imported applications stay in your board.',
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync(emailSource.id);
      toast.success('Email disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="px-5 py-4 flex items-start gap-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-accent-tint text-accent flex items-center justify-center shrink-0">
          <Mail className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14.5px] font-semibold">Email</h3>
          <p className="text-[12.5px] text-text-tertiary mt-0.5">
            Forward your job-application emails to this address and they will be extracted
            automatically.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <div className="text-[12px] text-text-tertiary mb-1.5">Your JobTrack forwarding address</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-sm border border-border-strong bg-surface-sunken px-2.5 py-1.5 text-[13px] font-mono text-text-primary">
              {address}
            </code>
            <Button size="sm" variant="secondary" onClick={copyAddress}>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
        </div>

        <details className="group rounded-md border border-border bg-surface-sunken p-3">
          <summary className="cursor-pointer text-[13px] font-medium text-text-secondary list-none flex items-center justify-between">
            Setup instructions — Gmail filter
            <span className="text-text-tertiary group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-[12.5px] text-text-secondary">
            <li>
              In Gmail, create a filter for emails sent to <code className="text-text-primary">{address}</code>.
            </li>
            <li>
              Choose <em>Forward to</em> <code className="text-text-primary">{address}</code>.
            </li>
            <li>Also check <em>Never send it to Spam</em>.</li>
            <li>Save the filter and apply it to existing conversations if needed.</li>
          </ol>
        </details>

        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <div className="text-[13.5px] font-medium">Save email body</div>
              <div className="text-[12px] text-text-tertiary mt-0.5">
                Keep the raw message text so you can re-check extraction. Privacy trade-off.
              </div>
            </div>
            <input
              type="checkbox"
              className="h-[15px] w-[15px] accent-accent shrink-0"
              checked={!!settings?.saveEmailBody}
              onChange={() => toggle('saveEmailBody')}
              disabled={!settings || updateSettings.isPending}
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <div className="text-[13.5px] font-medium">Notify me on Telegram on new import</div>
              <div className="text-[12px] text-text-tertiary mt-0.5">
                Requires a connected Telegram account below.
              </div>
            </div>
            <input
              type="checkbox"
              className="h-[15px] w-[15px] accent-accent shrink-0"
              checked={!!settings?.telegramNotifyEnabled}
              onChange={() => toggle('telegramNotifyEnabled')}
              disabled={!settings || updateSettings.isPending}
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <div className="text-[13.5px] font-medium">Email ingestion enabled</div>
              <div className="text-[12px] text-text-tertiary mt-0.5">
                Master switch — turn everything off without deleting your address.
              </div>
            </div>
            <input
              type="checkbox"
              className="h-[15px] w-[15px] accent-accent shrink-0"
              checked={!!settings?.emailIngestEnabled}
              onChange={() => toggle('emailIngestEnabled')}
              disabled={!settings || updateSettings.isPending}
            />
          </label>
        </div>

        {emailSource && (
          <div className="pt-2">
            <Button size="sm" variant="outline" className="text-danger hover:bg-danger-tint" onClick={handleDisconnect}>
              <Unplug className="h-3.5 w-3.5" />
              Disconnect email
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}