'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { X, Copy, Check, Smartphone, MessageSquare } from 'lucide-react'
import { smsLink } from '@/lib/messages'
import { useToast } from '@/components/Toast'

export default function MessageModal({
  open, onClose, name, phone, message,
}: { open: boolean; onClose: () => void; name: string; phone: string; message: string }) {
  const { toast } = useToast()
  const [text, setText] = useState(message)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [onPhone, setOnPhone] = useState(false)

  useEffect(() => { setText(message) }, [message, open])

  // Detect a phone or installed web-app, where the Messages app can open directly
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setOnPhone(mobile || standalone)
  }, [])

  useEffect(() => {
    if (!open) return
    const link = smsLink(phone, text)
    QRCode.toDataURL(link, { width: 260, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr).catch(() => setQr(''))
  }, [open, phone, text])

  if (!open) return null

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true); toast('Message copied', 'success')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90] px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card-gold w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-black text-white">Send to {name}</h2>
            <p className="text-xs text-gray-500">{phone || 'No phone on file'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Editable message */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Message <span className="text-gray-600 normal-case">(edit if you want)</span></label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none" />
          </div>

          {/* Send directly from this device (phone / installed web app) */}
          {onPhone && phone && (
            <a href={smsLink(phone, text)}
              className="w-full flex items-center justify-center gap-2 gold-gradient text-black font-black py-3 rounded-xl hover:opacity-90 transition">
              <MessageSquare size={17} /> Send Text in Messages
            </a>
          )}

          {/* Copy */}
          <button onClick={copy}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition">
            {copied ? <><Check size={16} className="text-green-500" /> Copied</> : <><Copy size={16} /> Copy message</>}
          </button>

          {/* QR to phone — only needed on desktop; phones use the button above */}
          {!onPhone && phone ? (
            <div className="card p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Smartphone size={15} className="text-yellow-500" />
                <p className="text-sm font-bold text-white">Send from your phone</p>
              </div>
              {qr && <img src={qr} alt="Scan to text" className="w-44 h-44 mx-auto rounded-lg bg-white p-2" />}
              <p className="text-xs text-gray-500 mt-3">Scan with your phone's camera → your Messages app opens with this text pre-filled to {name}. One tap to send — it goes from your number.</p>
            </div>
          ) : !phone ? (
            <p className="text-xs text-gray-600 text-center">Add a phone number to this contact to send a text.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
