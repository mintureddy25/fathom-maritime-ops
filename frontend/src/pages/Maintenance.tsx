import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { tasksApi, shipsApi, usersApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Surface } from '../components/Surface';
import { Modal, FormLabel, FormButtons } from '../components/Modal';
import { PageHeader, PrimaryButton } from '../components/PageHeader';
import { DateField } from '../components/DateField';
import { useAuthStore } from '../store/auth';
import type { TaskStatus, MaintenanceTask } from '../types';

export default function Maintenance() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [filterShip, setFilterShip] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const ships = useQuery({ queryKey: ['ships'], queryFn: shipsApi.list });

  const tasksQ = useQuery({
    queryKey: ['tasks', filterShip, filterStatus, showOverdue],
    queryFn: () => tasksApi.list({
      ship_id: filterShip ? Number(filterShip) : undefined,
      status: (filterStatus || undefined) as TaskStatus | undefined,
      overdue: showOverdue || undefined,
    }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        title="Tasks"
        subtitle={isAdmin ? 'Plan & assign work across the fleet' : 'Tasks assigned to you'}
        action={isAdmin && <PrimaryButton onClick={() => setShowCreate(true)}><PlusIcon className="h-4 w-4" /> New task</PrimaryButton>}
      />

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-3 flex flex-wrap gap-3 items-center">
        <select className="rounded-md px-3 py-1.5 text-sm" value={filterShip} onChange={e => setFilterShip(e.target.value)}>
          <option value="">All ships</option>
          {(ships.data || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="rounded-md px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300 ml-2">
          <input type="checkbox" checked={showOverdue} onChange={e => setShowOverdue(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
          Overdue only
        </label>
        <div className="ml-auto text-xs text-slate-500">
          {tasksQ.data?.length || 0} task{tasksQ.data?.length === 1 ? '' : 's'}
        </div>
      </div>

      <Surface padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="font-medium">Ship</th>
                <th className="font-medium">Priority</th>
                <th className="font-medium">Due</th>
                <th className="font-medium">Assignee</th>
                <th className="font-medium">Status</th>
                <th className="pr-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasksQ.isLoading && <tr><td className="p-5 text-slate-500" colSpan={7}>Loading…</td></tr>}
              {tasksQ.data?.length === 0 && <tr><td className="p-5 text-slate-500" colSpan={7}>No tasks match your filters.</td></tr>}
              {tasksQ.data?.map(t => {
                const overdue = t.status !== 'completed' && new Date(t.due_date) < new Date();
                return (
                  <tr key={t.id} className={`${overdue ? 'bg-slate-800/40' : 'hover:bg-slate-800/30'} transition-colors`}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Link to={`/maintenance/${t.id}`} className="font-medium text-slate-100 hover:text-emerald-300 transition">{t.title}</Link>
                      {t.category && <div className="text-xs text-slate-500 mt-0.5">{t.category}</div>}
                    </td>
                    <td className="text-slate-300 whitespace-nowrap">{t.ship?.name}</td>
                    <td className="whitespace-nowrap"><Badge value={t.priority} /></td>
                    <td className={`whitespace-nowrap ${overdue ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>{format(new Date(t.due_date), 'd MMM yyyy')}</td>
                    <td className="text-slate-300 whitespace-nowrap">{t.assignee?.name || <span className="text-slate-500">unassigned</span>}</td>
                    <td className="whitespace-nowrap"><Badge value={t.status} /></td>
                    <td className="pr-5 whitespace-nowrap">
                      <Link to={`/maintenance/${t.id}`} className="text-emerald-400 text-xs hover:text-emerald-300">open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      {showCreate && <CreateTaskModal ships={ships.data || []} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateTaskModal({ ships, onClose }: { ships: { id: number; name: string }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [shipId, setShipId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignedTo, setAssignedTo] = useState<number | ''>('');

  const crewQ = useQuery({
    queryKey: ['users', 'crew', shipId],
    queryFn: () => usersApi.list({ role: 'crew', ship_id: shipId ? Number(shipId) : undefined }),
    enabled: !!shipId,
  });

  const create = useMutation({
    mutationFn: (body: Partial<MaintenanceTask>) => tasksApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Task created');
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error || 'Could not create task'),
  });

  return (
    <Modal title="New maintenance task" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!shipId || !title || !dueDate) return;
          create.mutate({
            ship_id: Number(shipId), title, description, category,
            priority: priority as 'low' | 'medium' | 'high' | 'critical',
            due_date: format(dueDate!, 'yyyy-MM-dd'),
            assigned_to: assignedTo ? Number(assignedTo) : undefined,
          });
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 block">
            <FormLabel>Ship</FormLabel>
            <select required value={shipId} onChange={e => setShipId(Number(e.target.value))} className="w-full rounded-md px-3 py-2 text-sm">
              <option value="">Select…</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 block">
            <FormLabel>Priority</FormLabel>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <label className="space-y-1.5 block">
          <FormLabel>Title</FormLabel>
          <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>Category</FormLabel>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Engine Room, Safety…" className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>Description</FormLabel>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FormLabel>Due date</FormLabel>
            <DateField value={dueDate} onChange={setDueDate} placeholder="Pick a date" minDate={new Date()} />
          </div>
          <label className="space-y-1.5 block">
            <FormLabel>Assignee</FormLabel>
            <select value={assignedTo} onChange={e => setAssignedTo(Number(e.target.value))} className="w-full rounded-md px-3 py-2 text-sm" disabled={!shipId}>
              <option value="">Unassigned</option>
              {(crewQ.data || []).map(u => <option key={u.id} value={u.id}>{u.name} {u.rank ? `(${u.rank})` : ''}</option>)}
            </select>
          </label>
        </div>
        <FormButtons onCancel={onClose} busy={create.isPending} label="Create task" />
      </form>
    </Modal>
  );
}
