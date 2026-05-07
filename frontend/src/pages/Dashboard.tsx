import { useQuery } from '@tanstack/react-query';
import { DonutChart, BarChart, ProgressBar, Tracker } from '@tremor/react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { complianceApi } from '../api/endpoints';
import { useAuthStore } from '../store/auth';
import { StatCard } from '../components/StatCard';
import { Surface } from '../components/Surface';
import { Badge } from '../components/Badge';
import {
  ShieldCheckIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon,
  FireIcon, ClockIcon, CheckBadgeIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import type { FleetOverview, ShipCompliance } from '../types';

export default function Dashboard() {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'admin' ? <AdminDashboard /> : <CrewDashboard />;
}

const valueFormatter = (n: number) => `${n}`;
const pctFormatter = (n: number) => `${n}%`;

const taskColors = ['emerald', 'slate', 'rose'] as const;
const drillColors = ['emerald', 'rose', 'slate'] as const;
const barColors = ['emerald', 'teal', 'cyan', 'sky'] as const;

function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['compliance', 'fleet'],
    queryFn: complianceApi.fleet,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <div className="text-rose-400">Failed to load fleet metrics.</div>;

  return (
    <div className="space-y-8">
      <FleetHero data={data} />
      <FleetKpis data={data} />

      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Maintenance breakdown" subtitle="All open work across the fleet" data={data} kind="maintenance" />
        <ChartCard title="Drill breakdown" subtitle="Completion vs misses" data={data} kind="drills" />
        <ShipScores ships={data.ships} />
      </div>

      <Surface title="Per-ship compliance" subtitle="Maintenance · Drills · Participation · Overall">
        <BarChart
          data={data.ships.map(s => ({
            name: s.ship.name,
            Maintenance: s.metrics.maintenance_pct,
            Drills: s.metrics.drill_completion_pct,
            Participation: s.metrics.participation_pct,
            Overall: s.metrics.overall_score,
          }))}
          index="name"
          categories={['Maintenance', 'Drills', 'Participation', 'Overall']}
          colors={[...barColors]}
          valueFormatter={pctFormatter}
          yAxisWidth={48}
          className="h-72"
        />
      </Surface>

      <AttentionPanel ships={data.ships} />

      <FleetTable ships={data.ships} />
    </div>
  );
}

function FleetHero({ data }: { data: FleetOverview }) {
  const fleet = data.fleet;
  const completionRate = fleet.tasks_total
    ? Math.round((fleet.tasks_completed / fleet.tasks_total) * 100) : 0;

  return (
    <header className="rounded-2xl bg-slate-900 ring-1 ring-slate-800 p-6 lg:p-8 shadow-lg shadow-black/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Fleet console</p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-slate-50 mt-2">Compliance overview</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Operational safety status across all ships in the fleet, refreshed live as crew log activity.
          </p>
        </div>
        <div className="flex items-stretch gap-3 sm:gap-4">
          <ScoreTile label="Fleet score" value={fleet.overall_score} suffix="%" badge={fleet.classification} />
          <ScoreTile label="Maintenance" value={completionRate} suffix="%" sub={`${fleet.tasks_completed}/${fleet.tasks_total} done`} />
        </div>
      </div>
    </header>
  );
}

function ScoreTile({ label, value, suffix, sub, badge }: {
  label: string; value: number; suffix?: string; sub?: string; badge?: string;
}) {
  return (
    <div className="flex-1 min-w-[140px] rounded-xl bg-slate-950 ring-1 ring-slate-800 px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="text-3xl sm:text-4xl font-semibold tabular-nums text-emerald-300 mt-1">
        {value}{suffix && <span className="text-slate-600 text-2xl">{suffix}</span>}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {badge && <div className="mt-1.5"><Badge value={badge} /></div>}
    </div>
  );
}

function FleetKpis({ data }: { data: FleetOverview }) {
  const f = data.fleet;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Ships in fleet" value={f.ships_total}
        icon={<ShieldCheckIcon className="h-5 w-5" />}
        hint={`${data.ships.filter(s => s.metrics.classification === 'compliant').length} compliant`}
      />
      <StatCard
        label="Tasks completed" value={`${f.tasks_completed}/${f.tasks_total}`} tone="brand"
        icon={<CheckBadgeIcon className="h-5 w-5" />}
        hint={f.tasks_total ? `${Math.round((f.tasks_completed / f.tasks_total) * 100)}% completion` : undefined}
      />
      <StatCard
        label="Tasks overdue" value={f.tasks_overdue}
        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
        hint={f.tasks_overdue ? 'requires attention' : 'on schedule'}
      />
      <StatCard
        label="Drills missed" value={f.drills_missed}
        icon={<FireIcon className="h-5 w-5" />}
        hint={`${f.drills_completed} completed · ${f.drills_upcoming} upcoming`}
      />
    </div>
  );
}

function ChartCard({ title, subtitle, data, kind }: {
  title: string; subtitle: string; data: FleetOverview; kind: 'maintenance' | 'drills';
}) {
  const fleet = data.fleet;
  const items = kind === 'maintenance'
    ? [
        { name: 'Completed', value: fleet.tasks_completed },
        { name: 'In progress / pending', value: Math.max(fleet.tasks_pending - fleet.tasks_overdue, 0) },
        { name: 'Overdue', value: fleet.tasks_overdue },
      ]
    : [
        { name: 'Completed', value: fleet.drills_completed },
        { name: 'Missed', value: fleet.drills_missed },
        { name: 'Upcoming', value: fleet.drills_upcoming },
      ];

  const colors = kind === 'maintenance' ? taskColors : drillColors;

  return (
    <Surface title={title} subtitle={subtitle}>
      <DonutChart
        data={items}
        category="value"
        index="name"
        colors={[...colors]}
        valueFormatter={valueFormatter}
        className="h-44"
      />
      <ul className="mt-4 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-400">
              <span className={`inline-block h-2 w-2 rounded-full bg-${colors[i]}-500`} />
              {it.name}
            </span>
            <span className="tabular-nums text-slate-200 font-medium">{it.value}</span>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

function ShipScores({ ships }: { ships: ShipCompliance[] }) {
  return (
    <Surface title="Per-ship score" subtitle="Overall compliance distribution">
      <div className="space-y-4">
        {ships.map(s => (
          <div key={s.ship.id}>
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium text-slate-200">{s.ship.name}</div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-slate-300">{s.metrics.overall_score}%</span>
                <Badge value={s.metrics.classification} />
              </div>
            </div>
            <ProgressBar value={s.metrics.overall_score} color="emerald" className="mt-1.5" />
          </div>
        ))}
      </div>
    </Surface>
  );
}

function AttentionPanel({ ships }: { ships: ShipCompliance[] }) {
  const overdueTasks = ships.flatMap(s =>
    s.overdue_tasks.map(t => ({ ...t, shipName: s.ship.name }))
  ).slice(0, 5);
  const missedDrills = ships.flatMap(s =>
    s.missed_drills.map(d => ({ ...d, shipName: s.ship.name }))
  ).slice(0, 5);

  if (!overdueTasks.length && !missedDrills.length) {
    return (
      <Surface title="Watchlist" subtitle="Items needing attention">
        <div className="text-sm text-slate-500 py-2">All clear — no overdue tasks or missed drills across the fleet.</div>
      </Surface>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Surface
        title="Overdue maintenance"
        subtitle="Top 5 across the fleet"
        action={<Link to="/maintenance?overdue=true" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>}
      >
        {overdueTasks.length === 0 ? (
          <div className="text-sm text-slate-500 py-1">None.</div>
        ) : (
          <ul className="divide-y divide-slate-800/60 -my-2">
            {overdueTasks.map(t => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/maintenance/${t.id}`} className="text-sm font-medium text-slate-100 hover:text-emerald-300 truncate block">
                    {t.title}
                  </Link>
                  <div className="text-xs text-slate-500">{t.shipName} · {format(new Date(t.due_date), 'd MMM')}</div>
                </div>
                <Badge value={t.priority} />
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface
        title="Missed drills"
        subtitle="Top 5 across the fleet"
        action={<Link to="/drills?status=missed" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>}
      >
        {missedDrills.length === 0 ? (
          <div className="text-sm text-slate-500 py-1">None.</div>
        ) : (
          <ul className="divide-y divide-slate-800/60 -my-2">
            {missedDrills.map(d => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/drills/${d.id}`} className="text-sm font-medium text-slate-100 hover:text-emerald-300 truncate block">
                    {d.title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {d.shipName} · {formatDistanceToNowStrict(new Date(d.scheduled_date), { addSuffix: true })}
                  </div>
                </div>
                <span className="text-xs text-slate-500 capitalize whitespace-nowrap">{d.drill_type.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}

function FleetTable({ ships }: { ships: ShipCompliance[] }) {
  return (
    <Surface title="Ships at a glance" subtitle="Score · classification · open items" padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-5 py-3 font-medium whitespace-nowrap">Ship</th>
              <th className="font-medium whitespace-nowrap">IMO</th>
              <th className="font-medium whitespace-nowrap">Score</th>
              <th className="font-medium whitespace-nowrap">Status</th>
              <th className="font-medium whitespace-nowrap">Overdue</th>
              <th className="font-medium pr-5 whitespace-nowrap">Missed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ships.map(s => (
              <tr key={s.ship.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-100 whitespace-nowrap">{s.ship.name}</td>
                <td className="text-slate-400 whitespace-nowrap">{s.ship.imo_number}</td>
                <td className="tabular-nums text-slate-200 whitespace-nowrap">{s.metrics.overall_score}%</td>
                <td className="whitespace-nowrap"><Badge value={s.metrics.classification} /></td>
                <td className={`whitespace-nowrap ${s.overdue_tasks.length ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                  {s.overdue_tasks.length}
                </td>
                <td className={`pr-5 whitespace-nowrap ${s.missed_drills.length ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                  {s.missed_drills.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

function CrewDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['compliance', 'crew'],
    queryFn: complianceApi.crew,
  });
  const user = useAuthStore((s) => s.user);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <div className="text-rose-400">Failed to load.</div>;

  const s = data.summary;
  const completion = s.tasks_total ? Math.round((s.tasks_completed / s.tasks_total) * 100) : 100;

  const tracker = data.tasks.slice(0, 14).map(t => {
    const overdue = t.status !== 'completed' && new Date(t.due_date) < new Date();
    return {
      color: t.status === 'completed' ? 'emerald'
        : overdue ? 'rose'
        : t.status === 'in_progress' ? 'teal' : 'slate',
      tooltip: `${t.title} · ${t.status}`,
    };
  });

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-slate-900 ring-1 ring-slate-800 p-6 lg:p-8 shadow-lg shadow-black/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Bridge console</p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-slate-50 mt-2">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {user?.rank ? `${user.rank} · ` : ''}{user?.ship?.name || 'Unassigned'} · here's your day
          </p>
          <div className="mt-5 flex items-center gap-3 text-sm text-slate-300 flex-wrap">
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />
            <span><span className="text-emerald-300 font-medium">{completion}%</span> of your tasks complete</span>
            <span className="text-slate-700">·</span>
            <span><span className="text-slate-100 font-medium">{s.drills_upcoming}</span> drills coming up</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="My tasks" value={s.tasks_total} icon={<WrenchScrewdriverIcon className="h-5 w-5" />} />
        <StatCard label="Completed" value={s.tasks_completed} tone="brand" icon={<CheckBadgeIcon className="h-5 w-5" />} hint={`${completion}% done`} />
        <StatCard label="In progress" value={s.tasks_in_progress} icon={<ClockIcon className="h-5 w-5" />} />
        <StatCard label="Overdue" value={s.tasks_overdue} icon={<ExclamationTriangleIcon className="h-5 w-5" />} hint={s.tasks_overdue ? 'needs attention' : 'on schedule'} />
      </div>

      {tracker.length > 0 && (
        <Surface title="Task health" subtitle="Newest first · green done · red overdue · teal in-progress">
          <Tracker data={tracker} className="h-10" />
        </Surface>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Surface
          title={`Upcoming drills (${data.upcoming_drills.length})`}
          subtitle="Scheduled exercises on your ship"
          action={<Link to="/drills?upcoming=true" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>}
        >
          {data.upcoming_drills.length === 0 ? (
            <div className="text-sm text-slate-500 py-1">No drills scheduled.</div>
          ) : (
            <ul className="divide-y divide-slate-800/60 -my-2">
              {data.upcoming_drills.map(d => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/drills/${d.id}`} className="block text-sm font-medium text-slate-100 hover:text-emerald-300 truncate">
                      {d.title}
                    </Link>
                    <div className="text-xs text-slate-500 capitalize">{d.drill_type.replace('_', ' ')}</div>
                  </div>
                  <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                    <div>{format(new Date(d.scheduled_date), 'd MMM yyyy')}</div>
                    <div className="text-slate-500">{format(new Date(d.scheduled_date), 'p')}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface
          title="Recent task activity"
          subtitle="Your latest assignments"
          action={<Link to="/maintenance" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>}
        >
          {data.tasks.length === 0 ? (
            <div className="text-sm text-slate-500 py-1">No tasks assigned yet.</div>
          ) : (
            <ul className="divide-y divide-slate-800/60 -my-2">
              {data.tasks.slice(0, 6).map(t => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/maintenance/${t.id}`} className="block text-sm font-medium text-slate-100 hover:text-emerald-300 truncate">
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500">due {format(new Date(t.due_date), 'd MMM yyyy')}</div>
                  </div>
                  <Badge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-slate-900/50 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-900/50 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <div key={i} className="h-72 bg-slate-900/50 rounded-xl" />)}
      </div>
      <div className="h-72 bg-slate-900/50 rounded-xl" />
    </div>
  );
}
