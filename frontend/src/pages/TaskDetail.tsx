import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { tasksApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Surface } from '../components/Surface';
import { Spinner } from '../components/Spinner';
import { useAuthStore } from '../store/auth';
import type { TaskStatus } from '../types';

export default function TaskDetail() {
  const { id } = useParams();
  const taskId = Number(id);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const taskQ = useQuery({ queryKey: ['task', taskId], queryFn: () => tasksApi.get(taskId) });

  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);
  const setStatus = useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.setStatus(taskId, status),
    onMutate: (status) => setPendingStatus(status),
    onSettled: () => setPendingStatus(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Status updated');
    },
  });

  const [comment, setComment] = useState('');
  const addComment = useMutation({
    mutationFn: (body: string) => tasksApi.comment(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      setComment('');
    },
  });

  if (taskQ.isLoading) return <div className="text-slate-400">Loading…</div>;
  if (!taskQ.data) return <div className="text-rose-400">Task not found.</div>;
  const t = taskQ.data;
  const overdue = t.status !== 'completed' && new Date(t.due_date) < new Date();
  const canEdit = user?.role === 'admin' || t.assigned_to === user?.id;

  return (
    <div className="space-y-6">
      <Link to="/maintenance" className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
        <ArrowLeftIcon className="h-4 w-4" /> Back to maintenance
      </Link>

      <Surface>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">{t.title}</h1>
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-slate-300">{t.ship?.name}</span>
              <span className="text-slate-700">·</span>
              <Badge value={t.priority} />
              <span className="text-slate-700">·</span>
              <span>due <span className={overdue ? 'text-slate-100 font-semibold' : ''}>{format(new Date(t.due_date), 'd MMM yyyy')}</span></span>
            </div>
          </div>
          <Badge value={t.status} />
        </div>
        {t.description && <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{t.description}</p>}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 text-sm gap-4">
          <Field label="Category" value={t.category || '—'} />
          <Field label="Assignee" value={t.assignee?.name || 'unassigned'} />
          <Field label="Created by" value={t.creator?.name || '—'} />
          <Field label="Completed" value={t.completed_at ? format(new Date(t.completed_at), 'd MMM, p') : '—'} />
        </div>

        {canEdit && (
          <div className="mt-5 flex flex-wrap gap-2">
            {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(s => {
              const isLoading = pendingStatus === s;
              const isCurrent = t.status === s;
              const isCompleted = s === 'completed';
              return (
                <button
                  key={s}
                  disabled={isCurrent || setStatus.isPending}
                  onClick={() => setStatus.mutate(s)}
                  className={`relative inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-md transition shadow-md disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 shadow-none'
                      : isCompleted
                        ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-900/30'
                        : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100'
                  }`}
                >
                  <span className={isLoading ? 'invisible' : ''}>{`Mark ${s.replace('_', ' ')}`}</span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Spinner size={14} className={isCompleted ? 'text-slate-900' : 'text-slate-300'} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Surface>

      <Surface title={`Comments (${t.comments?.length || 0})`}>
        <ul className="space-y-3">
          {(t.comments || []).map(c => (
            <li key={c.id} className="border-l-2 border-emerald-500/40 pl-3">
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-300">{c.author?.name}</span>{' · '}
                {format(new Date(c.createdAt), 'd MMM yyyy, p')}
              </div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{c.body}</div>
            </li>
          ))}
          {!t.comments?.length && <li className="text-sm text-slate-500">No comments yet.</li>}
        </ul>

        {canEdit && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              addComment.mutate(comment.trim());
            }}
          >
            <input
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Add a note…"
              className="flex-1 rounded-md px-3 py-2 text-sm"
            />
            <button disabled={!comment.trim() || addComment.isPending} className="relative inline-flex items-center justify-center min-w-[100px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold rounded-md text-sm shadow-md shadow-emerald-900/30 disabled:opacity-70 disabled:cursor-not-allowed">
              <span className={addComment.isPending ? 'invisible' : ''}>Post</span>
              {addComment.isPending && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Spinner className="text-slate-900" />
                </span>
              )}
            </button>
          </form>
        )}
      </Surface>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-slate-200 mt-0.5">{value}</div>
    </div>
  );
}
