import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { shipsApi } from '../api/endpoints';
import { Badge } from '../components/Badge';
import { Modal, FormLabel, FormButtons } from '../components/Modal';
import { PageHeader, PrimaryButton } from '../components/PageHeader';
import type { Ship } from '../types';

export default function Ships() {
  const ships = useQuery({ queryKey: ['ships'], queryFn: shipsApi.list });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet"
        title="Ships"
        subtitle="Vessels under your operational ownership"
        action={<PrimaryButton onClick={() => setShowForm(true)}><PlusIcon className="h-4 w-4" /> Add ship</PrimaryButton>}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ships.data?.map(s => (
          <div key={s.id} className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 hover:ring-slate-700 transition-all hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-50">{s.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.imo_number}</div>
              </div>
              <Badge value={s.status} />
            </div>
            <div className="mt-4 text-sm text-slate-300 space-y-1">
              {s.type && <div><span className="text-slate-500">Type</span> · {s.type}</div>}
              {s.flag && <div><span className="text-slate-500">Flag</span> · {s.flag}</div>}
            </div>
          </div>
        ))}
      </div>

      {showForm && <CreateShipModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CreateShipModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [imo, setImo] = useState('');
  const [type, setType] = useState('');
  const [flag, setFlag] = useState('');

  const create = useMutation({
    mutationFn: (body: Partial<Ship>) => shipsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ships'] });
      toast.success('Ship added');
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error || 'Could not add ship'),
  });

  return (
    <Modal title="Add ship" onClose={onClose} size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ name, imo_number: imo, type, flag });
        }}
      >
        <label className="space-y-1.5 block">
          <FormLabel>Name</FormLabel>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1.5 block">
          <FormLabel>IMO number</FormLabel>
          <input required value={imo} onChange={e => setImo(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 block">
            <FormLabel>Type</FormLabel>
            <input value={type} onChange={e => setType(e.target.value)} placeholder="Container, Tanker…" className="w-full rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1.5 block">
            <FormLabel>Flag</FormLabel>
            <input value={flag} onChange={e => setFlag(e.target.value)} placeholder="India, Singapore…" className="w-full rounded-md px-3 py-2 text-sm" />
          </label>
        </div>
        <FormButtons onCancel={onClose} busy={create.isPending} label="Add ship" />
      </form>
    </Modal>
  );
}
