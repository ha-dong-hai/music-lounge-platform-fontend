import { useState } from 'react'
import { X, Heart, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DONATE_OPTIONS = [10000, 20000, 50000, 100000, 200000, 500000]

const DonateModal = ({ performers, onClose, onSendDonation }) => {
  const [selectedPerformer, setSelectedPerformer] = useState(null)
  const [amount, setAmount] = useState(10000)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const finalAmount = customAmount ? Number(customAmount) : amount

  const handleSubmit = async () => {
    if (!selectedPerformer) return toast.error('Vui lòng chọn nghệ sĩ')
    if (finalAmount < 1000) return toast.error('Số tiền tối thiểu là 1,000đ')

    setIsProcessing(true)
    try {
      await onSendDonation(selectedPerformer.id, finalAmount, message)
      toast.success('Ủng hộ thành công!')
      onClose()
    } catch (err) {
      toast.error('Ủng hộ không thành công!')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="p-5 border-b border-line flex justify-between items-center">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2"><Heart className="text-danger" size={20}/> Ủng hộ</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={20}/></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* CHỌN NGHỆ SĨ */}
          <div>
            <label className="text-sm font-semibold text-ink-soft mb-2 block">Chọn nghệ sĩ</label>
            <div className="flex flex-wrap gap-2">
              {performers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPerformer(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedPerformer?.id === p.id ? 'border-brand bg-brand/10 text-brand-text' : 'border-line text-ink-soft hover:border-line-strong'
                  }`}
                >
                  <img src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} className="w-6 h-6 rounded-full" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* CHỌN MỨC TIỀN */}
          <div>
            <label className="text-sm font-semibold text-ink-soft mb-2 block">Mức tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {DONATE_OPTIONS.map(val => (
                <button
                  key={val}
                  onClick={() => { setAmount(val); setCustomAmount('') }}
                  className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    amount === val && !customAmount ? 'border-brand bg-brand/10 text-brand-text' : 'border-line text-ink-soft hover:border-line-strong'
                  }`}
                >
                  {val.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>
            <input 
              type="number"
              placeholder="Chọn số tiền khác…"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="mt-2 w-full bg-page border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* LỜI NHẮN */}
          <div>
            <label className="text-sm font-semibold text-ink-soft mb-2 block">Lời nhắn (Dùng cho sổ cái)</label>
            <textarea
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-page border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand resize-none"
              placeholder="Gửi lời chúc tới nghệ sĩ…"
            />
          </div>
        </div>

        <div className="p-5 border-t border-line">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-brand text-on-brand font-bold hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Heart size={16} className="fill-red-500 text-danger"/>}
            Ủng hộ {finalAmount.toLocaleString('vi-VN')}đ
          </button>
        </div>
      </div>
    </div>
  )
}

export default DonateModal