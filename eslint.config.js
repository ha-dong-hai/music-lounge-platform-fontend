import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    // Mã LẤY NGUYÊN từ thư viện React Bits (github.com/DavidHDev/react-bits, MIT + Commons Clause),
    // biến thể JS + Tailwind. Không lint mã của bên thứ ba: sửa nó cho hết cảnh báo nghĩa là tạo ra
    // một nhánh riêng phải tự bảo trì, và lần cập nhật thư viện sau sẽ ghi đè mất.
    // ĐÃ BỎ MỘT NGOẠI LỆ (23/09/2026): trước đây có thêm dòng
    // '!src/components/reactbits/MotionGuard.jsx' để vẫn lint file đó, vì nó là mã của DỰ ÁN nằm
    // lẫn trong thư mục hàng đi lấy về. Nay MotionGuard đã chuyển sang src/components/shared/ nên
    // ngoại lệ hết nghĩa — giữ lại là để một dòng cấu hình trỏ vào đường dẫn không tồn tại, thứ sẽ
    // làm người đọc sau tưởng là có ý đồ.
    // LUẬT RÚT RA: thư mục này CHỈ chứa mã của bên thứ ba; đồ tự viết để ở shared/.
    // Cổng scripts/kiem-component.mjs canh đúng luật đó.
    // LƯU Ý KHI ĐỌC KẾT QUẢ LINT: vì thư mục này bị bỏ qua, truyền nó vào eslint sẽ làm lệnh
    // THOÁT 2 và không lint file nào — dễ đọc nhầm thành "sạch".
    'src/components/reactbits/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
