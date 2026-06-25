import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import './App.css';

function App() {
  return (
    <>
      <div className="auth-bg"></div>
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(30, 30, 50, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: "'Inter', system-ui, sans-serif",
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

export default App;
