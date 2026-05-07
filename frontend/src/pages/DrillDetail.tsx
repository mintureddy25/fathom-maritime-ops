import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { drillsApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Surface } from '../components/Surface';
import { Spinner } from '../components/Spinner';
import { useAuthStore } from '../store/auth';

export default function DrillDetail() {
  const { id } = useParams();
  const drillId = Number(id);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const drillQ = useQuery({ queryKey: ['drill', drillId], queryFn: () => drillsApi.get(drillId) });

  const [pendingAttend, setPendingAttend] = useState<'yes' | 'no' | null>(null);
  const attend = useMutation({
    mutationFn: (vars: { attended: boolean; remarks?: string }) =>
      drillsApi.attend(drillId, vars.attended, vars.remarks),
    onMutate: (vars) => setPendingAttend(vars.attended ? 'yes' : 'no'),
    onSettled: () => setPendingAttend(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drill', drillId] });
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Attendance recorded');
    },
  });

  const complete = useMutation({
    mutationFn: (notes?: string) => drillsApi.complete(drillId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drill', drillId] });
      qc.invalidateQueries({ queryKey: ['drills'] });
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Drill marked completed');
    },
  });

  const [completionNotes, setCompletionNotes] = useState('');
  const [remarks, setRemarks] = useState('');

  if (drillQ.isLoading) return <div className="text-slate-400">Loading…</div>;
  if (!drillQ.data) return <div className="text-rose-400">Drill not found.</div>;
  const d = drillQ.data;

  const myParticipation = d.participations?.find(p => p.user_id === user?.id);

  return (
    <div className="space-y-6">
      <Link to="/drills" className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
        <ArrowLeftIcon className="h-4 w-4" /> Back to drills
      </Link>

      <Surface>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">{d.title}</h1>
            <div className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-slate-300">{d.ship?.name}</span>
              <span className="text-slate-700">·</span>
              <span className="capitalize">{d.drill_type.replace('_', ' ')}</span>
              <span className="text-slate-700">·</span>
              <span>{format(new Date(d.scheduled_date), 'd MMM yyyy, p')}</span>
            </div>
          </div>
          <Badge value={d.status} />
        </div>
        {d.description && <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{d.description}</p>}
        {d.notes && (
          <div className="mt-3 text-sm bg-slate-800/40 rounded-md p-3 text-slate-200">
            <span className="font-medium text-slate-100">Notes:</span> {d.notes}
          </div>
        )}

        {!isAdmin && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="font-medium text-slate-100 mb-2">Your attendance</div>
            {myParticipation ? (
              <div className="text-sm text-slate-300">
                Marked as <span className="font-medium text-slate-100">{myParticipation.attended ? 'attended' : 'absent'}</span>
                {myParticipation.remarks && ` · ${myParticipation.remarks}`}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Not yet recorded.</div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                className="rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]"
              />
              <button
                onClick={() => attend.mutate({ attended: true, remarks })}
                disabled={attend.isPending}
                className="relative px-4 py-2.5 text-sm font-semibold rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-900/30 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <span className={pendingAttend === 'yes' ? 'invisible inline-flex items-center gap-2' : 'inline-flex items-center gap-2'}>
                  <CheckCircleIcon className="h-4 w-4" />
                  Attended
                </span>
                {pendingAttend === 'yes' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="text-slate-900" />
                  </span>
                )}
              </button>
              <button
                onClick={() => attend.mutate({ attended: false, remarks })}
                disabled={attend.isPending}
                className="relative px-4 py-2.5 text-sm font-semibold rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <span className={pendingAttend === 'no' ? 'invisible inline-flex items-center gap-2' : 'inline-flex items-center gap-2'}>
                  <XCircleIcon className="h-4 w-4" />
                  Absent
                </span>
                {pendingAttend === 'no' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="text-slate-300" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {isAdmin && d.status !== 'completed' && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="font-medium text-slate-100 mb-2">Mark drill complete</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                placeholder="Drill notes / observations"
                className="rounded-md px-3 py-2 text-sm flex-1 min-w-[260px]"
              />
              <button
                onClick={() => complete.mutate(completionNotes || undefined)}
                disabled={complete.isPending}
                className="relative inline-flex items-center justify-center min-w-[160px] px-4 py-2.5 text-sm rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold shadow-md shadow-emerald-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className={complete.isPending ? 'invisible' : ''}>Mark completed</span>
                {complete.isPending && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="text-slate-900" />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </Surface>

      <Surface title={`Participations (${d.participations?.length || 0})`}>
        <ul className="divide-y divide-slate-800 -my-2">
          {(d.participations || []).map(p => (
            <li key={p.id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium text-slate-100">{p.user?.name}</div>
                <div className="text-xs text-slate-500">{p.user?.rank} {p.remarks ? `· ${p.remarks}` : ''}</div>
              </div>
              <div className={p.attended ? 'text-emerald-300 font-medium text-sm' : 'text-slate-400 font-medium text-sm'}>
                {p.attended ? 'Attended' : 'Absent'}
              </div>
            </li>
          ))}
          {!d.participations?.length && <li className="py-3 text-sm text-slate-500">No attendance recorded yet.</li>}
        </ul>
      </Surface>
    </div>
  );
}
