import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string | number
  sub?: string
  gold?: boolean
  blue?: boolean
  green?: boolean
  purple?: boolean
  icon?: LucideIcon
  trend?: { value: string; up?: boolean }
}

export default function StatCard({ label, value, sub, gold, blue, green, purple, icon: Icon, trend }: Props) {
  const accent =
    gold   ? 'gold'   :
    blue   ? 'blue'   :
    green  ? 'green'  :
    purple ? 'purple' : null

  const valueClass =
    gold   ? 'gold-text'                  :
    blue   ? 'blue-text'                  :
    green  ? 'text-green-400'             :
    purple ? 'text-purple-400'            :
             'text-white'

  const borderClass =
    gold   ? 'card-gold'                  :
    blue   ? 'border border-blue-500/20'  :
             'card'

  return (
    <div className={clsx(
      'p-5 rounded-2xl relative overflow-hidden transition-all duration-200',
      'hover:shadow-lg hover:-translate-y-0.5',
      borderClass,
    )}>
      {/* Subtle top gradient gleam */}
      {accent && (
        <div className={clsx(
          'absolute inset-x-0 top-0 h-px',
          gold   ? 'bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent' :
          blue   ? 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent'   :
          green  ? 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent'  :
                   'bg-gradient-to-r from-transparent via-purple-500/40 to-transparent',
        )} />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em] mb-2">{label}</p>
          <p className={clsx('text-2xl font-black tracking-tight leading-none', valueClass)}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
          {trend && (
            <p className={clsx('text-xs font-semibold mt-1.5', trend.up !== false ? 'text-green-400' : 'text-red-400')}>
              {trend.up !== false ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx(
            'flex-shrink-0 rounded-xl p-2.5',
            gold   ? 'stat-icon-gold'   :
            blue   ? 'stat-icon-blue'   :
            green  ? 'stat-icon-green'  :
            purple ? 'stat-icon-purple' :
                     'bg-slate-800/60 text-slate-400',
          )}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}
