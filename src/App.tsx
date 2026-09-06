import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingView } from './components/LandingView';
import { Dashboard } from './components/Dashboard';
import { BookOpen, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6 text-[#E0E0E0]">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white text-black shadow-2xl">
          <div className="w-6 h-6 border-2 border-black rotate-45" />
        </div>
        <div className="space-y-2 text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/30">Secure Session Initialization</div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-indigo-400/80">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Connecting to isolated Cloud Firestore...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingView />;
  }

  return <Dashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
