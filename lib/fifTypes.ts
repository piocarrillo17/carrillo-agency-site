export interface InsuranceRow {
  type: string; faceAmount: string; purpose: string
  premium: string; cashValue: string; carrier: string; expiration: string
}

export interface AssetRow {
  types: string[]; currentValue: string; contributing: boolean; purpose: string
}

export interface DebtRow { amount: string; overpayment: boolean }

export interface FIFData {
  // Header (pre-filled from lead)
  insured: string; email: string; phone: string
  address: string; cityStateZip: string
  // Mortgage
  lender: string; interestPct: string; term: string
  loanAmount: string; payment: string; accelerated: string; estimatedEquity: string
  // Insurance (3 rows)
  insurance: InsuranceRow[]
  // Assets (5 rows)
  assets: AssetRow[]
  // Monthly expenses
  expMortgage: string; expCar: string; expUtilities: string
  expOtherInsurance: string; expCreditCard: string; expOther: string
  // Combined income
  clientWages: string; clientSS: string; clientPension: string
  spouseWages: string; spouseSS: string; spousePension: string
  // Individual survivors income
  clientIncomeAlone: string; spouseIncomeAlone: string
  // Debt info (3 rows each)
  creditCardDebts: DebtRow[]; studentLoanDebts: DebtRow[]
  personalDebts: DebtRow[]; carLoanDebts: DebtRow[]
  // Closing script context stored here too
  closingJson: string
}

export const BLANK_INSURANCE: InsuranceRow = { type: '', faceAmount: '', purpose: '', premium: '', cashValue: '', carrier: '', expiration: '' }
export const BLANK_ASSET: AssetRow = { types: [], currentValue: '', contributing: false, purpose: '' }
export const BLANK_DEBT: DebtRow = { amount: '', overpayment: false }

export function blankFIF(): FIFData {
  return {
    insured: '', email: '', phone: '', address: '', cityStateZip: '',
    lender: '', interestPct: '', term: '', loanAmount: '', payment: '', accelerated: '', estimatedEquity: '',
    insurance: [{ ...BLANK_INSURANCE }, { ...BLANK_INSURANCE }, { ...BLANK_INSURANCE }],
    assets: Array.from({ length: 5 }, () => ({ ...BLANK_ASSET, types: [] })),
    expMortgage: '', expCar: '', expUtilities: '', expOtherInsurance: '', expCreditCard: '', expOther: '',
    clientWages: '', clientSS: '', clientPension: '',
    spouseWages: '', spouseSS: '', spousePension: '',
    clientIncomeAlone: '', spouseIncomeAlone: '',
    creditCardDebts: Array.from({ length: 3 }, () => ({ ...BLANK_DEBT })),
    studentLoanDebts: Array.from({ length: 3 }, () => ({ ...BLANK_DEBT })),
    personalDebts: Array.from({ length: 3 }, () => ({ ...BLANK_DEBT })),
    carLoanDebts: Array.from({ length: 3 }, () => ({ ...BLANK_DEBT })),
    closingJson: '',
  }
}

export function sumFIF(vals: string[]): number {
  return vals.reduce((s, v) => s + (parseFloat(v) || 0), 0)
}

export function fmtMoney(n: number) {
  return n === 0 ? '' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
