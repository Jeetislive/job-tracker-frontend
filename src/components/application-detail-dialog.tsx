'use client';

import { useRef, useState } from 'react';
import { useApplication, useCreateNote, useDeleteDocument, useDeleteNote, useUpdateNote, useUploadDocument } from '@/hooks/use-applications';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useConfirm } from '@/hooks/use-confirm';
import {
  X,
  Pencil,
  Plus,
  Upload,
  ExternalLink,
  MapPin,
  Calendar,
  Activity as ActivityIcon,
  Paperclip,
  ChevronDown,
  Trash2,
  Download,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { APPLICATION_STATUSES, ApplicationStatus, STATUS_LABELS } from '@/types';

interface Props {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onEdit?: () => void;
}

const STATUS_BADGE: Record<ApplicationStatus, 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'> = {
  SAVED: 'saved',
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
};

const MAX_DOC_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export function ApplicationDetailDialog({
  applicationId,
  open,
  onOpenChange,
  onUpdated,
  onEdit,
}: Props) {
  const { data: app, refetch } = useApplication(applicationId);
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newNote, setNewNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const createNote = useCreateNote(applicationId);
  const updateNote = useUpdateNote(applicationId);
  const deleteNote = useDeleteNote(applicationId);
  const uploadDoc = useUploadDocument(applicationId);
  const deleteDoc = useDeleteDocument(applicationId);

  if (!app) return null;

  const addNote = async () => {
    const text = newNote.trim();
    if (!text) return;
    try {
      await createNote.mutateAsync(text);
      setNewNote('');
      refetch();
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const startEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(content);
  };

  const saveEditedNote = async () => {
    if (!editingNoteId) return;
    const text = editingNoteContent.trim();
    if (!text) return;
    try {
      await updateNote.mutateAsync({ noteId: editingNoteId, content: text });
      setEditingNoteId(null);
      setEditingNoteContent('');
      refetch();
      toast.success('Note updated');
    } catch {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const ok = await confirm({
      title: 'Delete note?',
      description: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteNote.mutateAsync(noteId);
      refetch();
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const moveTo = async (status: ApplicationStatus) => {
    setMoveOpen(false);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
      refetch();
      onUpdated?.();
    } catch {
      toast.error('Failed to move');
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_DOC_BYTES) return `${file.name} is larger than 10 MB`;
    if (!ALLOWED_MIME.includes(file.type)) return `${file.name} has unsupported type (${file.type || 'unknown'})`;
    return null;
  };

  const handleFileUpload = async (file: File) => {
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      await uploadDoc.mutateAsync(file);
      refetch();
      toast.success(`Uploaded ${file.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to upload document';
      toast.error(msg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadDocument = async (docId: string) => {
    try {
      const { data } = await api.get<{ downloadUrl: string }>(
        `/documents/${docId}/download`,
      );
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to get download link');
    }
  };

  const handleDeleteDoc = async (docId: string, filename: string) => {
    const ok = await confirm({
      title: `Delete ${filename}?`,
      description: 'This will remove the file from this application.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDoc.mutateAsync(docId);
      refetch();
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const salary =
    app.salaryMin || app.salaryMax
      ? app.salaryMin && app.salaryMax && app.salaryMin !== app.salaryMax
        ? `${formatCurrency(app.salaryMin)} – ${formatCurrency(app.salaryMax)}`
        : formatCurrency(app.salaryMin ?? app.salaryMax ?? null)
      : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-w-[92vw] w-full h-full sm:h-auto sm:max-h-[88vh] p-0 sm:rounded-lg rounded-none gap-0 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-5 pb-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold leading-tight truncate">{app.company}</h2>
            <p className="text-[14px] text-text-secondary mt-0.5 truncate">{app.title}</p>
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
              <Badge variant={STATUS_BADGE[app.status]} size="sm">
                {STATUS_LABELS[app.status]}
              </Badge>
              {app.archived && (
                <Badge variant="outline" size="sm">
                  Archived
                </Badge>
              )}
              <span className="text-meta text-text-tertiary">
                Added {formatDate(app.createdAt)}
              </span>
            </div>
            {/* Tags row (BUG-2) */}
            {app.tags && app.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {app.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center text-[11.5px] font-medium px-1.5 py-0.5 rounded-sm bg-surface-sunken text-text-secondary border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onEdit();
                }}
                className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 px-5 py-3.5 border-b border-border relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoveOpen(!moveOpen)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-2.5 h-7 text-[12px] font-semibold text-text-secondary hover:bg-surface-sunken"
            >
              Move to <ChevronDown className="h-3 w-3" />
            </button>
            {moveOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoveOpen(false)} />
                <div className="absolute z-50 top-full mt-1 left-0 min-w-[190px] bg-surface border border-border rounded-md shadow-md-dark p-1.5">
                  {APPLICATION_STATUSES.filter((s) => s !== app.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => moveTo(s)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-surface-sunken text-left"
                    >
                      <span
                        className="stage-dot"
                        style={{
                          background:
                            s === 'SAVED' ? '#9AA3AE' :
                            s === 'APPLIED' ? '#5B9BF8' :
                            s === 'INTERVIEW' ? '#F5B23D' :
                            s === 'OFFER' ? '#3FBF97' : '#F0676C',
                        }}
                      />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => document.getElementById('add-note-input')?.focus()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add note
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDoc.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploadDoc.isPending ? 'Uploading…' : 'Upload document'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-6">
            {app.url && (
              <div className="col-span-2">
                <div className="text-[12px] text-text-tertiary mb-1">Job URL</div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline"
                >
                  {app.url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <div>
              <div className="text-[12px] text-text-tertiary mb-1">Location</div>
              <div className="text-[14px] font-medium flex items-center gap-1.5">
                {app.location ? (
                  <>
                    <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                    {app.location}
                  </>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-text-tertiary mb-1">Salary range</div>
              <div className="text-[14px] font-medium">{salary}</div>
            </div>
            <div>
              <div className="text-[12px] text-text-tertiary mb-1">Follow-up date</div>
              <div className="text-[14px] font-medium flex items-center gap-1.5">
                {app.followUpDate ? (
                  <>
                    <Calendar className="h-3.5 w-3.5 text-stage-interview" />
                    {formatDate(app.followUpDate)}
                  </>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[12px] text-text-tertiary mb-1">Description</div>
              <div className="text-[14px] font-normal text-text-secondary leading-relaxed">
                {app.description || 'No description added yet.'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes">Notes ({app.notes.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="documents">Documents ({app.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-2.5">
              {app.notes.length === 0 && (
                <div className="text-center py-6 text-text-tertiary text-[13px]">
                  No notes yet.
                </div>
              )}
              {app.notes.map((note) => {
                const isEditing = editingNoteId === note.id;
                return (
                  <div key={note.id} className="group rounded-md border border-border bg-surface p-3">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteContent('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEditedNote}
                            disabled={updateNote.isPending || !editingNoteContent.trim()}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[13px] text-text-primary whitespace-pre-wrap leading-relaxed flex-1">
                            {note.content}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditNote(note.id, note.content)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
                              aria-label="Edit note"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-danger"
                              aria-label="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-[12px] text-text-tertiary">
                          <span>{note.user.name || note.user.email}</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 items-end mt-4">
                <Textarea
                  id="add-note-input"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note…"
                  className="min-h-[44px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote();
                  }}
                />
                <Button
                  onClick={addNote}
                  disabled={createNote.isPending || !newNote.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-0">
              {app.activities.length === 0 && (
                <div className="text-center py-6 text-text-tertiary text-[13px]">
                  No activity yet.
                </div>
              )}
              {app.activities.map((a) => (
                <div key={a.id} className="flex gap-3 py-2.5">
                  <div className="h-[26px] w-[26px] rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0">
                    <ActivityIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-text-primary capitalize">
                      {a.action.replace(/_/g, ' ')}
                    </p>
                    {typeof a.details === 'object' && a.details !== null && 'from' in a.details && 'to' in a.details && (
                      <p className="text-[12px] text-text-tertiary mt-0.5">
                        {String((a.details as Record<string, unknown>).from)} → {String((a.details as Record<string, unknown>).to)}
                      </p>
                    )}
                    <p className="text-[12px] text-text-tertiary mt-0.5">
                      {(a.user.name || a.user.email)} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="documents">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-2 border border-dashed rounded-md py-5 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-accent bg-accent-tint'
                    : 'border-border-strong hover:border-accent hover:bg-surface-sunken'
                }`}
              >
                <Upload className="h-4 w-4 text-text-tertiary" />
                <span className="text-[13px] text-text-secondary">
                  Drop a file or click to upload (PDF, DOC, DOCX, PNG, JPEG — max 10 MB)
                </span>
              </div>

              {app.documents.length === 0 ? (
                <div className="text-center py-6 text-text-tertiary text-[13px]">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {app.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-start gap-2.5 rounded-md border border-border bg-surface p-3"
                    >
                      <button
                        type="button"
                        onClick={() => downloadDocument(doc.id)}
                        className="h-8 w-8 rounded-md bg-[rgba(91,155,248,0.14)] text-[#5B9BF8] flex items-center justify-center shrink-0 hover:opacity-80"
                        aria-label={`Download ${doc.filename}`}
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => downloadDocument(doc.id)}
                          className="text-[13px] font-semibold truncate text-left hover:text-accent w-full"
                        >
                          {doc.filename}
                        </button>
                        <p
                          className="text-[11.5px] text-text-tertiary mt-0.5 truncate"
                          title={`${doc.mimeType}`}
                        >
                          {(doc.fileSize / 1024).toFixed(1)} KB · {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => downloadDocument(doc.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-accent"
                          aria-label="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}