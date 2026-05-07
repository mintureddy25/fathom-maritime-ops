import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usersApi, shipsApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Surface } from '../components/Surface';
import { Modal, FormLabel, FormButtons } from '../components/Modal';
import { PageHeader, PrimaryButton } from '../components/PageHeader';
import type { User } from '../types';

export default function Crew() {
  const ships = useQuery({ queryKey: ['ships'], queryFn: shipsApi.list });
  const users = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Crew & Admins"
        subtitle="Onboard officers, engineers, and operations staff"
        action={<PrimaryButton onClick={() => setShowForm(true)}><PlusIcon className="h-4 w-4" /> Add user</PrimaryButton>}
      />

      <Surface padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="font-medium">Email</th>
                <th className="font-medium">Role</th>
                <th className="font-medium">Rank</th>
                <th className="font-medium pr-5">Ship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.data?.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-100 whitespace-nowrap">{u.name}</td>
                  <td className="text-slate-300 whitespace-nowrap">{u.email}</td>
                  <td className="whitespace-nowrap"><Badge value={u.role} /></td>
                  <td className="text-slate-300 whitespace-nowrap">{u.rank || '—'}</td>
                  <td className="text-slate-300 pr-5 whitespace-nowrap">{u.ship?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      {showForm && <CreateUserModal ships={ships.data || []} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CreateUserModal({ ships, onClose }: { ships: { id: number; name: string }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('crew123');
  const [role, setRole] = useState<'admin' | 'crew'>('crew');
  const [rank, setRank] = useState('');
  const [shipId, setShipId] = useState<number | ''>('');

  const create = useMutation({
    mutationFn: (body: Partial<User> & { password: string }) => usersApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User added');
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error || 'Could not add user'),
  });

  return (
    <Modal title="Add user" onClose={onClose} size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            name, email, password, role, rank,
            ship_id: shipId ? Number(shipId) : undefined,
          });
        }}
      >
        <label className="space-y-1.5 block">
          <FormLabel>Name</FormLabel>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>Email</FormLabel>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>Temporary password</FormLabel>
          <input required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 block">
            <FormLabel>Role</FormLabel>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'crew')} className="w-full rounded-md px-3 py-2 text-sm">
              <option value="crew">Crew</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="space-y-1.5 block">
            <FormLabel>Rank</FormLabel>
            <input value={rank} onChange={e => setRank(e.target.value)} placeholder="Captain, Bosun…" className="w-full rounded-md px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="space-y-1.5 block">
          <FormLabel>Ship</FormLabel>
          <select value={shipId} onChange={e => setShipId(Number(e.target.value))} className="w-full rounded-md px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <FormButtons onCancel={onClose} busy={create.isPending} label="Add user" />
      </form>
    </Modal>
  );
}
