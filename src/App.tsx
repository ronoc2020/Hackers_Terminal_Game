import { useEffect, useState } from 'react';
import { Terminal, Shield, Cpu } from 'lucide-react';
import GameTerminal from './components/GameTerminal';
import Instructions from './components/Instructions';

export default function App() {
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (!showInstructions) return;
    const timer = window.setTimeout(() => setShowInstructions(false), 10000);
    return () => window.clearTimeout(timer);
  }, [showInstructions]);

  return (
    <div className="min-h-screen min-h-dvh bg-black text-green-400 font-mono flex flex-col">
      <header className="p-4 bg-zinc-900 border-b border-green-900 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal aria-hidden="true" size={24} />
          <h1 className="text-lg sm:text-xl font-bold">Hacker's Terminal</h1>
        </div>
        <div className="flex gap-3 items-center">
          <Shield aria-hidden="true" size={22} />
          <Cpu aria-hidden="true" size={22} />
        </div>
      </header>
      <main className="flex-1 min-h-0 flex flex-col" id="main-content">
        {showInstructions ? (
          <>
            <Instructions />
            <div className="bg-zinc-900 px-4 pb-4 text-center">
              <button type="button" onClick={() => setShowInstructions(false)}
                className="rounded border border-green-500 px-5 py-3 text-green-300 hover:bg-green-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400">
                Start now / Skip intro
              </button>
            </div>
          </>
        ) : <GameTerminal />}
      </main>
      <footer className="p-3 bg-zinc-900 border-t border-green-900 text-center text-xs text-green-600">
        Educational sandbox · No real network commands · © {new Date().getFullYear()} Hacker's Terminal
      </footer>
    </div>
  );
}
