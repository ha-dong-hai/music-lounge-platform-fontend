// src/pages/owner/OwnerFnbMenusPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Một phòng trà có nhiều THỰC ĐƠN (ví dụ "Đồ uống", "Đồ ăn nhẹ"), mỗi thực đơn có nhiều MÓN.
//   Khách đặt món ở /lounge/:id/order đọc đúng dữ liệu này.
// - Cả hai lệnh PUT đều ghi đè toàn phần: sửa tên món mà quên gửi lại `isAvailable`/`displayOrder`
//   là mất giá trị cũ. Form vì vậy luôn gửi lại đủ những gì đang hiển thị.
// - Hết món thì TẮT `isAvailable`, đừng xoá: đơn cũ còn tham chiếu tên món, xoá đi là đơn cũ mất
//   thông tin. Xoá chỉ dành cho món khai nhầm.
// - `displayOrder` quyết định thứ tự khách nhìn thấy, số nhỏ lên trước.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, Trash2, X, UtensilsCrossed, EyeOff, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { getLounges } from '../../services/loungeServices'
import {
  getMenus, getMenuItems, createMenu, updateMenu, deleteMenu,
  createMenuItem, updateMenuItem, deleteMenuItem,
} from '../../services/fnbServices'
import ConfirmModal from '../../components/shared/ConfirmModal'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`
const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-5 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
      </div>
      <div className="p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
)

const MenuFormModal = ({ initial, loungeId, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    isActive: initial?.isActive ?? true,
    displayOrder: initial?.displayOrder ?? 0,
  })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Cần đặt tên cho thực đơn.'); return }
    setIsBusy(true)
    try {
      if (isEdit) {
        await updateMenu(initial.id, {
          name: form.name.trim(), description: form.description.trim() || null,
          isActive: form.isActive, displayOrder: Number(form.displayOrder) || 0,
        })
      } else {
        await createMenu({
          loungeId, name: form.name.trim(),
          description: form.description.trim() || null,
          displayOrder: Number(form.displayOrder) || 0,
        })
      }
      toast.success(isEdit ? 'Đã lưu thực đơn.' : 'Đã tạo thực đơn.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được thực đơn.')
    } finally { setIsBusy(false) }
  }

  return (
    <Modal title={isEdit ? 'Sửa thực đơn' : 'Thêm thực đơn'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500">Tên thực đơn <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="VD: Đồ uống" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Mô tả</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Thứ tự hiển thị</label>
          <input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className={inputCls} />
          <p className="text-xs text-gray-600 mt-1">Số nhỏ hiện lên trước.</p>
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="accent-[#C3B665]" />
            Đang mở cho khách đặt
          </label>
        )}
        <button type="submit" disabled={isBusy}
          className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {isBusy && <Loader2 size={16} className="animate-spin" />} Lưu
        </button>
      </form>
    </Modal>
  )
}

const ItemFormModal = ({ initial, menuId, onClose, onSaved }) => {
  const isEdit = !!initial
  const [form, setForm] = useState({
    category: initial?.category ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? '',
    imageUrl: initial?.imageUrl ?? '',
    isAvailable: initial?.isAvailable ?? true,
    displayOrder: initial?.displayOrder ?? 0,
  })
  const [isBusy, setIsBusy] = useState(false)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.category.trim() || form.price === '') {
      toast.error('Cần điền nhóm món, tên món và giá.')
      return
    }
    setIsBusy(true)
    try {
      const chung = {
        category: form.category.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        imageUrl: form.imageUrl.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
      }
      if (isEdit) {
        // Gửi lại cả isAvailable: PUT ghi đè, bỏ trống là món đang tạm hết bỗng mở bán lại.
        await updateMenuItem(initial.id, { ...chung, isAvailable: form.isAvailable })
      } else {
        await createMenuItem({ menuId, ...chung })
      }
      toast.success(isEdit ? 'Đã lưu món.' : 'Đã thêm món.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được món.')
    } finally { setIsBusy(false) }
  }

  return (
    <Modal title={isEdit ? 'Sửa món' : 'Thêm món'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Nhóm món <span className="text-red-400">*</span></label>
            <input value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls} placeholder="VD: Cà phê" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Giá (đ) <span className="text-red-400">*</span></label>
            <input type="number" min="0" step="1000" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Tên món <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Mô tả</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Đường dẫn ảnh</label>
          <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-gray-500">Thứ tự hiển thị</label>
          <input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className={inputCls} />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => set('isAvailable', e.target.checked)} className="accent-[#C3B665]" />
            Còn bán
          </label>
        )}
        <button type="submit" disabled={isBusy}
          className="w-full py-2.5 bg-[#C3B665] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {isBusy && <Loader2 size={16} className="animate-spin" />} Lưu
        </button>
      </form>
    </Modal>
  )
}

const OwnerFnbMenusPage = () => {
  const [lounge, setLounge] = useState(null)
  const [menus, setMenus] = useState([])
  const [menuId, setMenuId] = useState(null)
  const [items, setItems] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [editingMenu, setEditingMenu] = useState(undefined)
  const [editingItem, setEditingItem] = useState(undefined)
  const [xoaTarget, setXoaTarget] = useState(null) // { loai: 'menu'|'item', doiTuong }
  const [isDeleting, setIsDeleting] = useState(false)

  const loadMenus = useCallback(async (giuMenuId) => {
    setIsLoading(true)
    try {
      const res = await getLounges({ mine: true })
      const ds = res.success ? (Array.isArray(res.data) ? res.data : res.data?.items) : null
      const cuaToi = ds?.[0] ?? null
      setLounge(cuaToi)
      if (!cuaToi) return

      const mRes = await getMenus(cuaToi.id)
      if (mRes.success) {
        const ds2 = Array.isArray(mRes.data) ? mRes.data : mRes.data?.items ?? []
        setMenus(ds2)
        setMenuId((cu) => giuMenuId ?? cu ?? ds2[0]?.id ?? null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được thực đơn.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadItems = useCallback(async () => {
    if (!menuId) { setItems([]); return }
    setIsLoadingItems(true)
    try {
      const res = await getMenuItems(menuId)
      if (res.success) setItems(Array.isArray(res.data) ? res.data : res.data?.items ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách món.')
      setItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }, [menuId])

  useEffect(() => { const chay = async () => { await loadMenus() }; chay() }, [loadMenus])
  useEffect(() => { const chay = async () => { await loadItems() }; chay() }, [loadItems])

  const xacNhanXoa = async () => {
    if (!xoaTarget) return
    setIsDeleting(true)
    try {
      if (xoaTarget.loai === 'menu') {
        await deleteMenu(xoaTarget.doiTuong.id)
        toast.success('Đã xoá thực đơn.')
        setMenuId(null)
        await loadMenus()
      } else {
        await deleteMenuItem(xoaTarget.doiTuong.id)
        toast.success('Đã xoá món.')
        await loadItems()
      }
      setXoaTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xoá được.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading && !menus.length) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#C3B665]" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Thực đơn</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400">Hãy tạo hồ sơ phòng trà trước — thực đơn gắn với phòng trà.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Thực đơn</h1>
          <p className="text-gray-400 text-sm">Đây là thứ khách nhìn thấy khi đặt món tại bàn.</p>
        </div>
        <button onClick={() => setEditingMenu(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C3B665] text-black rounded-lg text-xs font-bold hover:bg-[#d4c87f]">
          <Plus size={14} /> Thêm thực đơn
        </button>
      </div>

      {menus.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <UtensilsCrossed size={28} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">Chưa có thực đơn nào. Tạo một thực đơn để bắt đầu thêm món.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {menus.map((m) => (
              <button key={m.id} onClick={() => setMenuId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${menuId === m.id
                  ? 'bg-gray-800 border-[#C3B665]/40 text-[#C3B665]'
                  : 'bg-black border-gray-800 text-gray-400 hover:text-white'}`}>
                {m.name}
                {!m.isActive && <span className="ml-1.5 text-gray-600">(đang tắt)</span>}
              </button>
            ))}
          </div>

          {menuId && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-semibold text-white">
                  {menus.find((m) => m.id === menuId)?.name}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setEditingItem(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C3B665] text-black rounded-lg text-xs font-bold hover:bg-[#d4c87f]">
                    <Plus size={14} /> Thêm món
                  </button>
                  <button onClick={() => setEditingMenu(menus.find((m) => m.id === menuId))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-bold hover:bg-gray-800">
                    <Pencil size={14} /> Sửa thực đơn
                  </button>
                  <button onClick={() => setXoaTarget({ loai: 'menu', doiTuong: menus.find((m) => m.id === menuId) })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-red-400 text-xs font-bold hover:bg-red-500/10">
                    <Trash2 size={14} /> Xoá
                  </button>
                </div>
              </div>

              {isLoadingItems ? (
                <div className="py-10 flex justify-center"><Loader2 size={24} className="animate-spin text-[#C3B665]" /></div>
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">Thực đơn này chưa có món nào.</p>
              ) : (
                <ul className="space-y-2">
                  {[...items].sort((a, b) => a.displayOrder - b.displayOrder).map((it) => (
                    <li key={it.id} className="flex items-start justify-between gap-3 bg-black/40 border border-gray-800 rounded-lg p-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <GripVertical size={14} className="text-gray-700 mt-1 flex-shrink-0" />
                        {it.imageUrl && <img src={it.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium">{it.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">{it.category}</span>
                            {!it.isAvailable && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-700/40 text-gray-400 text-xs">
                                <EyeOff size={11} /> Tạm hết
                              </span>
                            )}
                          </div>
                          {it.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{it.description}</p>}
                          <p className="text-sm text-[#C3B665] font-medium mt-1 tabular-nums">{fmtMoney(it.price)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingItem(it)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-800" title="Sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setXoaTarget({ loai: 'item', doiTuong: it })} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Xoá">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {editingMenu !== undefined && (
        <MenuFormModal initial={editingMenu} loungeId={lounge.id}
          onClose={() => setEditingMenu(undefined)} onSaved={() => loadMenus()} />
      )}
      {editingItem !== undefined && menuId && (
        <ItemFormModal initial={editingItem} menuId={menuId}
          onClose={() => setEditingItem(undefined)} onSaved={loadItems} />
      )}
      {xoaTarget && (
        <ConfirmModal
          isOpen
          title={xoaTarget.loai === 'menu' ? 'Xoá thực đơn này?' : 'Xoá món này?'}
          message={xoaTarget.loai === 'menu'
            ? `"${xoaTarget.doiTuong?.name}" và toàn bộ món trong đó sẽ không còn hiện cho khách. Nếu chỉ muốn tạm dừng, hãy tắt "Đang mở cho khách đặt" thay vì xoá.`
            : `"${xoaTarget.doiTuong?.name}" sẽ bị xoá khỏi thực đơn. Nếu món chỉ tạm hết, hãy tắt "Còn bán" thay vì xoá — đơn cũ vẫn cần tra lại tên món.`}
          confirmText="Xoá"
          isProcessing={isDeleting}
          processingText="Đang xoá..."
          onConfirm={xacNhanXoa}
          onClose={() => setXoaTarget(null)}
        />
      )}
    </div>
  )
}

export default OwnerFnbMenusPage
