import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncApi } from '../lib/api'
import { Sparkles, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface QuickParseModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickParseModal({ isOpen, onClose }: QuickParseModalProps) {
  const [rawText, setRawText] = useState('')
  const queryClient = useQueryClient()

  const parseMutation = useMutation({
    mutationFn: async (text: string) => {
      const nowStr = new Date().toISOString()
      const res = await syncApi.sync({
        device_id: 'web-pwa-client',
        device_type: 'web',
        messages: [
          {
            source: 'sms',
            raw_content: text,
            received_at: nowStr,
          },
        ],
      })
      return res.data
    },
    onSuccess: (data) => {
      const created = data?.created || 0
      if (created > 0) {
        toast.success(`Successfully parsed and added ${created} transaction(s)!`)
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-insights'] })
        setRawText('')
        onClose()
      } else {
        toast.error('Could not extract a valid transaction amount from the message.')
      }
    },
    onError: () => {
      toast.error('Failed to parse message. Please check the text format.')
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-2 border border-hairline rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between bg-surface-3/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mint" />
            <h3 className="text-base sm:text-lg font-bold text-text-hi font-display">
              Smart SMS & Email Parser
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-lo hover:text-text-hi rounded-lg hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs text-text-lo leading-relaxed">
            Paste any bank SMS, UPI message, or transaction email below. Our AI parser will automatically extract the amount, merchant, category, and date (supports both <strong className="text-flame">Debits</strong> & <strong className="text-emerald-400">Credits</strong>).
          </p>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste SMS e.g.: 'Rs 450.00 debited from A/c XX1234 at Swiggy on 29-Jul-26' or 'INR 75,000 credited towards Salary'..."
            className="w-full h-32 p-3 bg-surface-3 border border-hairline rounded-xl text-xs text-text-hi placeholder-text-lo focus:outline-none focus:border-mint transition-colors resize-none font-mono"
          />

          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-lo bg-surface-3/40 p-2.5 rounded-xl border border-hairline/60">
            <div className="flex items-center gap-1.5 text-flame font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Debits (Swiggy, Uber, Amazon...)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Credits (Salary, Refunds, Cashback...)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-hairline flex items-center justify-end gap-2 bg-surface-3/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-3 hover:bg-surface-1 text-text-hi text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => parseMutation.mutate(rawText)}
            disabled={!rawText.trim() || parseMutation.isPending}
            className="px-4 py-2 bg-mint-violet hover:brightness-110 text-ink text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {parseMutation.isPending ? 'Parsing...' : 'Parse & Auto-Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
