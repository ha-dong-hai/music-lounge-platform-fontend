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
            background: 'var(--color-espresso)',
            color: 'var(--color-cream)',
            border: '1px solid var(--color-espresso-soft)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--color-brand-on-dark)', secondary: 'var(--color-espresso)' } },
          error: { iconTheme: { primary: '#E27A6E', secondary: 'var(--color-espresso)' } }
        }}
      />
    </>

  )
}

export default App