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
          style: {
            background: '#1f2937', // Màu nền gray-800 cho đồng bộ theme
            color: '#fff',
            border: '1px solid #374151'
          },
          success: { iconTheme: { primary: '#25ca35', secondary: '#000' } },
          error: { iconTheme: { primary: '#ca2525', secondary: '#000' } }
        }}
      />
    </>

  )
}

export default App