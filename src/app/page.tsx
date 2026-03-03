import { Metadata } from 'next';
import { DashboardForm } from './components/dashboard-form';

export const metadata: Metadata = {
  title: 'Amazon Affiliate 🚀',
  description: 'Gerenciador da Automação de Produtos Amazon',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4 sm:p-8">

      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 w-full max-w-3xl">

        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Amazon Affiliate Automation
          </h1>
          <p className="text-slate-400 text-lg">
            Configure e dispare novos garimpos de ofertas para o WhatsApp.
          </p>
        </header>

        <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <DashboardForm />
        </section>

      </div>

    </main>
  );
}
