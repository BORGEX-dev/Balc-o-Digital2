import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import { KanbanBoard } from './components/KanbanBoard';
import { checkAndPerformReset } from './utils/supabaseSync';
import { ThemeProvider } from './contexts/ThemeContext';
import { authService } from './lib/supabase';

  const removeFloating = () => {
  document.querySelectorAll('[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"][style*="z-index: 2147483647"]').forEach(el => el.remove());
};

// executa já no load
removeFloating();

// observa mudanças no DOM
const observer = new MutationObserver(removeFloating);
observer.observe(document.body, { childList: true, subtree: true });

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário autenticado no Supabase
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const profile = await authService.getUserProfile(user.id);
          setCurrentUser({
            id: user.id,
            email: user.email || '',
            firstName: profile?.first_name || 'Usuário',
            lastName: profile?.last_name || ''
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
      setIsLoading(false);
    };
    
    checkAuth();

    // Verificar se precisa fazer reset diário
    if (currentUser) {
      checkAndPerformReset(currentUser.id);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AuthScreen onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <KanbanBoard onLogout={handleLogout} currentUser={currentUser} />
    </ThemeProvider>
  );
}

export default App;