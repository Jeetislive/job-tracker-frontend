'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      const next: PendingConfirm = { ...opts, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const handleClose = (v: boolean) => {
    if (pending) {
      pending.resolve(v);
      pendingRef.current = null;
      setPending(null);
    }
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}
      <Dialog open={!!pending} onOpenChange={(o) => !o && handleClose(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{pending?.title}</DialogTitle>
            {pending?.description && (
              <DialogDescription>{pending.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => handleClose(false)}>
              {pending?.cancelText ?? 'Cancel'}
            </Button>
            <Button
              variant={pending?.destructive ? 'danger' : 'default'}
              onClick={() => handleClose(true)}
            >
              {pending?.confirmText ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) {
    // Allow usage outside provider by falling back to a native confirm — keeps dev friction low.
    return (opts) =>
      new Promise<boolean>((resolve) => {
        const ok = window.confirm(opts.description ? `${opts.title}\n\n${opts.description}` : opts.title);
        resolve(ok);
      });
  }
  return ctx;
}