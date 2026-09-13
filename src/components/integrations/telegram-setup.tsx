'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Copy, ExternalLink, Unplug, Check } from 'lucide-react';
import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui/button';
import {
  useDisconnectSource,
  useIngestSources,
  useLinkTelegram,
} from '@/hooks/use-ingest-sources';

const POLL_MS = 5000;
const POLL_TIMEOUT_MS = 120_000;

export function TelegramSetup() {
  const confirm = useConfirm();
  const { data, refetch } = useIngestSources();
  const linkMutation = useLinkTelegram();
  const disconnect = useDisconnectSource();

  const settings = data?.settings;
  const telegramSource = data?.sources.find((s) => s.type === 'telegram');
  const connectedChatId = settings?.telegramChatId ?? null;

  const [wizard, setWizard] = useState<'idle' | 'link' | 'timeout'>('idle');
  const [linkInfo, setLinkInfo] = useState<{ token: string; deepLink: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  // If the account was already linked elsewhere, settle into the connected state.
  useEffect(() => {
    if (connectedChatId) setWizard('idle');
  }, [connectedChatId]);

  useEffect(() => {
    if (wizard !== 'link') return;
    stoppedRef.current = false;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const poll = async () => {
      if (stoppedRef.current) return;
      let chatId: string | null = null;
      try {
        const res = await refetch();
        chatId = res.data?.settings?.telegramChatId ?? null;
      } catch {
        /* transient — keep polling */
      }
      if (stoppedRef.current) return;
      if (chatId) {
        setWizard('idle');
        setLinkInfo(null);
        toast.success('Telegram connected 🎉');
        return;
      }
      if (Date.now() > deadline) {
        setWizard('timeout');
        return;
      }
      timerRef.current = setTimeout(poll, POLL_MS);
    };
    poll();

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wizard, refetch]);

  const startLink = async () => {
    try {
      const res = await linkMutation.mutateAsync();
      setLinkInfo({ token: res.token, deepLink: res.deepLink });
      setWizard('link');
    } catch {
      toast.error('Failed to start Telegram linking');
    }
  };

  const copyCode = async () => {
    if (!linkInfo) return;
    try {
      await navigator.clipboard.writeText(`/start ${linkInfo.token}`);
      toast.success('Command copied — paste into the bot');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleDisconnect = async () => {
    if (!telegramSource) return;
    const ok = await confirm({
      title: 'Disconnect Telegram?',
      description: 'Your chat will stop receiving import notifications and job captures.',
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync(telegramSource.id);
      toast.success('Telegram disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="px-5 py-4 flex items-start gap-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-[rgba(34,211,238,0.14)] text-cyan-500 flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14.5px] font-semibold">Telegram</h3>
          <p className="text-[12.5px] text-text-tertiary mt-0.5">
            Send applications to your inbox, or capture pasted messages from the bot.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {connectedChatId ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-sunken p-3">
              <div className="flex items-center gap-2 text-[13px] text-text-primary">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                {connectedChatId ? `Connected · chat ${connectedChatId}` : 'Connected'}
              </div>
              <Button size="sm" variant="outline" className="text-danger hover:bg-danger-tint" onClick={handleDisconnect}>
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
            <p className="text-[12px] text-text-tertiary">
              Tip: paste a forwarded job email or message into the bot with <code>/track</code> to
              capture it instantly.
            </p>
          </>
        ) : wizard === 'link' && linkInfo ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border bg-surface-sunken px-4 py-3">
              <div className="text-[12.5px] text-text-secondary mb-2">
                <strong>Step 1.</strong> Tap to open Telegram and send <code>/start</code> to the bot.
              </div>
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setWizard('link')}
              >
                <a href={linkInfo.deepLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Telegram
                </a>
              </Button>
            </div>
            <div className="rounded-md border border-border bg-surface-sunken px-4 py-3">
              <div className="text-[12.5px] text-text-secondary mb-2">
                <strong>Step 2 (backup).</strong> Didn&apos;t autofill? Send this one-time code to
                the bot — exactly as <code>/start &lt;code&gt;</code>:
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-sm border border-border-strong bg-surface px-2.5 py-1.5 text-[13px] font-mono text-text-primary">
                  /start {linkInfo.token}
                </code>
                <Button size="sm" variant="secondary" onClick={copyCode}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <div className="text-[11.5px] text-text-tertiary mt-2">
                Watching for the connection… (usually a few seconds, max 2 min)
              </div>
            </div>
            <Button size="sm" variant="ghost" className="justify-start self-start text-text-tertiary" onClick={() => setWizard('idle')}>
              Cancel
            </Button>
          </div>
        ) : wizard === 'timeout' ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-danger/40 bg-danger-tint px-4 py-3 text-[13px] text-text-primary">
              We didn&apos;t see the connection within 2 minutes. Make sure you opened the bot and
              sent <code>/start</code> (or the one-time code), then try again.
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={startLink} disabled={linkMutation.isPending}>
                {linkMutation.isPending ? 'Working…' : 'Try again'}
              </Button>
              <Button size="sm" variant="ghost" className="text-text-tertiary" onClick={() => setWizard('idle')}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-text-secondary">
              Not connected? Link your Telegram so you can capture jobs and get notified about new
              imports.
            </p>
            <Button size="sm" onClick={startLink} disabled={linkMutation.isPending} className="self-start">
              <Check className="h-3.5 w-3.5" />
              {linkMutation.isPending ? 'Starting…' : 'Connect Telegram'}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}