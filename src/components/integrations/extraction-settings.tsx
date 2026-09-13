'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatSalaryRange } from '@/lib/utils';
import {
  useIngestSources,
  useTestExtraction,
  useUpdateIngestSettings,
} from '@/hooks/use-ingest-sources';
import type { ExtractionTestResult } from '@/types';

const SAMPLE = [
  'From: noreply@naukri.com',
  'Subject: Application sent to Acme Corp - Senior Software Engineer',
  '',
  'Applied on: 12-Sep-2026',
  'Job Id: NAU123456',
  'Location: Bangalore',
  'Salary: 15-20 LPA',
  '',
  'Your application for Senior Software Engineer at Acme Corp has been submitted.',
].join('\n');

export function ExtractionSettings() {
  const { data } = useIngestSources();
  const updateSettings = useUpdateIngestSettings();
  const test = useTestExtraction();
  const [text, setText] = useState('');
  const [result, setResult] = useState<ExtractionTestResult | null>(null);

  const settings = data?.settings;

  const toggleLlm = async () => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({ llmExtractionEnabled: !settings.llmExtractionEnabled });
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const runTest = async () => {
    if (!text.trim()) {
      toast.error('Paste a sample email first');
      return;
    }
    setResult(null);
    try {
      const res = await test.mutateAsync({ text });
      setResult(res);
    } catch {
      toast.error('Extraction test failed');
    }
  };

  const job = result?.job;
  const pathLabel = result?.path === 'llm' ? 'LLM' : 'regex';
  const confidence = job?.confidence != null ? Math.round(job.confidence * 100) : null;

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="px-5 py-4 flex items-start gap-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-accent-tint text-accent flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14.5px] font-semibold">Extraction</h3>
          <p className="text-[12.5px] text-text-tertiary mt-0.5">
            Regex-first, with an optional LLM fallback when the pattern match is unsure.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <div className="text-[13.5px] font-medium">Use LLM fallback when regex is unsure</div>
            <div className="text-[12px] text-text-tertiary mt-0.5">
              Estimated cost: &lt; $1/mo for typical usage.
            </div>
          </div>
          <input
            type="checkbox"
            className="h-[15px] w-[15px] accent-accent shrink-0"
            checked={!!settings?.llmExtractionEnabled}
            onChange={toggleLlm}
            disabled={!settings || updateSettings.isPending}
          />
        </label>

        <div className="rounded-md border border-border bg-surface-sunken p-4 space-y-2.5">
          <div className="text-[12.5px] font-medium text-text-secondary">Test extraction</div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a sample job-application email (subject + body)…"
            className="min-h-[140px] font-mono text-[12.5px]"
          />
          <div className="flex items-center justify-between gap-3">
            <Button size="sm" variant="secondary" onClick={() => setText(SAMPLE)}>
              Use sample
            </Button>
            <Button size="sm" onClick={runTest} disabled={test.isPending}>
              <FlaskConical className="h-3.5 w-3.5" />
              {test.isPending ? 'Running…' : 'Run test'}
            </Button>
          </div>

          {result && job && (
            <div className="rounded-md border border-border bg-surface p-3.5 mt-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[12px] text-text-tertiary">Extracted result</div>
                {confidence != null && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-accent-tint text-accent">
                    {confidence}% ({pathLabel})
                  </span>
                )}
              </div>
              <div className="text-[14px] font-semibold">{job.title ?? '—'}</div>
              <div className="text-[13px] text-text-secondary mt-0.5 mb-2">{job.company ?? '—'}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-text-tertiary">
                <span>{job.location || '—'}</span>
                <span>
                  {formatSalaryRange(job.salary?.min ?? null, job.salary?.max ?? null, job.salary?.currency)}
                </span>
                {job.platform && <span>platform: {job.platform}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}