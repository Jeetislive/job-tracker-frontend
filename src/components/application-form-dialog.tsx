'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

const schema = z.object({
  company: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  followUpDate: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApplicationFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/applications', {
        ...data,
        url: data.url || undefined,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        followUpDate: data.followUpDate || undefined,
      });
      toast.success('Application added');
      reset();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a new application</DialogTitle>
          <DialogDescription>Track a new opportunity in your pipeline</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Company *</label>
              <Input {...register('company')} placeholder="Acme Corp" />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <Input {...register('title')} placeholder="Senior Engineer" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">URL</label>
            <Input {...register('url')} placeholder="https://…" />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <Input {...register('location')} placeholder="Remote" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Follow-up date</label>
              <Input type="date" {...register('followUpDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Salary min</label>
              <Input type="number" {...register('salaryMin')} placeholder="100000" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Salary max</label>
              <Input type="number" {...register('salaryMax')} placeholder="150000" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Notes about the role…"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input {...register('tags')} placeholder="remote, react" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}