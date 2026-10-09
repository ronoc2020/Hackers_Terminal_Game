import { useEffect, useRef, useState, type FormEvent } from 'react';
import { commandHelp, decodeBase64, fileSystem, getNode, missions, normalizePath } from '../data/gameData';

const INITIAL_OUTPUT = [
  "Welcome to Hacker's Terminal — safe, entirely simulated lab.",
  'Type help for available commands, or mission for objectives.',
];

export default function GameTerminal() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>(INITIAL_OUTPUT);
  const [cwd, setCwd] = useState('/home/user');
  const [missionNumber, setMissionNumber] = useState(1);
  const [finished, setFinished] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const mission = missions.find((item) => item.id === missionNumber);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = input.trim();
    setInput('');
    if (!raw) return;

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
      <div className="flex flex-wrap gap-5 text-sm">
        <span className="text-sky-400">Mission: {mission?.id || 'Complete'}</span>
        <span className="text-yellow-400">Score: {score}</span>
        <span className="text-green-300">{finished.length}/{mission?.objectives.length || 0} objectives</span>
      </div>
      <div ref={outputRef} role="log" aria-label="Terminal output" aria-live="polite"
        className="flex-1 min-h-48 overflow-y-auto rounded border border-green-900 bg-zinc-950 p-3">
        {output.map((line, index) => <div key={index} className="whitespace-pre-wrap break-words leading-6">{line || '\u00a0'}</div>)}
      </div>
      <form onSubmit={runCommand} className="flex items-center gap-2 border-t border-green-900 pt-3">
        <label htmlFor="terminal-input" className="text-green-400 whitespace-nowrap text-xs sm:text-sm">{cwd} $</label>
        <input id="terminal-input" ref={inputRef} value={input}
          onChange={(event) => setInput(event.target.value)} spellCheck={false}
          autoCapitalize="none" autoComplete="off"
          aria-label="Terminal command" placeholder="help, mission, ls..."
          className="min-w-0 flex-1 bg-transparent rounded outline-none focus-visible:ring-2 focus-visible:ring-green-400 px-2 py-2 text-green-300" />
        <button type="submit" className="rounded bg-green-800 px-3 py-2 text-white hover:bg-green-700 focus-visible:ring-2">Run</button>
      </form>
      <p className="text-xs text-green-600">All commands are simulated locally. No external hosts are contacted.</p>
    </section>
  );
}
