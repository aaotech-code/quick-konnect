'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { sendMessageAction, sendMessageWithAttachmentsAction } from '../actions';

type Attachment = {
  id: string;
  url: string;
  mime: string;
  sizeBytes: number;
};

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  attachments?: Attachment[];
};

export function ChatView(props: {
  threadId: string;
  currentUserId: string;
  initialMessages: Message[];
  isAdminView?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(props.initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh());
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    // Sync refreshed messages into state when they arrive via props
    setMessages(props.initialMessages);
  }, [props.initialMessages]);

  // ── Send text only
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setError(null); setSending(true);
    const optimistic: Message = {
      id: 'opt-' + Date.now(),
      senderId: props.currentUserId,
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((cur) => [...cur, optimistic]);
    setDraft('');

    const res = await sendMessageAction(props.threadId, body);
    setSending(false);
    if (!res.ok) {
      setMessages((cur) => cur.filter((m) => m.id !== optimistic.id));
      setError(res.error ?? 'Send failed.');
      setDraft(body);
      return;
    }
    setMessages((cur) =>
      cur.map((m) =>
        m.id === optimistic.id ? { ...m, id: res.id, createdAt: res.createdAt ?? m.createdAt } : m,
      ),
    );
  }

  // ── Send with attachments
  async function sendWithFiles() {
    if (pendingFiles.length === 0 && !draft.trim()) return;
    setError(null); setSending(true);

    const fd = new FormData();
    fd.append('threadId', props.threadId);
    fd.append('body', draft);
    pendingFiles.forEach((f, i) => fd.append('file_' + i, f));

    const res = await sendMessageWithAttachmentsAction(fd);
    setSending(false);

    if (!res.ok) {
      setError(res.error ?? 'Upload failed.');
      return;
    }

    setDraft('');
    setPendingFiles([]);
    router.refresh();
  }

  // ── File pickers
  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    setPendingFiles((cur) => [...cur, ...incoming].slice(0, 5));
    if (fileRef.current) fileRef.current.value = '';
  }

  function pickCamera(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    setPendingFiles((cur) => [...cur, ...incoming].slice(0, 5));
    if (cameraRef.current) cameraRef.current.value = '';
  }

  function removePending(idx: number) {
    setPendingFiles((cur) => cur.filter((_, i) => i !== idx));
  }

  // ── Voice recording
  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const ext = (rec.mimeType || '').includes('mp4') ? 'm4a' : (rec.mimeType || '').includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], 'voice-' + Date.now() + '.' + ext, { type: blob.type });
        setPendingFiles((cur) => [...cur, file].slice(0, 5));
        setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError('Could not access microphone. Check browser permissions.');
    }
  }

  function stopRecording() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setRecording(false);
  }

  function cancelRecording() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      audioChunksRef.current = [];
      rec.stop();
    }
    setRecording(false);
    setRecordingSeconds(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="mt-12 text-center text-sm text-white/40">
            No messages yet. Say hello.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === props.currentUserId;
            return (
              <div key={m.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={
                    'max-w-[80%] space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' +
                    (mine
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/[0.06] text-white/90 border border-white/[0.08]')
                  }
                >
                  {m.body && (
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  )}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="space-y-2">
                      {m.attachments.map((a) => (
                        <AttachmentView key={a.id} attachment={a} mine={mine} />
                      ))}
                    </div>
                  )}
                  <div className={'text-[10px] ' + (mine ? 'text-blue-100/70' : 'text-white/40')}>
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="sticky bottom-24 mb-2 rounded-xl border border-white/10 bg-[#0b0f16] p-3">
          <div className="mb-2 text-[11px] text-white/50">
            {pendingFiles.length} attachment{pendingFiles.length === 1 ? '' : 's'} ready
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-2.5 py-1.5">
                <span className="text-xs">{fileIcon(f.type)}</span>
                <span className="max-w-[120px] truncate text-[11px] text-white/70">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  className="text-xs text-white/40 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="sticky bottom-4 mt-2 rounded-2xl border border-white/[0.08] bg-[#080b11] p-2">
        {recording ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="flex h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-white/80">Recording…</span>
            <span className="font-mono text-xs text-white/50">{formatDuration(recordingSeconds)}</span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400"
              >
                Stop & attach
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf,audio/*"
              onChange={pickFile}
              className="hidden"
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={pickCamera}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
              title="Attach file"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
              title="Take photo"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>

            <button
              type="button"
              onClick={startRecording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
              title="Record voice note"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && pendingFiles.length === 0) {
                  e.preventDefault();
                  send(e as any);
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Type a message…"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              style={{ maxHeight: 160 }}
            />

            {pendingFiles.length > 0 ? (
              <button
                type="button"
                onClick={sendWithFiles}
                disabled={sending}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-40"
              >
                {sending ? '…' : 'Send'}
              </button>
            ) : (
              <button
                type="submit"
                onClick={send}
                disabled={sending || !draft.trim()}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400 disabled:opacity-40"
              >
                {sending ? '…' : 'Send'}
              </button>
            )}
          </div>
        )}

        {error && <div className="mt-2 px-3 text-[11px] text-red-300">{error}</div>}
      </div>
    </>
  );
}

// ─── Attachment renderer ─────────────────────────────────────
function AttachmentView({ attachment, mine }: { attachment: Attachment; mine: boolean }) {
  const { url, mime, sizeBytes } = attachment;
  const isImage = mime.startsWith('image/');
  const isAudio = mime.startsWith('audio/');
  const isPdf = mime === 'application/pdf';

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <div className="relative max-w-[260px] overflow-hidden rounded-xl border border-white/10">
          <Image
            src={url}
            alt="attachment"
            width={520}
            height={380}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </div>
      </a>
    );
  }

  if (isAudio) {
    return (
      <div className="flex min-w-[240px] items-center gap-2 rounded-xl bg-black/20 p-2">
        <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' + (mine ? 'bg-white/20' : 'bg-white/[0.08]')}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <audio controls src={url} className="h-8 w-full min-w-0 flex-1" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 transition hover:bg-black/30"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-200">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">PDF document</div>
          <div className="text-[10px] opacity-70">Tap to open · {formatBytes(sizeBytes)}</div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs hover:bg-black/30"
    >
      📎 Attachment · {formatBytes(sizeBytes)}
    </a>
  );
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('audio/')) return '🎤';
  if (mime === 'application/pdf') return '📄';
  return '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
