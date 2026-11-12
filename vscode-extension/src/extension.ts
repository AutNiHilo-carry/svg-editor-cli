import * as vscode from 'vscode';
import { SvgFileDecorationProvider, SvgOutlineProvider } from './providers';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider({ pattern: '**/*.svg' }, new SvgOutlineProvider()),
    vscode.window.registerFileDecorationProvider(new SvgFileDecorationProvider()),
  );
}

export function deactivate(): void {
  // Providers are disposed through context.subscriptions.
}
