import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'

import AppRouter from './routes/AppRouter'
import { Toaster } from 'react-hot-toast'
import { QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { queryClient } from './lib/queryClient'
import { useTranslation } from 'react-i18next'

function App() {
  // Đổi ngôn ngữ (src/i18n) → `key` đổi → vẽ lại TOÀN BỘ cây route: component nào cũng in lại theo ngôn ngữ mới, kể cả chỗ
  // chỉ gọi hàm định dạng ngày mà không dùng useTranslation. Bộ đệm dữ liệu bị xoá để tải lại câu chữ từ máy chủ (tên thể
  // loại, thông điệp) theo Accept-Language mới.
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [langDaVe, setLangDaVe] = useState(lang)
  if (langDaVe !== lang) {
    setLangDaVe(lang)
    queryClient.clear()
  }
  return (

    <>
      {/* Danh sách có phân trang/bộ lọc máy chủ: TanStack Query giữ dữ liệu, nuqs giữ trang và bộ lọc trên URL.
          NuqsAdapter chỉ cấp hook qua context — các hook router chạy bên trong route, nên bọc ngoài RouterProvider. */}
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <RouterProvider key={lang} router={AppRouter} />
        </NuqsAdapter>
      </QueryClientProvider>

      <Toaster
        position="top-center"
        toastOptions={{
          // Thông báo là một mảng espresso nhỏ trên nền ngà — cùng bảng token với cả giao diện
          // (src/index.css), không dùng màu xám-xanh mặc định của thư viện.
          style: {
            background: 'var(--color-ink)',
            color: 'var(--color-lamp)',
            border: '1px solid var(--color-board-soft)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--color-stock)', secondary: 'var(--color-ink)' } },
          error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-card)' } }
        }}
      />
    </>

  )
}

export default App