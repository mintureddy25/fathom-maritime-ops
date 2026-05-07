import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { drillsApi, shipsApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Surface } from '../components/Surface';
import { Modal, FormLabel, FormButtons } from '../components/Modal';
import { PageHeader, PrimaryButton } from '../components/PageHeader';
import { DateField, TimeField } from '../components/DateField';
import { useAuthStore } from '../store/auth';
import type { Drill, DrillType } from '../types';

const DRILL_TYPES: DrillType[] = ['fire', 'evacuation', 'man_overboard', 'oil_spill', 'security', 'medical', 'other'];

export default function Drills() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [filterShip, setFilterShip] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const ships = useQuery({ queryKey: ['ships'], queryFn: shipsApi.list });

  const drillsQ = useQuery({
    queryKey: ['drills', filterShip, filterStatus],
    queryFn: () => drillsApi.list({
      ship_id: filterShip ? Number(filterShip) : undefined,
      status: filterStatus || undefined,
    }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safety drills"
        title="Drill schedule"
        subtitle={isAdmin ? 'Plan and review safety exercises across the fleet' : 'Drills assigned to your ship'}
        action={isAdmin && <PrimaryButton onClick={() => setShowCreate(true)}><PlusIcon className="h-4 w-4" /> Schedule drill</PrimaryButton>}
      />

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-3 flex flex-wrap gap-3 items-center">
        <select className="rounded-md px-3 py-1.5 text-sm" value={filterShip} onChange={e => setFilterShip(e.target.value)}>
          <option value="">All ships</option>
          {(ships.data || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="rounded-md px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
        </select>
        <div className="ml-auto text-xs text-slate-500">
          {drillsQ.data?.length || 0} drill{drillsQ.data?.length === 1 ? '' : 's'}
        </div>
      </div>

      <Surface padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Drill</th>
                <th className="font-medium">Type</th>
                <th className="font-medium">Ship</th>
                <th className="font-medium">Scheduled</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Attendance</th>
                <th className="pr-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drillsQ.isLoading && <tr><td colSpan={7} className="p-5 text-slate-500">Loading…</td></tr>}
              {drillsQ.data?.length === 0 && <tr><td colSpan={7} className="p-5 text-slate-500">No drills.</td></tr>}
              {drillsQ.data?.map(d => {
                const attended = (d.participations || []).filter(p => p.attended).length;
                const total = d.participations?.length || 0;
                return (
                  <tr key={d.id} className={`${d.status === 'missed' ? 'bg-slate-800/40' : 'hover:bg-slate-800/30'} transition-colors`}>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">
                      <Link to={`/drills/${d.id}`} className="text-slate-100 hover:text-emerald-300 transition">{d.title}</Link>
                    </td>
                    <td className="text-slate-300 capitalize whitespace-nowrap">{d.drill_type.replace('_', ' ')}</td>
                    <td className="text-slate-300 whitespace-nowrap">{d.ship?.name}</td>
                    <td className="text-slate-300 whitespace-nowrap">{format(new Date(d.scheduled_date), 'd MMM yyyy, p')}</td>
                    <td className="whitespace-nowrap"><Badge value={d.status} /></td>
                    <td className="text-slate-300 tabular-nums whitespace-nowrap">{total ? `${attended}/${total}` : '—'}</td>
                    <td className="pr-5 whitespace-nowrap"><Link to={`/drills/${d.id}`} className="text-emerald-400 text-xs hover:text-emerald-300">open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      {showCreate && <CreateDrillModal ships={ships.data || []} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateDrillModal({ ships, onClose }: { ships: { id: number; name: string }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [shipId, setShipId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [drillType, setDrillType] = useState<DrillType>('fire');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('10:00');

  const create = useMutation({
    mutationFn: (body: Partial<Drill>) => drillsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drills'] });
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Drill scheduled');
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error || 'Could not schedule drill'),
  });

  return (
    <Modal title="Schedule a drill" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!shipId || !title || !scheduledDate) return;
          const [hh, mm] = scheduledTime.split(':').map(Number);
          const combined = new Date(scheduledDate);
          combined.setHours(hh, mm, 0, 0);
          create.mutate({ ship_id: Number(shipId), title, drill_type: drillType, description, scheduled_date: combined.toISOString() });
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
            <FormLabel>Type</FormLabel>
            <select value={drillType} onChange={e => setDrillType(e.target.value as DrillType)} className="w-full rounded-md px-3 py-2 text-sm">
              {DRILL_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </label>
        </div>
        <label className="space-y-1.5 block">
          <FormLabel>Title</FormLabel>
          <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>Description</FormLabel>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FormLabel>Scheduled date</FormLabel>
            <DateField value={scheduledDate} onChange={setScheduledDate} placeholder="Pick a date" minDate={new Date()} />
          </div>
          <div className="space-y-1.5">
            <FormLabel>Time</FormLabel>
            <TimeField value={scheduledTime} onChange={setScheduledTime} />
          </div>
        </div>
        <FormButtons onCancel={onClose} busy={create.isPending} label="Schedule" />
      </form>
    </Modal>
  );
}
