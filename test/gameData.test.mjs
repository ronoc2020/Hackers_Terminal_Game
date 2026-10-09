import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/data/gameData.ts', import.meta.url), 'utf8');
const { outputText, diagnostics = [] } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
  fileName: 'gameData.ts',
});
const compileErrors = diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error);
assert.equal(compileErrors.length, 0, ts.formatDiagnosticsWithColorAndContext(compileErrors, {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: name => name,
  getNewLine: () => '\n',
}));
const sandbox = { exports: {}, atob: globalThis.atob };
runInNewContext(outputText, sandbox);
const { fileSystem, getNode, normalizePath, missions, decodeBase64 } = sandbox.exports;

test('filesystem navigation normalizes relative and absolute paths', () => {
  assert.equal(normalizePath('/home/user', 'documents'), '/home/user/documents');
  assert.equal(normalizePath('/home/user/documents', '..'), '/home/user');
  assert.equal(normalizePath('/etc', '/var/log'), '/var/log');
  assert.equal(normalizePath('/etc', '../../..'), '/');
  assert.equal(normalizePath('/home/user', '~'), '/home/user');
});

test('filesystem rejects traversal beyond root and missing paths', () => {
  assert.equal(getNode('/missing'), null);
  assert.equal(getNode('/etc/passwd/not_a_directory'), null);
  assert.equal(typeof getNode('/etc/passwd'), 'string');
  assert.equal(typeof fileSystem.home, 'object');
});

test('Base64 decoding handles real clue and invalid input', () => {
  const clue = getNode('/home/user/documents/secret.txt');
  assert.equal(typeof clue, 'string');
  assert.match(decodeBase64(clue), /Cicada3301/);
  assert.equal(decodeBase64('not-base64!'), null);
  assert.equal(decodeBase64(''), null);
});

test('mission numbers and objective keys are unique', () => {
  assert.deepEqual(Array.from(missions, item => item.id), [1, 2, 3, 4]);
  for (const mission of missions) {
    assert.ok(mission.reward > 0);
    assert.ok(mission.objectives.length >= 3);
    const keys = mission.objectives.map(item => item.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(mission.objectives.every(item => typeof item.matches === 'function'));
  }
});

test('mission objectives match real simulated commands', () => {
  const pairs = [
    [1, [['ls', ''], ['cd', '/home/user/documents'], ['cat', '/home/user/documents/secret.txt'],
      ['decode', getNode('/home/user/documents/secret.txt')]]],
    [2, [['cd', '/var/log'], ['cat', '/var/log/auth.log'], ['grep', 'Failed /var/log/auth.log'],
      ['nmap', '192.168.1.100']]],
    [3, [['cd', '/'], ['cd', '/etc'], ['cat', '/etc/passwd'], ['grep', 'user /etc/passwd']]],
    [4, [['cd', '/home/user/documents'], ['cat', '/home/user/documents/todo.txt'],
      ['cat', '/var/log/auth.log'], ['nmap', '192.168.1.100']]],
  ];
  for (const [id, commands] of pairs) {
    const objectives = missions.find(item => item.id === id).objectives;
    assert.equal(commands.length, objectives.length);
    commands.forEach(([command, arg], i) => assert.ok(objectives[i].matches(command, arg),
      'Mission ' + id + ' objective ' + i + ' cannot be completed'));
  }
});

test('no lab command spawns a process or network request', () => {
  const app = readFileSync(new URL('../src/components/GameTerminal.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /\b(fetch|WebSocket|XMLHttpRequest|execSync|spawn|eval)\s*\(/);
  assert.match(app, /SIMULATION — no packets sent/);
});
