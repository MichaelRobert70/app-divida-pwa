import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  ChevronRight, 
  History,
  X,
  CreditCard,
  PieChart,
  Home,
  User,
  LogOut,
  Lock,
  Camera,
  Moon,
  Sun,
  Edit2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Debt, Payment } from './types';
import { db, type User as LocalUser } from './lib/db';
import { loginLocal, signupLocal, updatePasswordLocal, updateDisplayNameLocal } from './lib/auth';

const AUTH_KEY = 'debt_master_auth_v2';
const THEME_KEY = 'debt_master_theme_v2';
const PROFILE_IMAGE_KEY = 'debt_master_profile_image_v2';

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const user = await signupLocal(email, password, email.split('@')[0]);
        onLogin(user);
      } else {
        const user = await loginLocal(email, password);
        if (!user) throw new Error('Email ou senha invalidos');
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300 no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
            <TrendingDown size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
          {isSignUp ? 'Criar Conta' : 'Bem-vindo ao Dívidas'}
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          {isSignUp ? 'Cadastre-se para gerenciar suas dívidas.' : 'Gerencie suas dívidas de forma simples e eficiente.'}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-100 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                placeholder="Sua senha"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isSignUp ? 'Cadastrar' : 'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-emerald-600 dark:text-emerald-500 font-medium hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileScreen = ({ 
  user, 
  onLogout, 
  isDarkMode, 
  toggleDarkMode, 
  profileImage, 
  onImageUpload,
  onUpdateUser,
  onChangePassword
}: { 
  user: any, 
  onLogout: () => void,
  isDarkMode: boolean,
  toggleDarkMode: () => void,
  profileImage: string | null,
  onImageUpload: (file: File) => void,
  onUpdateUser: (data: { display_name: string }) => Promise<void>,
  onChangePassword: (password: string) => Promise<void>
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.display_name || user?.email?.split('@')[0] || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      await onUpdateUser({ display_name: newName });
      setIsEditingName(false);
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setPassLoading(true);
    try {
      await onChangePassword(newPassword);
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Senha alterada com sucesso!');
    } catch (error: any) {
      setPassError(error.message || 'Erro ao alterar senha');
    } finally {
      setPassLoading(false);
    }
  };

  const userDisplayName = user?.display_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Meu Perfil</h2>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border-2 border-emerald-500/20">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-3xl font-bold">{userDisplayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex flex-col gap-2">
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Seu nome"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName(user?.display_name || user?.email?.split('@')[0] || '');
                    }}
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{userDisplayName}</h3>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Dark Mode Toggle */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon size={20} className="text-emerald-500" /> : <Sun size={20} className="text-amber-500" />}
            <span>Tema Escuro</span>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <motion.div 
              animate={{ x: isDarkMode ? 24 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        <button 
          onClick={() => setIsChangingPassword(true)}
          className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-slate-400" />
            <span>Alterar Senha</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
        </button>

        <AnimatePresence>
          {isChangingPassword && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Alterar Senha</h2>
                  <button onClick={() => setIsChangingPassword(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                  {passError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-100 dark:border-rose-800">
                      {passError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Senha</label>
                    <input 
                      type="password" 
                      placeholder="Repita a nova senha"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={passLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                  >
                    {passLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar Senha'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={onLogout}
          className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={20} />
            <span>Sair da Conta</span>
          </div>
          <ChevronRight size={16} className="text-rose-300 dark:text-rose-800" />
        </button>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">Versão 1.1.0</p>
        <p className="text-xs text-slate-300 dark:text-slate-700 mt-1">Feito com ❤️ por Dívidas</p>
      </div>
    </div>
  );
};

// --- PWA Install Prompt Component ---
const PWAInstallPrompt = ({ 
  prompt, 
  onInstall, 
  onClose 
}: { 
  prompt: any, 
  onInstall: () => void, 
  onClose: () => void 
}) => {
  if (!prompt) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed top-20 left-4 right-4 z-[100] pointer-events-none"
    >
      <div className="max-w-md mx-auto bg-emerald-600 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 pointer-events-auto border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="font-bold text-base">Instalar Dívidas</p>
            <p className="text-xs text-emerald-100">Acesso rápido direto da sua tela</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onInstall}
            className="bg-white text-emerald-600 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
          >
            Instalar
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-2xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  
  // Form states
  const [newDebt, setNewDebt] = useState({ description: '', totalAmount: '', category: '' });
  const [editingDebt, setEditingDebt] = useState<{ id: string, description: string, totalAmount: string, category: string } | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: '' });

  // Load settings
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);

    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedImage) setProfileImage(savedImage);

    // PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setDebts([]);
        return;
      }

      const debtsData = await db.debts.where('user_id').equals(user.id).toArray();
      const formattedDebts: Debt[] = [];
      for (const d of debtsData) {
        const payments = await db.payments.where('debt_id').equals(d.id).toArray();
        formattedDebts.push({
          id: d.id,
          description: d.description,
          category: d.category || undefined,
          totalAmount: d.total_amount,
          paidAmount: d.paid_amount,
          createdAt: d.created_at,
          payments: payments.map(p => ({
            id: p.id,
            amount: p.amount,
            date: p.date,
          })),
        });
      }
      setDebts(formattedDebts);
    };

    loadData();
  }, [user]);

  const handleLogin = (user: LocalUser) => {
    setUser(user);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
      localStorage.setItem(PROFILE_IMAGE_KEY, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.description || !newDebt.totalAmount) return;

    const debt: Debt = {
      id: crypto.randomUUID(),
      description: newDebt.description,
      category: newDebt.category.trim() || undefined,
      totalAmount: parseFloat(newDebt.totalAmount),
      paidAmount: 0,
      payments: [],
      createdAt: new Date().toISOString(),
    };

    // Save to IndexedDB
    if (user) {
      try {
        await db.debts.add({
          id: debt.id,
          user_id: user.id,
          description: debt.description,
          category: newDebt.category.trim() || undefined,
          total_amount: debt.totalAmount,
          paid_amount: 0,
          created_at: debt.createdAt,
        });
      } catch (err) {
        console.error('Erro ao salvar dívida:', err);
      }
    }

    setDebts([...debts, debt]);
    setNewDebt({ description: '', totalAmount: '', category: '' });
    setIsAddModalOpen(false);
  };

  const handleEditDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt || !editingDebt.description || !editingDebt.totalAmount) return;

    const updatedTotal = parseFloat(editingDebt.totalAmount);
    
    // Save to IndexedDB
    if (user) {
      try {
        await db.debts.update(editingDebt.id, {
          description: editingDebt.description,
          category: editingDebt.category.trim() || undefined,
          total_amount: updatedTotal,
        });
      } catch (err) {
        console.error('Erro ao atualizar dívida:', err);
      }
    }

    setDebts(prev => prev.map(d => 
      d.id === editingDebt.id 
        ? { ...d, description: editingDebt.description, totalAmount: updatedTotal, category: editingDebt.category.trim() || undefined } 
        : d
    ));
    setEditingDebt(null);
    setIsEditModalOpen(false);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !newPayment.amount) return;

    const amount = parseFloat(newPayment.amount);
    const paymentId = crypto.randomUUID();
    const date = new Date().toISOString();

    // Save to IndexedDB
    try {
      await db.payments.add({
        id: paymentId,
        debt_id: selectedDebtId,
        amount: amount,
        date: date,
      });
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
    }

    // Update paid_amount in debts table
    const debt = debts.find(d => d.id === selectedDebtId);
    if (debt) {
      try {
        await db.debts.update(selectedDebtId, {
          paid_amount: Math.min(debt.paidAmount + amount, debt.totalAmount),
        });
      } catch (err) {
        console.error('Erro ao atualizar valor pago:', err);
      }
    }
    
    setDebts(prev => prev.map(debt => {
      if (debt.id === selectedDebtId) {
        const updatedPaid = Math.min(debt.paidAmount + amount, debt.totalAmount);
        const payment: Payment = {
          id: paymentId,
          amount: amount,
          date: date,
        };
        return {
          ...debt,
          paidAmount: updatedPaid,
          payments: [payment, ...debt.payments]
        };
      }
      return debt;
    }));

    setNewPayment({ amount: '' });
    setIsPaymentModalOpen(false);
    setSelectedDebtId(null);
  };

  const deleteDebt = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta dívida?')) {
      // Delete from IndexedDB
      try {
        await db.payments.where('debt_id').equals(id).delete();
      } catch (err) {
        console.error('Erro ao deletar pagamentos:', err);
      }
      try {
        await db.debts.delete(id);
      } catch (err) {
        console.error('Erro ao deletar dívida:', err);
      }
      setDebts(debts.filter(d => d.id !== id));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const categories = useMemo(() => {
    const cats = debts
      .map(d => d.category?.trim())
      .filter((c): c is string => !!c);
    
    // Map to store lowercase version as key and original case as value
    const uniqueCatsMap = new Map<string, string>();
    cats.forEach(cat => {
      const lower = cat.toLowerCase();
      if (!uniqueCatsMap.has(lower)) {
        uniqueCatsMap.set(lower, cat);
      }
    });
    
    return ['all', ...Array.from(uniqueCatsMap.values())];
  }, [debts]);

  const stats = useMemo(() => {
    const filteredByCategory = selectedCategory === 'all' 
      ? debts 
      : debts.filter(d => d.category?.toLowerCase() === selectedCategory.toLowerCase());
      
    const total = filteredByCategory.reduce((acc, d) => acc + d.totalAmount, 0);
    const paid = filteredByCategory.reduce((acc, d) => acc + d.paidAmount, 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [debts, selectedCategory]);

  const filteredDebts = useMemo(() => {
    let result = debts;
    
    if (selectedCategory !== 'all') {
      result = result.filter(d => d.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    if (filter === 'paid') {
      result = result.filter(d => d.paidAmount >= d.totalAmount);
    } else if (filter === 'pending') {
      result = result.filter(d => d.paidAmount < d.totalAmount);
    }
    
    return result;
  }, [debts, filter, selectedCategory]);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const handleUpdateUser = async (data: { display_name: string }) => {
    await updateDisplayNameLocal(user.id, data.display_name);
    setUser((prev: any) => prev ? { ...prev, display_name: data.display_name } : prev);
  };

  const handlePasswordChange = async (password: string) => {
    await updatePasswordLocal(user.id, password);
  };

  const userDisplayName = user?.display_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 no-scrollbar">
      <AnimatePresence>
        {deferredPrompt && showInstallBanner && (
          <PWAInstallPrompt 
            prompt={deferredPrompt} 
            onInstall={handleInstallClick} 
            onClose={() => setShowInstallBanner(false)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <TrendingDown size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Dívidas</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Olá, </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{userDisplayName}</span>
            </div>
            {profileImage && (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable with hidden scrollbar */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-4xl mx-auto">
          {currentView === 'dashboard' && (
            <div className="px-4 py-8 flex flex-col">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 order-2 sm:order-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total em Dívidas</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.total)}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                  <p className="text-emerald-500 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Pago</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.paid)}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                  <p className="text-rose-500 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">Restante</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(stats.pending)}</p>
                </motion.div>
              </div>

              {/* Status Filters */}
              <div className="mb-4 order-1 sm:order-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                  >
                    Todas ({debts.length})
                  </button>
                  <button 
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === 'pending' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                  >
                    A Pagar ({debts.filter(d => d.paidAmount < d.totalAmount).length})
                  </button>
                  <button 
                    onClick={() => setFilter('paid')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === 'paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                  >
                    Pagas ({debts.filter(d => d.paidAmount >= d.totalAmount).length})
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              {categories.length > 1 && (
                <div className="mb-6 order-3 sm:order-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2">Categorias:</span>
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                      >
                        {cat === 'all' ? 'Todos' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Debt List */}
              <div className="space-y-4 order-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CreditCard size={20} className="text-slate-400 dark:text-slate-500" />
                  {filter === 'all' ? 'Minhas Dívidas' : filter === 'paid' ? 'Dívidas Pagas' : 'Dívidas a Pagar'}
                </h2>
                
                {filteredDebts.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                      <PieChart size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Nenhuma dívida encontrada.</p>
                    {filter !== 'all' && (
                      <button 
                        onClick={() => setFilter('all')}
                        className="mt-4 text-emerald-600 dark:text-emerald-500 font-medium hover:underline"
                      >
                        Ver todas as dívidas
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredDebts.map((debt, index) => {
                      const progress = (debt.paidAmount / debt.totalAmount) * 100;
                      const isPaid = debt.paidAmount >= debt.totalAmount;

                      return (
                        <motion.div
                          key={debt.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{debt.description}</h3>
                                {debt.category && (
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-tighter">
                                    {debt.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                {new Date(debt.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingDebt({
                                    id: debt.id,
                                    description: debt.description,
                                    totalAmount: debt.totalAmount.toString(),
                                    category: debt.category || ''
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedDebtId(debt.id);
                                  setIsPaymentModalOpen(true);
                                }}
                                disabled={isPaid}
                                className={`p-2 rounded-lg transition-colors ${isPaid ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}
                                title="Adicionar Pagamento"
                              >
                                <DollarSign size={18} />
                              </button>
                              <button 
                                onClick={() => deleteDebt(debt.id)}
                                className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">
                                Pago: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(debt.paidAmount)}</span>
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                Total: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(debt.totalAmount)}</span>
                              </span>
                            </div>

                            <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1 text-xs font-medium">
                                {isPaid ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Quitada
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    Faltam {formatCurrency(debt.totalAmount - debt.paidAmount)}
                                  </span>
                                )}
                              </div>
                              <span className={`text-sm font-bold ${isPaid ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {debt.payments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                              <details className="group/details">
                                <summary className="text-xs font-medium text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 list-none">
                                  <History size={12} />
                                  Ver histórico de pagamentos
                                  <ChevronRight size={12} className="group-open/details:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {debt.payments.map(p => (
                                    <div key={p.id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                                      <span>{new Date(p.date).toLocaleDateString('pt-BR')}</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <ProfileScreen 
              user={user} 
              onLogout={handleLogout} 
              isDarkMode={isDarkMode}
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              profileImage={profileImage}
              onImageUpload={handleImageUpload}
              onUpdateUser={handleUpdateUser}
              onChangePassword={handlePasswordChange}
            />
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 pb-safe z-40 transition-colors duration-300">
        <div className="max-w-md mx-auto flex justify-between items-center h-16">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Home size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Início</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none -mt-8 hover:bg-emerald-700 transition-colors active:scale-95"
          >
            <Plus size={28} />
          </button>

          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'profile' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <User size={24} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nova Dívida</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddDebt} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cartão de Crédito, Empréstimo..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={newDebt.description}
                    onChange={e => setNewDebt({...newDebt, description: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={newDebt.totalAmount}
                    onChange={e => setNewDebt({...newDebt, totalAmount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Opcional)</label>
                  <input 
                    type="text" 
                    list="existing-categories"
                    placeholder="Ex: Empréstimo, Cartão, MP Makeup..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={newDebt.category}
                    onChange={e => setNewDebt({...newDebt, category: e.target.value})}
                  />
                  <datalist id="existing-categories">
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
                >
                  Adicionar Dívida
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Debt Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Dívida</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEditDebt} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Cartão de Crédito, Empréstimo..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={editingDebt.description}
                    onChange={e => setEditingDebt({...editingDebt, description: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={editingDebt.totalAmount}
                    onChange={e => setEditingDebt({...editingDebt, totalAmount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Opcional)</label>
                  <input 
                    type="text" 
                    list="existing-categories-edit"
                    placeholder="Ex: Empréstimo, Cartão, MP Makeup..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={editingDebt.category}
                    onChange={e => setEditingDebt({...editingDebt, category: e.target.value})}
                  />
                  <datalist id="existing-categories-edit">
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registrar Pagamento</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Dívida: <span className="font-bold text-slate-700 dark:text-slate-200">
                    {debts.find(d => d.id === selectedDebtId)?.description}
                  </span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor do Pagamento (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({amount: e.target.value})}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
                >
                  Confirmar Pagamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
