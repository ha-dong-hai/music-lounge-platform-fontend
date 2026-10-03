// src/pages/user/MyShowsPage.jsx
//
// VÉ CỦA TÔI — trang chứa năm mục của khán giả: vé, yêu thích, vé chuyển đến, hoàn tiền, ủng hộ.
// Làm lại 30/09 theo thế giới "tờ chương trình" (DESIGN.md). Tiêu đề đổi từ "Danh sách của tôi" thành "Vé của tôi" cho
// khớp với nút "Vé của tôi" ở đầu trang dẫn tới đây (tên ở nút và tên ở trang phải là một).
// Hàng tab cuộn ngang trên màn hẹp: năm tab không vừa 390px, bản cũ căn phải nên tab đầu bị đẩy ra ngoài màn hình.
// Tab đang mở nằm trên URL (?muc=refunds, 01/10/2026): danh sách trong tab có phân trang trên URL (vd. hoanTrang), nên
// tải lại hay Quay lại phải mở đúng tab chứa trang đó; và nơi khác dẫn thẳng vào một tab được (PaymentResultPage →
// ?muc=donations sau khi ủng hộ — trước đây rơi về tab Vé).
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import TicketsTab from '../../components/myshows/TicketsTab'
import WishlistTab from '../../components/myshows/WishlistTab'
import IncomingTransfersTab from '../../components/myshows/IncomingTransfersTab'
import RefundRequestsTab from '../../components/myshows/RefundRequestsTab'
import MyDonationsTab from '../../components/myshows/MyDonationsTab'
import usePhimTab from '../../hooks/usePhimTab'

const TAB = [
  ['shows', 'Vé'],
  ['wishlist', 'Yêu thích'],
  ['transfers', 'Vé chuyển đến'],
  ['refunds', 'Hoàn tiền'],
  ['donations', 'Ủng hộ'],
]
const KHOA_TAB = TAB.map(([khoa]) => khoa)

const MUC = parseAsStringLiteral(TAB.map(([khoa]) => khoa)).withDefault('shows')

const MyShowsPage = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const [activeMainTab, setActiveMainTab] = useQueryState('muc', MUC.withOptions({ history: 'push' }))
  // Bàn phím cho tablist (APG). Tab 'shows' là mặc định nên ghi null lên URL — giữ đúng quy ước của onClick.
  const phimTab = usePhimTab(KHOA_TAB, activeMainTab, (k) => setActiveMainTab(k === 'shows' ? null : k))

  return (
    <div className="min-h-[60vh] bg-stock text-ink pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] text-ink">Vé của tôi</h1>

        {!user ? (
          <div className="mt-8 bg-card border-2 border-ink p-8 sm:p-12 max-w-2xl">
            <p className="font-display text-3xl leading-none">Đăng nhập để xem vé.</p>
            <p className="text-ink-soft mt-3">Vé đã mua, mã QR vào cửa và các yêu cầu hoàn tiền đều nằm trong tài khoản của bạn.</p>
            {/* state.from: đăng nhập xong quay lại đúng trang này (LoginPage kiểm vai trước khi dùng). */}
            <Link to="/login" state={{ from: location }} className="inline-flex items-center min-h-[44px] mt-5 px-6 bg-ink text-lamp font-semibold hover:bg-board transition-colors">Đăng nhập</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 mb-8 border-b-2 border-ink">
              <div className="flex gap-6 sm:gap-10 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Các mục của tôi">
                {TAB.map(([khoa, nhan]) => (
                  <button key={khoa} type="button" role="tab" id={`tab-cua-toi-${khoa}`} aria-selected={activeMainTab === khoa} aria-controls="noi-dung-cua-toi"
                    {...phimTab(khoa)} onClick={() => setActiveMainTab(khoa === 'shows' ? null : khoa)}
                    className={`min-h-[48px] pb-3 text-lg font-semibold whitespace-nowrap border-b-4 -mb-[2px] transition-colors ${activeMainTab === khoa ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}>
                    {nhan}
                  </button>
                ))}
              </div>
            </div>

            {/* MỖI TAB TỰ QUẢN LÝ STATE + API RIÊNG */}
            <div id="noi-dung-cua-toi" role="tabpanel" aria-labelledby={`tab-cua-toi-${activeMainTab}`}>
              {activeMainTab === 'shows' && <TicketsTab />}
              {activeMainTab === 'wishlist' && <WishlistTab />}
              {activeMainTab === 'transfers' && <IncomingTransfersTab />}
              {activeMainTab === 'refunds' && <RefundRequestsTab />}
              {activeMainTab === 'donations' && <MyDonationsTab />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyShowsPage
