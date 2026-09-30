import { RouterProvider } from 'react-router-dom'
import AppRouter from './routes/AppRouter'
import { Toaster } from 'react-hot-toast'

function App() {
  return (

    <>
      <RouterProvider router={AppRouter} />

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