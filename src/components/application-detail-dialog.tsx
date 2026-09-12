'use client';

import { useState } from 'react';
import { useApplication } from '@/hooks/use-applications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExternalLink, Banknote, MapPin, Calendar, FileText, Activity as ActivityIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function ApplicationDetailDialog({
  applicationId,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const { data: app, refetch } = useApplication(applicationId);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!app) return null;

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/applications/${applicationId}/notes`, { content: newNote });
      setNewNote('');
      refetch();
      onUpdated?.();
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {app.company}
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{app.title}</p>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {app.location && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {app.location}
            </p>
          )}
          {(app.salaryMin || app.salaryMax) && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="h-4 w-4" />
              {formatCurrency(app.salaryMin ?? 0)}
              {app.salaryMax ? ` – ${formatCurrency(app.salaryMax)}` : ''}
            </p>
          )}
          {app.followUpDate && (
            <p className="flex items-center gap-2 text-amber-600">
              <Calendar className="h-4 w-4" />
              Follow up by {formatDate(app.followUpDate)}
            </p>
          )}
          {app.description && (
            <p className="text-sm bg-muted/40 p-3 rounded-md mt-3 whitespace-pre-wrap">
              {app.description}
            </p>
          )}
        </div>

        <Tabs defaultValue="notes" className="mt-4">
          <TabsList>
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-1" />
              Notes ({app.notes.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <ActivityIcon className="h-4 w-4 mr-1" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-1" />
              Documents ({app.documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note…"
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
              />
              <Button onClick={addNote} disabled={submitting} size="sm">
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {app.notes.map((note) => (
                <div key={note.id} className="rounded-md border bg-card p-3 text-sm">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.user.name || note.user.email} · {formatDate(note.createdAt)}
                  </p>
                </div>
              ))}
              {app.notes.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">No notes yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-2">
            {app.activities.map((a) => (
              <div
                key={a.id}
                className="text-sm flex items-start gap-2 border-l-2 border-primary/30 pl-3 py-1"
              >
                <div>
                  <p className="font-medium capitalize">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.user.name || a.user.email} · {formatDate(a.createdAt)}
                  </p>
                  {a.details && (
                    <pre className="text-xs text-muted-foreground mt-1">
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="documents" className="space-y-2">
            {app.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(doc.fileSize / 1024).toFixed(1)} KB · {formatDate(doc.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {app.documents.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No documents uploaded
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}