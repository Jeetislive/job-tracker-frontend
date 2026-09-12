'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import {
  Application,
  APPLICATION_STATUSES,
  ApplicationStatus,
  STATUS_LABELS,
} from '@/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  company: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  status: z.enum(APPLICATION_STATUSES as [ApplicationStatus, ...ApplicationStatus[]]),
  salaryMin: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
  salaryMax: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
  description: z.string().optional(),
  followUpDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editing?: Application | null;
  presetStatus?: ApplicationStatus;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editing,
  presetStatus,
}: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: presetStatus ?? 'SAVED',
      company: '',
      title: '',
      url: '',
      location: '',
      salaryMin: '',
      salaryMax: '',
      description: '',
      followUpDate: '',
    },
  });

  useEffect(() => {
    if (editing) {
      reset({
        company: editing.company,
        title: editing.title,
        url: editing.url ?? '',
        location: editing.location ?? '',
        status: editing.status,
        salaryMin: (editing.salaryMin as number | null | undefined) ?? '',
        salaryMax: (editing.salaryMax as number | null | undefined) ?? '',
        description: editing.description ?? '',
        followUpDate: editing.followUpDate?.slice(0, 10) ?? '',
      });
      setTags(editing.tags ?? []);
    } else if (open) {
      reset({
        status: presetStatus ?? 'SAVED',
        company: '',
        title: '',
        url: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        description: '',
        followUpDate: '',
      });
      setTags([]);
    }
  }, [editing, open, presetStatus, reset]);

  const statusValue = watch('status');

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        url: data.url || undefined,
        salaryMin: data.salaryMin === '' ? undefined : Number(data.salaryMin),
        salaryMax: data.salaryMax === '' ? undefined : Number(data.salaryMax),
        followUpDate: data.followUpDate || undefined,
        tags,
      };
      if (editing) {
        await api.patch(`/applications/${editing.id}`, payload);
        toast.success('Application updated');
      } else {
        await api.post('/applications', payload);
        toast.success('Application added');
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit application' : 'Add application'}</DialogTitle>
        </DialogHeader>

        <form
          id="application-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 overflow-y-auto pr-1 -mr-1 scrollbar-thin"
          style={{ maxHeight: 'calc(88vh - 160px)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>
                Company name <span className="text-danger">*</span>
              </Label>
              <Input
                {...register('company')}
                placeholder="e.g. Verdant Systems"
                className={cn(errors.company && 'border-danger')}
              />
              {errors.company && (
                <span className="text-[12px] text-danger">{errors.company.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Job title <span className="text-danger">*</span>
              </Label>
              <Input
                {...register('title')}
                placeholder="e.g. Backend Engineer"
                className={cn(errors.title && 'border-danger')}
              />
              {errors.title && (
                <span className="text-[12px] text-danger">{errors.title.message}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Job URL</Label>
            <Input {...register('url')} placeholder="https://company.com/careers/role" />
            {errors.url && <span className="text-[12px] text-danger">{errors.url.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>
                Status <span className="text-danger">*</span>
              </Label>
              <Select
                value={statusValue}
                onValueChange={(v) => setValue('status', v as ApplicationStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Input {...register('location')} placeholder="Remote / City, State" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Salary — min</Label>
              <Input type="number" {...register('salaryMin')} placeholder="90000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Salary — max</Label>
              <Input type="number" {...register('salaryMax')} placeholder="120000" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              placeholder="What's the role, and anything worth remembering about it?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Follow-up date</Label>
            <Input type="date" {...register('followUpDate')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5 border border-border-strong rounded-sm px-2 py-1.5 focus-within:border-accent">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium px-1.5 py-0.5 rounded-sm bg-surface-sunken text-text-secondary border border-border"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag…"
                className="flex-1 min-w-[100px] bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={addTag}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-[12px] text-text-tertiary">Press Enter to add</span>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="application-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}