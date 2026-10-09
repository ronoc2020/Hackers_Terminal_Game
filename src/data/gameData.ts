export type FileNode = string | { [name: string]: FileNode };

export const fileSystem: { [name: string]: FileNode } = {
  home: {
    user: {
      documents: {
        'secret.txt': 'VGhlIGtleSB0byB0aGUgbmV4dCBsZXZlbCBpczogQ2ljYWRhMzMwMQ==',
        'todo.txt': '1. Review server logs\n2. Verify firewall policy\n3. Investigate suspicious IP: 192.168.1.100',
      },
      downloads: { 'mysterious_image.jpg': '[Simulated binary data]' },
    },
  },
  etc: {
    passwd: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/sh',
  },
  var: {
    log: { 'auth.log': 'Oct 09 09:15:00 host sshd: Failed login from 192.168.1.100\nOct 09 09:16:00 host sshd: Accepted login for user' },
  },
};

export const commandHelp: Record<string, string> = {
  help: 'Display command reference',
  mission: 'Show current mission and objective progress',
  status: 'Show score and completed objectives',
  pwd: 'Show current directory',
  ls: 'List files in the simulated filesystem',
  cd: 'Change simulated directory (supports .. and absolute paths)',
  cat: 'Read a simulated file',
  grep: 'Search a simulated text file, e.g. grep Failed auth.log',
  decode: 'Decode Base64 locally',
  nmap: 'Simulated scan of a fictional lab host, e.g. nmap 192.168.1.100',
  clear: 'Clear terminal output',
};

export interface MissionObjective {
  key: string;
  label: string;
  matches: (command: string, arg: string) => boolean;
}

export interface Mission {
  id: number;
  description: string;
  reward: number;
  objectives: MissionObjective[];
}

export const missions: Mission[] = [
  {
    id: 1,
    description: 'Find the encoded note and decode it using the local lab filesystem.',
    reward: 100,
    objectives: [
      { key: 'list', label: 'Run ls', matches: (command) => command === 'ls' },
      { key: 'enter', label: 'Navigate to /home/user/documents', matches: (command, arg) => command === 'cd' && arg.endsWith('/documents') },
      { key: 'read', label: 'Read secret.txt', matches: (command, arg) => command === 'cat' && arg.endsWith('/secret.txt') },
      { key: 'decode', label: 'Decode the Base64 note', matches: (command, arg) => command === 'decode' && arg === 'VGhlIGtleSB0byB0aGUgbmV4dCBsZXZlbCBpczogQ2ljYWRhMzMwMQ==' },
    ],
  },
  {
    id: 2,
    description: 'Investigate suspicious simulated login attempts. No real network traffic is sent.',
    reward: 150,
    objectives: [
      { key: 'logs', label: 'Enter /var/log', matches: (command, arg) => command === 'cd' && arg === '/var/log' },
      { key: 'inspect', label: 'Read auth.log', matches: (command, arg) => command === 'cat' && arg.endsWith('/auth.log') },
      { key: 'search', label: 'Search for Failed in auth.log', matches: (command, arg) => command === 'grep' && arg.toLowerCase().includes('failed') && arg.endsWith('auth.log') },
      { key: 'scan', label: 'Simulate nmap 192.168.1.100', matches: (command, arg) => command === 'nmap' && arg === '192.168.1.100' },
    ],
  },
  {
    id: 3,
    description: 'Audit the local training system. Trace how a simulated user is configured.',
    reward: 200,
    objectives: [
      { key: 'root', label: 'Return to filesystem root: cd /', matches: (command, arg) => command === 'cd' && arg === '/' },
      { key: 'etc', label: 'Enter /etc', matches: (command, arg) => command === 'cd' && arg === '/etc' },
      { key: 'passwd', label: 'Read passwd', matches: (command, arg) => command === 'cat' && arg === '/etc/passwd' },
      { key: 'finduser', label: 'Search for user in passwd', matches: (command, arg) => command === 'grep' && arg.toLowerCase().includes('user') && arg.endsWith('/etc/passwd') },
    ],
  },
  {
    id: 4,
    description: 'Complete the investigation by reviewing the notes left in the lab.',
    reward: 250,
    objectives: [
      { key: 'documents', label: 'Return to /home/user/documents', matches: (command, arg) => command === 'cd' && arg === '/home/user/documents' },
      { key: 'todo', label: 'Read todo.txt', matches: (command, arg) => command === 'cat' && arg === '/home/user/documents/todo.txt' },
      { key: 'logreview', label: 'Review auth.log using an absolute path', matches: (command, arg) => command === 'cat' && arg === '/var/log/auth.log' },
      { key: 'finalscan', label: 'Verify the lab host with simulated nmap', matches: (command, arg) => command === 'nmap' && arg === '192.168.1.100' },
    ],
  },
];

export function normalizePath(base: string, target: string): string {
  const input = target === '~' ? '/home/user' : target;
  const segments = (input.startsWith('/') ? input : base + '/' + input).split('/');
  const stack: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') stack.pop();
    else stack.push(segment);
  }
  return '/' + stack.join('/');
}

export function getNode(absolutePath: string): FileNode | null {
  let current: FileNode = fileSystem;
  for (const segment of absolutePath.split('/').filter(Boolean)) {
    if (typeof current === 'string' || !Object.prototype.hasOwnProperty.call(current, segment)) return null;
    current = current[segment];
  }
  return current;
}

export function decodeBase64(encoded: string): string | null {
  try {
    if (!encoded || !/^[a-zA-Z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) return null;
    return atob(encoded);
  } catch {
    return null;
  }
}
