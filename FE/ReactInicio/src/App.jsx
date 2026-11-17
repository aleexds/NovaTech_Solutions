import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import AppRoutes from './routing/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}