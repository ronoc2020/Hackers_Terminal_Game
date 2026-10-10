import { useEffect, useRef, useState, type FormEvent } from 'react';
import { commandHelp, decodeBase64, getNode, missions, normalizePath } from '../data/gameData';

const INITIAL_OUTPUT = [
  "Welcome to Hacker's Terminal — safe, entirely simulated lab.",
  'Type help for available commands, or mission for objectives.',
];

const STORAGE_KEY = 'hackers-terminal-game-progress-v1';

interface SavedProgress {
  cwd: string;
  missionNumber: number;
  finished: string[];
  score: number;
}

function initialProgress(): SavedProgress {
  const fallback: SavedProgress = { cwd: '/home/user', missionNumber: 1, finished: [], score: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<SavedProgress> | null;
    if (!saved || typeof saved !== 'object') return fallback;
    const missionNumber = saved.missionNumber;
    if (!Number.isInteger(missionNumber) || missionNumber! < 1 || missionNumber! > missions.length + 1) return fallback;
    const mission = missions.find((item) => item.id === missionNumber);
    const allowedKeys = new Set(mission?.objectives.map((item) => item.key) || []);
    const cwd = typeof saved.cwd === 'string' && getNode(saved.cwd) !== null &&
      typeof getNode(saved.cwd) !== 'string' ? saved.cwd : fallback.cwd;
    const score = typeof saved.score === 'number' && Number.isSafeInteger(saved.score) &&
      saved.score >= 0 && saved.score <= missions.reduce((sum, item) => sum + item.reward, 0)
      ? saved.score : 0;
    return {
      cwd,
      missionNumber: missionNumber!,
      score,
      finished: Array.isArray(saved.finished)
        ? [...new Set(saved.finished.filter((item): item is string =>
          typeof item === 'string' && allowedKeys.has(item)))]
        : [],
    };
  } catch {
    // Private-browsing contexts can deny storage.
    return fallback;
  }
}

export default function GameTerminal() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>(INITIAL_OUTPUT);
  const [savedProgress] = useState(initialProgress);
  const [cwd, setCwd] = useState(savedProgress.cwd);
  const [missionNumber, setMissionNumber] = useState(savedProgress.missionNumber);
  const [finished, setFinished] = useState<string[]>(savedProgress.finished);
  const [score, setScore] = useState(savedProgress.score);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const mission = missions.find((item) => item.id === missionNumber);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cwd, missionNumber, finished, score }));
    } catch {
      // Progress works in memory if storage is restricted or full.
    }
  }, [cwd, missionNumber, finished, score]);

  function resetProgress() {
    if (!window.confirm('Reset all four training missions and your local score?')) return;
    setCwd('/home/user');
    setMissionNumber(1);
    setFinished([]);
    setScore(0);
    setInput('');
    setOutput(INITIAL_OUTPUT);
    historyRef.current = [];
    historyIndexRef.current = 0;
    inputRef.current?.focus();
  }

  function recallHistory(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (!historyRef.current.length) return;
    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? -1 : 1;
    historyIndexRef.current = Math.min(historyRef.current.length,
      Math.max(0, historyIndexRef.current + delta));
    setInput(historyRef.current[historyIndexRef.current] || '');
  }

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = input.trim();
    setInput('');
    if (!raw) return;
    if (historyRef.current[historyRef.current.length - 1] !== raw) {
      historyRef.current = [...historyRef.current, raw].slice(-50);
    }
    historyIndexRef.current = historyRef.current.length;

    const space = raw.search(/\s/);
    const command = (space < 0 ? raw : raw.slice(0, space)).toLowerCase();
    const arg = space < 0 ? '' : raw.slice(space).trim();
    const lines: string[] = [];
    let succeeded = false;
    let objectiveArg = arg;

    if (command === 'clear') {
      setOutput([]);
      return;
    }

    switch (command) {
      case 'help':
        lines.push('COMMANDS:', ...Object.entries(commandHelp).map(([name, detail]) => '  ' + name + ' — ' + detail));
        succeeded = true;
        break;
      case 'pwd':
        lines.push(cwd);
        succeeded = true;
        break;
      case 'ls': {
        const path = normalizePath(cwd, arg || '.');
        const node = getNode(path);
        if (node === null) lines.push('ls: path not found');
        else if (typeof node === 'string') lines.push(path.split('/').pop() || '');
        else { lines.push(Object.keys(node).join('    ') || '(empty)'); succeeded = true; }
        break;
      }
      case 'cd': {
        const path = normalizePath(cwd, arg || '~');
        const node = getNode(path);
        if (node === null || typeof node === 'string') lines.push('cd: directory not found');
        else { setCwd(path); objectiveArg = path; succeeded = true; lines.push('Now in ' + path); }
        break;
      }
      case 'cat': {
        if (!arg) { lines.push('Usage: cat <file>'); break; }
        const path = normalizePath(cwd, arg);
        const node = getNode(path);
        if (typeof node === 'string') { lines.push(node); objectiveArg = path; succeeded = true; }
        else lines.push('cat: file not found');
        break;
      }
      case 'grep': {
        const match = arg.match(/^(?:"([^"]+)"|'([^']+)'|(\S+))\s+(.+)$/);
        if (!match) { lines.push('Usage: grep <text> <file>'); break; }
        const needle = match[1] || match[2] || match[3];
        const path = normalizePath(cwd, match[4]);
        const node = getNode(path);
        if (typeof node !== 'string') lines.push('grep: file not found');
        else {
          const hits = node.split('\n').filter((line) => line.toLowerCase().includes(needle.toLowerCase()));
          lines.push(...(hits.length ? hits : ['(no matches)']));
          objectiveArg = needle + ' ' + path;
          succeeded = hits.length > 0;
        }
        break;
      }
      case 'decode': {
        const decoded = decodeBase64(arg);
        if (decoded === null) lines.push('decode: invalid Base64 payload');
        else { lines.push('Decoded: ' + decoded); succeeded = true; }
        break;
      }
      case 'nmap':
        if (arg !== '192.168.1.100') lines.push('SIMULATED LAB ONLY. Try: nmap 192.168.1.100');
        else {
          lines.push('[SIMULATION — no packets sent]', 'Host 192.168.1.100 is up.', '22/tcp open ssh', '80/tcp open http');
          succeeded = true;
        }
        break;
      case 'mission':
        if (!mission) lines.push('All missions complete. Congratulations!');
        else lines.push('MISSION ' + mission.id + ': ' + mission.description,
          ...mission.objectives.map((obj) => (finished.includes(obj.key) ? '[x] ' : '[ ] ') + obj.label),
          'Reward: ' + mission.reward + ' XP');
        succeeded = true;
        break;
      case 'status':
        lines.push('Score: ' + score + ' | Mission: ' + (mission?.id || 'completed'),
          'Objectives completed: ' + finished.length + '/' + (mission?.objectives.length || 0));
        succeeded = true;
        break;
      default:
        lines.push('Unknown command: ' + command + '. Type help.');
    }

    if (succeeded && mission) {
      const objective = mission.objectives.find((item) => !finished.includes(item.key) && item.matches(command, objectiveArg));
      if (objective) {
        const next = [...finished, objective.key];
        lines.push('[+] Objective complete: ' + objective.label);
        if (next.length === mission.objectives.length) {
          setScore((prev) => prev + mission.reward);
          setMissionNumber(mission.id + 1);
          setFinished([]);
          lines.push('[+] Mission complete! +' + mission.reward + ' XP',
            'Type mission to inspect your next assignment.');
        } else setFinished(next);
      }
    }

    setOutput((previous) => [...previous, '$ ' + raw, ...lines].slice(-250));
  }

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-black p-4 gap-3" aria-label="Interactive training terminal">
      <div className="flex flex-wrap gap-4 text-sm items-center">
        <span className="text-sky-400">Mission: {mission?.id || 'Complete'}</span>
        <span className="text-yellow-400">Score: {score}</span>
        <span className="text-green-300">{finished.length}/{mission?.objectives.length || 0} objectives</span>
        <button type="button" onClick={resetProgress}
          className="ml-auto rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-green-400">
          Reset progress
        </button>
      </div>
      <div ref={outputRef} role="log" aria-label="Terminal output" aria-live="polite"
        className="flex-1 min-h-48 overflow-y-auto rounded border border-green-900 bg-zinc-950 p-3">
        {output.map((line, index) => <div key={index} className="whitespace-pre-wrap break-words leading-6">{line || '\u00a0'}</div>)}
      </div>
      <form onSubmit={runCommand} className="flex items-center gap-2 border-t border-green-900 pt-3">
        <label htmlFor="terminal-input" className="text-green-400 whitespace-nowrap text-xs sm:text-sm">{cwd} $</label>
        <input id="terminal-input" ref={inputRef} value={input}
          onChange={(event) => setInput(event.target.value)} onKeyDown={recallHistory} spellCheck={false}
          autoCapitalize="none" autoComplete="off"
          aria-label="Terminal command" placeholder="help, mission, ls..."
          className="min-w-0 flex-1 bg-transparent rounded outline-none focus-visible:ring-2 focus-visible:ring-green-400 px-2 py-2 text-green-300" />
        <button type="submit" className="rounded bg-green-800 px-3 py-2 text-white hover:bg-green-700 focus-visible:ring-2">Run</button>
      </form>
      <p className="text-xs text-green-500">Progress saves locally when your browser allows it. ↑/↓ recall commands. All commands are simulated; no external hosts are contacted.</p>
    </section>
  );
}
