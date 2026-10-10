import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const components = [
  'src/App.tsx',
  'src/components/GameTerminal.tsx',
  'src/components/Instructions.tsx',
  'src/main.tsx',
];

test('all React TypeScript components parse as TSX', () => {
  for (const path of components) {
    const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    const result = ts.transpileModule(source, {
      fileName: path,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
      },
    });
    const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, path + ': ' + errors.map(item =>
      ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; '));
  }
});

test('terminal progress persistence is optional and guarded against disabled storage', () => {
  const source = readFileSync(new URL('../src/components/GameTerminal.tsx', import.meta.url), 'utf8');
  assert.match(source, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /function initialProgress\(\)/);
  assert.match(source, /function resetProgress\(\)/);
  assert.match(source, /onKeyDown=\{recallHistory\}/);
  assert.match(source, /catch\s*\{/);
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|execSync|spawn)\s*\(/);
});

test('game shell includes explicit practice-only labeling and a start button', () => {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /Start now \/ Skip intro/);
  assert.match(source, /No real network commands/);
});
