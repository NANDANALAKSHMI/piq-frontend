import AppRoutes from './routes/AppRoutes.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppDataProvider>
            <AppRoutes />
          </AppDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
