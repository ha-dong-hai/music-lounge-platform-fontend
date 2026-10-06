// Chạy: node src/utils/authRedirect.test.mjs
//
// Bộ kiểm cho lỗi "đăng nhập xong không được đưa về khu của mình, phải tự gõ URL".
// Lỗi gốc: hooks/useAuth.js chỉ có `role === 'Admin' ? '/admin' : '/'` nên Owner và Staff rơi về
// trang chủ công khai. Ca 2 và ca 3 dưới đây ĐỎ trên bản cũ, XANH trên bản đã sửa.
import { destinationForRole, dichSauDangNhap, duongDanNoiBoHopLe, vaiVaoDuoc } from './authRedirect.js'

let fail = 0
const check = (ten, duoc, muon) => {
  const ok = duoc === muon
  if (!ok) fail++
  console.log(`${ok ? '  ok  ' : 'THẤT BẠI'} ${ten}\n         muốn: ${JSON.stringify(muon)}  được: ${JSON.stringify(duoc)}`)
}

console.log('— Đích mặc định của từng vai (phủ đủ 4 vai đăng nhập) —')
check('Admin vào khu quản trị', destinationForRole('Admin'), '/admin')
check('Owner vào khu phòng trà', destinationForRole('Owner'), '/owner')
check('Staff vào khu phòng trà', destinationForRole('Staff'), '/owner')
check('Audience về trang chủ', destinationForRole('Audience'), '/')
check('Vai lạ backend thêm sau thì về trang chủ, không vỡ', destinationForRole('Performer'), '/')
check('Không có vai thì về trang chủ', destinationForRole(undefined), '/')

console.log('\n— Quay lại đúng trang đang muốn vào trước khi bị chặn —')
check('Owner bị chặn ở /owner/shows thì quay lại đó', dichSauDangNhap('Owner', '/owner/shows'), '/owner/shows')
check('Giữ cả query string', dichSauDangNhap('Audience', '/account?tab=identity'), '/account?tab=identity')
check('Không có from thì dùng đích của vai', dichSauDangNhap('Admin', undefined), '/admin')
check('from rỗng thì dùng đích của vai', dichSauDangNhap('Staff', ''), '/owner')

console.log('\n— Vai không vào được nơi bị chặn thì KHÔNG quay lại đó —')
// Đây đúng là lỗi thật đã gặp: mở /owner/shows/12/settings khi chưa đăng nhập, bị đẩy ra /login,
// rồi đăng nhập bằng tài khoản ADMIN. Bản trước trả lại đường dẫn /owner đó, ProtectedRoute của khu
// /owner chặn Admin, và Admin rơi về trang chủ thay vì khu quản trị.
check('Admin bị chặn ở /owner/... thì về /admin chứ không quay lại', dichSauDangNhap('Admin', '/owner/shows/12/settings'), '/admin')
check('Staff bị chặn ở /admin/... thì về /owner', dichSauDangNhap('Staff', '/admin/accounts'), '/owner')
check('Owner bị chặn ở /admin thì về /owner', dichSauDangNhap('Owner', '/admin'), '/owner')
check('Audience bị chặn ở /owner thì về trang chủ', dichSauDangNhap('Audience', '/owner/shows'), '/')
check('Staff VÀO ĐƯỢC khu /owner nên quay lại đúng chỗ', dichSauDangNhap('Staff', '/owner/operate'), '/owner/operate')
check('Admin quay lại đúng trang admin đang muốn vào', dichSauDangNhap('Admin', '/admin/refunds'), '/admin/refunds')
check('Trang không giới hạn vai thì ai cũng quay lại được', dichSauDangNhap('Audience', '/my-shows'), '/my-shows')
check('So theo ranh giới đoạn: /ownership KHÔNG phải khu /owner', vaiVaoDuoc('Audience', '/ownership'), true)
check('Có query string vẫn nhận ra khu admin', vaiVaoDuoc('Owner', '/admin?tab=1'), false)

console.log('\n— MLACP-687: trang con chỉ-Owner trong khu /owner —')
// Lỗi thật 06/10: chủ phòng trà đăng xuất ở /owner/staff, nhân viên đăng nhập → bị trả về /owner/staff → 403.
check('Staff bị chặn ở /owner/staff thì về /owner, không quay lại', dichSauDangNhap('Staff', '/owner/staff'), '/owner')
check('Staff bị chặn ở /owner/shows/12/settings thì về /owner', dichSauDangNhap('Staff', '/owner/shows/12/settings'), '/owner')
check('Owner vẫn quay lại /owner/staff', dichSauDangNhap('Owner', '/owner/staff'), '/owner/staff')
check('Staff vẫn quay lại /owner/fnb-orders (trang của nhân viên)', dichSauDangNhap('Staff', '/owner/fnb-orders'), '/owner/fnb-orders')
check('Ranh giới đoạn: /owner/staffing (giả định) không bị coi là /owner/staff', vaiVaoDuoc('Staff', '/owner/staffing'), true)

// CHỐNG LỆCH VỚI ROUTER: đọc AppRouter.jsx, mọi trang con của /owner khoá requiredRoles={['Owner']} phải bị chặn với Staff
// ở đây, và mọi trang con KHÔNG khoá thì Staff vào được. Chặn "quét trúng số không": phải thấy ít nhất 10 trang chỉ-Owner.
{
  const { readFileSync } = await import('node:fs')
  const router = readFileSync(new URL('../routes/AppRouter.jsx', import.meta.url), 'utf8')
  const khoiOwner = router.slice(router.indexOf("path: '/owner'"), router.indexOf("path: '/admin'"))
  const chiOwner = [...khoiOwner.matchAll(/\{ path: '([^']+)', element: <ProtectedRoute requiredRoles=\{\['Owner'\]\}>/g)].map((m) => m[1])
  const moChoStaff = [...khoiOwner.matchAll(/\{ path: '([^']+)', element: <(?!ProtectedRoute)/g)].map((m) => m[1])
  check(`Router có >= 10 trang chỉ-Owner (đọc được ${chiOwner.length})`, chiOwner.length >= 10, true)
  check(`Router có >= 3 trang Staff vào được (đọc được ${moChoStaff.length})`, moChoStaff.length >= 3, true)
  for (const p of chiOwner) check(`Router khoá /owner/${p} chỉ-Owner → Staff không được trả về đó`, vaiVaoDuoc('Staff', `/owner/${p.replace(/:\w+/g, 'x')}`), false)
  for (const p of moChoStaff) check(`Router mở /owner/${p} cho Staff → Staff được trả về đó`, vaiVaoDuoc('Staff', `/owner/${p.replace(/:\w+/g, 'x')}`), true)
}

console.log('\n— Chặn chuyển hướng ra ngoài —')
check('Chặn giao thức tương đối //evil.com', dichSauDangNhap('Owner', '//evil.com'), '/owner')
check('Chặn URL tuyệt đối', dichSauDangNhap('Owner', 'https://evil.com'), '/owner')
check('Chặn đường dẫn không bắt đầu bằng /', dichSauDangNhap('Admin', 'evil.com'), '/admin')
check('duongDanNoiBoHopLe từ chối số', duongDanNoiBoHopLe(123), false)

console.log(fail === 0 ? '\nTất cả đều qua.' : `\n${fail} ca THẤT BẠI.`)
process.exit(fail === 0 ? 0 : 1)
