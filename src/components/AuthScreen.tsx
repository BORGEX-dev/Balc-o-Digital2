import React, { useState } from 'react';
import { Utensils, User, Lock, Eye, EyeOff, Mail, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './ThemeToggle';
import { authService } from '@/lib/supabase';

interface AuthScreenProps {
  onLogin: (user: { id: string; email: string; firstName: string; lastName: string }) => void;
}

type AuthMode = 'login' | 'register';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        setError('Nome é obrigatório');
        return false;
      }
      if (!formData.lastName.trim()) {
        setError('Sobrenome é obrigatório');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // Cadastro
        const { user } = await authService.signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );

        if (user) {
          // Criar perfil do usuário
          await authService.upsertUserProfile(
            user.id,
            formData.firstName,
            formData.lastName,
            formData.email
          );

          // Fazer login automaticamente após cadastro
          setSuccessMessage('Cadastro realizado com sucesso!');
          
          // Aguardar um pouco para mostrar a mensagem e depois fazer login
          setTimeout(() => {
            onLogin({
              id: user.id,
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName
            });
          }, 1500);
        }
      } else {
        // Login
        const { user } = await authService.signIn(formData.email, formData.password);
        
        if (user) {
          // Buscar perfil do usuário
          const profile = await authService.getUserProfile(user.id);
          
          onLogin({
            id: user.id,
            email: user.email || formData.email,
            firstName: profile?.first_name || 'Usuário',
            lastName: profile?.last_name || ''
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Verifique seu email para confirmar a conta');
      } else {
        setError(error.message || 'Erro ao processar solicitação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    setError('');
    setSuccessMessage('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Botão de tema no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
          <div className="px-8 py-12">
            <div className="text-center mb-8">
              <div className="mb-6">
                <img 
                  src="https://i.imgur.com/cwg06jT.png" 
                  alt="Balcão Digital Logo" 
                  className="w-20 h-20 mx-auto rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300 object-cover border-4 border-white"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Utensils className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Balcão Digital
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sistema de Gestão Gastronômica
              </p>
            </div>

            {/* Navegação entre Login e Cadastro */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos de Cadastro */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Nome"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Sobrenome"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Digite seu email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              {/* Senha */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirmar Senha (apenas no cadastro) */}
              {mode === 'register' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirme sua senha"
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}

              {/* Mensagem de Erro */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                  <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Botão de Submit */}
              <button
                type="submit"
                disabled={isLoading || successMessage}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {successMessage ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Redirecionando...
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {mode === 'register' ? 'Cadastrando...' : 'Entrando...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {mode === 'register' ? (
                      <>
                        <UserPlus className="h-5 w-5" />
                        Criar Conta
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Entrar
                      </>
                    )}
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'register' 
                  ? 'Ao criar uma conta, você concorda com nossos termos de uso'
                  : 'Desenvolvido para otimizar seu negócio gastronômico'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}