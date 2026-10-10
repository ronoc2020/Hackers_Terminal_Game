import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const gameFile = readFileSync(new URL('../src/data/gameData.ts', import.meta.url), 'utf8');
const compiledGame = ts.transpileModule(gameFile, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exported = { exports: {}, atob: globalThis.atob };
runInNewContext(compiledGame, exported);

const componentFile = readFileSync(new URL('../src/components/GameTerminal.tsx', import.meta.url), 'utf8');
const start = componentFile.indexOf('const STORAGE_KEY =');
const end = componentFile.indexOf('export default function GameTerminal()');
assert.ok(start >= 0 && end > start);
const progressCode = ts.transpileModule(componentFile.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2020 },
}).outputText;

function restore(raw, storageError = false) {
  return runInNewContext(progressCode + '\ninitialProgress();', {
    localStorage: {
      getItem() {
        if (storageError) throw new Error('Storage disabled');
        return raw === null ? null : JSON.stringify(raw);
      },
    },
    missions: exported.exports.missions,
    getNode: exported.exports.getNode,
  });
}

test('defaults to first mission without prior storage', () => {
  const state = restore(null);
  assert.equal(state.missionNumber, 1);
  assert.equal(state.cwd, '/home/user');
  assert.equal(state.score, 0);
});

test('restores only valid objectives for the current mission', () => {
  const state = restore({
    cwd: '/etc',
    missionNumber: 3,
    score: 250,
    finished: ['root', 'root', 'invalid'],
  });
  assert.equal(state.cwd, '/etc');
  assert.equal(state.missionNumber, 3);
  assert.equal(state.score, 250);
  assert.deepEqual(Array.from(state.finished), ['root']);
});

test('discards corrupted and out-of-range progress', () => {
  const state = restore({ missionNumber: 99, cwd: '/missing', score: 9999 });
  assert.equal(state.missionNumber, 1);
});

test('keeps functioning if localStorage is blocked', () => {
  assert.equal(restore(null, true).missionNumber, 1);
});

test('allows a finished game state with the final score', () => {
  const state = restore({ missionNumber: 5, cwd: '/home/user', score: 700, finished: [] });
  assert.equal(state.missionNumber, 5);
  assert.equal(state.score, 700);
});
