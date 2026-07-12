/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeValida } from './components/screens/Home';
import { CheckCircle2, ShieldAlert, Info, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

// Route-level code splitting: only the Home screen ships in the initial bundle.
// Every other screen (especially the admin area a regular consumer never opens)
// is loaded on demand, keeping the first paint light and fast.
const ProdutosValida = lazy(() => import('./components/screens/Produtos').then(m => ({ default: m.ProdutosValida })));
const ProdutoDetalheValida = lazy(() => import('./components/screens/ProdutoDetalhe').then(m => ({ default: m.ProdutoDetalheValida })));
const LoginValida = lazy(() => import('./components/screens/Login').then(m => ({ default: m.LoginValida })));
const CadastroValida = lazy(() => import('./components/screens/Cadastro').then(m => ({ default: m.CadastroValida })));
const MinhasReservasValida = lazy(() => import('./components/screens/MinhasReservas').then(m => ({ default: m.MinhasReservasValida })));
const AdminDashboardValida = lazy(() => import('./components/screens/AdminDashboard').then(m => ({ default: m.AdminDashboardValida })));
const AdminProdutosValida = lazy(() => import('./components/screens/AdminProdutos').then(m => ({ default: m.AdminProdutosValida })));
const AdminReservasValida = lazy(() => import('./components/screens/AdminReservas').then(m => ({ default: m.AdminReservasValida })));
const AdminCategoriasValida = lazy(() => import('./components/screens/AdminCategorias').then(m => ({ default: m.AdminCategoriasValida })));

// Lightweight fallback shown while a lazily-loaded screen chunk is fetched.
function ScreenFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
    </div>
  );
}

function AppContent() {
  const { currentScreen, loading, alert, setAlert } = useApp();

  // Screen Switcher
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeValida />;
      case 'produtos':
        return <ProdutosValida />;
      case 'produto-detalhe':
        return <ProdutoDetalheValida />;
      case 'login':
        return <LoginValida />;
      case 'cadastro':
        return <CadastroValida />;
      case 'minhas-reservas':
        return <MinhasReservasValida />;
      case 'admin-dashboard':
        return <AdminDashboardValida />;
      case 'admin-produtos':
      case 'admin-produtos-novo':
      case 'admin-produtos-editar':
        return <AdminProdutosValida />;
      case 'admin-reservas':
        return <AdminReservasValida />;
      case 'admin-categorias':
        return <AdminCategoriasValida />;
      default:
        return <HomeValida />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg animate-bounce">
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          Inicializando ValidaMais...
        </div>
      </div>
    );
  }

  // Floating Notification Colors
  const getAlertStyles = (type: any) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-300 text-emerald-900 border';
      case 'error':
        return 'bg-rose-50 border-rose-300 text-rose-900 border';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-900 border';
      case 'info':
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-900 border';
    }
  };

  const getAlertIcon = (type: any) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <div id="applet_main_wrapper" className="min-h-screen mesh-bg flex flex-col justify-between relative bg-neutral-50/20">
      <div>
        {/* Navigation Bar */}
        <Navbar />

        {/* Floating notifications */}
        {alert && (
          <div
            id="floating_alert_toast"
            className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-slide-in transition-all ${getAlertStyles(
              alert.type
            )}`}
          >
            {getAlertIcon(alert.type)}
            <div className="flex-1 text-xs font-semibold leading-relaxed font-sans">{alert.message}</div>
            <button
              onClick={() => setAlert(null)}
              className="text-gray-400 hover:text-gray-900 font-bold font-mono text-xs cursor-pointer px-1 shrink-0"
            >
              x
            </button>
          </div>
        )}

        {/* Secondary Page Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <Suspense fallback={<ScreenFallback />}>
              {renderActiveScreen()}
            </Suspense>
          </motion.div>
        </main>
      </div>

      {/* Footer block - styled as glass container */}
      <footer id="main_footer" className="glass border border-white/50 py-6 hidden md:block mb-6 mx-4 sm:mx-6 lg:mx-8 rounded-2xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500 font-sans">
          <div className="flex flex-col items-center md:items-start leading-none">
            <span className="font-extrabold text-sm tracking-tight text-gray-800">
              Valida<span className="text-emerald-600">Mais</span>
            </span>
            <span className="text-[9px] font-medium tracking-wide text-gray-400 mt-1 font-mono uppercase">
              Evite o Desperdício Alimentar, Economize Dinheiro
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-400">
            © {new Date().getFullYear()} ValidaMais. Feito por Lojistas e Consumidores Conscientes.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
