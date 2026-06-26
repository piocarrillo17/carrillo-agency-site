'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import {
  type FIFData, blankFIF, sumFIF, fmtMoney,
  type InsuranceRow, type AssetRow, type DebtRow,
} from '@/lib/fifTypes'

const ASSET_TYPES = ['IRA/401(K)/403(B)', 'Cash/Savings', 'CD', 'Annuity', 'Investments', 'Other']

const inp = 'w-full bg-black border border-gray-800 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500'
const th = 'text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 py-2 text-left bg-gray-900'
const td = 'px-1 py-1'

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-gray-800 rounded pl-5 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
    </div>
  )
}

interface Props {
  leadId: string
  initialData: FIFData
  onSave?: (data: FIFData) => void
}

export default function LeadFIF({ leadId, initialData, onSave }: Props) {
  const [fif, setFif] = useState<FIFData>(initialData)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const loaded = useState(false)
  const loadedRef = loaded[1]

  useEffect(() => {
    setFif(initialData)
    const t = setTimeout(() => loadedRef(true), 300)
    return () => clearTimeout(t)
  }, [initialData, loadedRef])

  const save = useCallback(async (data: FIFData) => {
    setSaveStatus('saving')
    await supabase.from('leads').update({ fif_data: JSON.stringify({ ...data, closingJson: data.closingJson }) }).eq('id', leadId)
    onSave?.(data)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [leadId, onSave])

  function upd(patch: Partial<FIFData>) {
    setFif(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }

  function updIns(i: number, patch: Partial<InsuranceRow>) {
    const insurance = fif.insurance.map((r, j) => j === i ? { ...r, ...patch } : r)
    upd({ insurance })
  }

  function updAsset(i: number, patch: Partial<AssetRow>) {
    const assets = fif.assets.map((r, j) => j === i ? { ...r, ...patch } : r)
    upd({ assets })
  }

  function toggleAssetType(i: number, type: string) {
    const asset = fif.assets[i]
    const types = asset.types.includes(type)
      ? asset.types.filter(t => t !== type)
      : [...asset.types, type]
    updAsset(i, { types })
  }

  function updDebt(col: 'creditCardDebts' | 'studentLoanDebts' | 'personalDebts' | 'carLoanDebts', i: number, patch: Partial<DebtRow>) {
    const rows = fif[col].map((r, j) => j === i ? { ...r, ...patch } : r)
    upd({ [col]: rows })
  }

  const totalExp = sumFIF([fif.expMortgage, fif.expCar, fif.expUtilities, fif.expOtherInsurance, fif.expCreditCard, fif.expOther])
  const totalInc = sumFIF([fif.clientWages, fif.clientSS, fif.clientPension, fif.spouseWages, fif.spouseSS, fif.spousePension])

  return (
    <div className="space-y-6 pb-10">
      {/* Save indicator */}
      <div className="flex items-center justify-end gap-2 text-xs text-gray-500 h-5">
        {saveStatus === 'saving' && <><div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /> Saving…</>}
        {saveStatus === 'saved' && <><CheckCircle size={13} className="text-green-500" /> Saved</>}
      </div>

      {/* HEADER */}
      <div className="card p-5 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Client Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div><label className="label-xs">Insured</label><input value={fif.insured} onChange={e => upd({ insured: e.target.value })} className={inp} /></div>
            <div><label className="label-xs">Email</label><input value={fif.email} onChange={e => upd({ email: e.target.value })} className={inp} /></div>
            <div><label className="label-xs">Phone</label><input value={fif.phone} onChange={e => upd({ phone: e.target.value })} className={inp} /></div>
          </div>
          <div className="col-span-2"><label className="label-xs">Address</label><input value={fif.address} onChange={e => upd({ address: e.target.value })} className={inp} /></div>
          <div className="col-span-2"><label className="label-xs">City, State, Zip</label><input value={fif.cityStateZip} onChange={e => upd({ cityStateZip: e.target.value })} className={inp} /></div>
        </div>
      </div>

      {/* MORTGAGE */}
      <div className="card p-5 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Mortgage Information</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['Lender','Interest %','Term','Loan Amount','Payment','Accelerated','Est. Equity'].map(h => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody><tr>
              <td className={td}><input value={fif.lender} onChange={e => upd({ lender: e.target.value })} className={inp} /></td>
              <td className={td}><input value={fif.interestPct} onChange={e => upd({ interestPct: e.target.value })} placeholder="%" className={inp} /></td>
              <td className={td}><input value={fif.term} onChange={e => upd({ term: e.target.value })} placeholder="30yr" className={inp} /></td>
              <td className={td}><MoneyInput value={fif.loanAmount} onChange={v => upd({ loanAmount: v })} /></td>
              <td className={td}><MoneyInput value={fif.payment} onChange={v => upd({ payment: v })} /></td>
              <td className={td}><input value={fif.accelerated} onChange={e => upd({ accelerated: e.target.value })} placeholder="Y/N" className={inp} /></td>
              <td className={td}><MoneyInput value={fif.estimatedEquity} onChange={v => upd({ estimatedEquity: v })} /></td>
            </tr></tbody>
          </table>
        </div>
      </div>

      {/* INSURANCE */}
      <div className="card p-5 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Insurance Information</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              {['Type','Face Amount','Purpose','Premium','Cash Value','Carrier','Expiration'].map(h => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {fif.insurance.map((row, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className={td}><input value={row.type} onChange={e => updIns(i, { type: e.target.value })} placeholder="Term / WL / IUL" className={inp} /></td>
                  <td className={td}><MoneyInput value={row.faceAmount} onChange={v => updIns(i, { faceAmount: v })} /></td>
                  <td className={td}><input value={row.purpose} onChange={e => updIns(i, { purpose: e.target.value })} className={inp} /></td>
                  <td className={td}><MoneyInput value={row.premium} onChange={v => updIns(i, { premium: v })} /></td>
                  <td className={td}><MoneyInput value={row.cashValue} onChange={v => updIns(i, { cashValue: v })} /></td>
                  <td className={td}><input value={row.carrier} onChange={e => updIns(i, { carrier: e.target.value })} className={inp} /></td>
                  <td className={td}><input value={row.expiration} onChange={e => updIns(i, { expiration: e.target.value })} placeholder="MM/YYYY" className={inp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSETS */}
      <div className="card p-5 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Assets</h3>
        <div className="space-y-3">
          {fif.assets.map((asset, i) => (
            <div key={i} className="rounded-xl border border-gray-800 p-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {ASSET_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleAssetType(i, t)}
                    className={clsx('px-2 py-1 rounded text-xs font-bold border transition',
                      asset.types.includes(t) ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' : 'border-gray-700 text-gray-500 hover:border-gray-600')}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-xs">Current Value</label><MoneyInput value={asset.currentValue} onChange={v => updAsset(i, { currentValue: v })} /></div>
                <div>
                  <label className="label-xs">Contributing?</label>
                  <div className="flex gap-2 mt-1">
                    {[true, false].map(v => (
                      <button key={String(v)} type="button" onClick={() => updAsset(i, { contributing: v })}
                        className={clsx('px-3 py-1.5 rounded text-xs font-bold border transition',
                          asset.contributing === v ? 'border-yellow-500 gold-gradient text-black' : 'border-gray-700 text-gray-400')}>
                        {v ? 'Y' : 'N'}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="label-xs">Purpose</label><input value={asset.purpose} onChange={e => updAsset(i, { purpose: e.target.value })} className={inp} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXPENSES + INCOME + SURVIVORS side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Expenses */}
        <div className="card p-5 rounded-2xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Monthly Expenses</h3>
          <div className="space-y-2">
            {([
              ['Mortgage', 'expMortgage'],
              ['Car', 'expCar'],
              ['Utilities', 'expUtilities'],
              ['Other Insurances', 'expOtherInsurance'],
              ['Credit Card Debt', 'expCreditCard'],
              ['Other', 'expOther'],
            ] as [string, keyof FIFData][]).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
                <div className="w-28"><MoneyInput value={fif[key] as string} onChange={v => upd({ [key]: v })} /></div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
              <span className="text-xs font-black text-white">Total Expenses</span>
              <span className="text-sm font-black text-yellow-400">{fmtMoney(totalExp) || '—'}</span>
            </div>
          </div>
        </div>

        {/* Combined Income */}
        <div className="card p-5 rounded-2xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Combined Income</h3>
          <div className="space-y-2">
            {([
              ['Client Wages', 'clientWages'],
              ['Client Social Security', 'clientSS'],
              ['Client Pension/Retirement', 'clientPension'],
              ['Spouse Wages', 'spouseWages'],
              ['Spouse Social Security', 'spouseSS'],
              ['Spouse Pension/Retirement', 'spousePension'],
            ] as [string, keyof FIFData][]).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
                <div className="w-28"><MoneyInput value={fif[key] as string} onChange={v => upd({ [key]: v })} /></div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
              <span className="text-xs font-black text-white">Total Income</span>
              <span className="text-sm font-black text-green-400">{fmtMoney(totalInc) || '—'}</span>
            </div>
          </div>
        </div>

        {/* Individual Survivors Income */}
        <div className="card p-5 rounded-2xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Survivors Income</h3>
          <div className="space-y-3">
            <div>
              <label className="label-xs">Client's Income (without spouse)</label>
              <MoneyInput value={fif.clientIncomeAlone} onChange={v => upd({ clientIncomeAlone: v })} />
            </div>
            <div>
              <label className="label-xs">Spouse Income (without client)</label>
              <MoneyInput value={fif.spouseIncomeAlone} onChange={v => upd({ spouseIncomeAlone: v })} />
            </div>
            {totalInc > 0 && totalExp > 0 && (
              <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--card-bg-2)', border: '1px solid rgba(212,160,23,0.3)' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Monthly Leftover</p>
                <p className={clsx('text-lg font-black', totalInc - totalExp >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {fmtMoney(totalInc - totalExp)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEBT INFORMATION */}
      <div className="card p-5 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-4">Debt Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            ['Credit Card Debt', 'creditCardDebts'],
            ['Student Loan Debt', 'studentLoanDebts'],
            ['Personal Debt', 'personalDebts'],
            ['Car Loan Debt', 'carLoanDebts'],
          ] as [string, 'creditCardDebts'|'studentLoanDebts'|'personalDebts'|'carLoanDebts'][]).map(([label, col]) => (
            <div key={col}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-white">{label}</span>
              </div>
              <div className="space-y-2">
                {fif[col].map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MoneyInput value={row.amount} onChange={v => updDebt(col, i, { amount: v })} />
                    <button type="button" onClick={() => updDebt(col, i, { overpayment: !row.overpayment })}
                      title="Making overpayments?"
                      className={clsx('w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center text-xs transition',
                        row.overpayment ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-gray-700 text-gray-600')}>
                      ✓
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">✓ = overpaying</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
