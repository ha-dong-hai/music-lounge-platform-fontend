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
      toast.success('Donate thành công!')
      onClose()
    } catch (err) {
      toast.error('Donate thất bại!')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Heart className="text-red-500" size={20}/> Donate</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* CHỌN NGHỆ SĨ */}
          <div>
            <label className="text-sm font-semibold text-gray-400 mb-2 block">Chọn nghệ sĩ</label>
            <div className="flex flex-wrap gap-2">
              {performers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPerformer(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedPerformer?.id === p.id ? 'border-[#C3B665] bg-[#C3B665]/10 text-[#C3B665]' : 'border-gray-700 text-gray-300 hover:border-gray-500'
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
            <label className="text-sm font-semibold text-gray-400 mb-2 block">Mức tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {DONATE_OPTIONS.map(val => (
                <button
                  key={val}
                  onClick={() => { setAmount(val); setCustomAmount('') }}
                  className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                    amount === val && !customAmount ? 'border-[#C3B665] bg-[#C3B665]/10 text-[#C3B665]' : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {val.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>
            <input 
              type="number"
              placeholder="Hoặc nhập số tiền khác..."
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="mt-2 w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C3B665]"
            />
          </div>

          {/* LỜI NHẮN */}
          <div>
            <label className="text-sm font-semibold text-gray-400 mb-2 block">Lời nhắn (Dùng cho sổ cái)</label>
            <textarea
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C3B665] resize-none"
              placeholder="Gửi lời chúc cho nghệ sĩ..."
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-800">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#C3B665] text-black font-bold hover:bg-[#d4c87f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Heart size={16} className="fill-red-500 text-red-500"/>}
            Donate {finalAmount.toLocaleString('vi-VN')}đ
          </button>
        </div>
      </div>
    </div>
  )
}

export default DonateModal