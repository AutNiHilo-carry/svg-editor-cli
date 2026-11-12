import * as vscode from 'vscode';
import { isSvgPath } from './decoration';
import { buildOutlineModel, type OutlineNode } from './xmlOutline';

export class SvgOutlineProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    try {
      return buildOutlineModel(document.getText()).map((node) => toSymbol(node, document));
    } catch {
      // Incomplete XML is a normal editing state. An empty outline is allowed.
      return [];
    }
  }
}

function toSymbol(node: OutlineNode, document: vscode.TextDocument): vscode.DocumentSymbol {
  const name = node.id ? `${node.tag}#${node.id}` : node.tag;
  const container = node.tag === 'svg' || node.tag === 'g' || node.children.length > 0;
  const symbol = new vscode.DocumentSymbol(
    name,
    '',
    container ? vscode.SymbolKind.Object : vscode.SymbolKind.Field,
    new vscode.Range(document.positionAt(node.start), document.positionAt(node.end)),
    new vscode.Range(document.positionAt(node.selectionStart), document.positionAt(node.selectionEnd)),
  );
  symbol.children = node.children.map((child) => toSymbol(child, document));
  return symbol;
}

export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (uri.scheme !== 'file' || !isSvgPath(uri.path)) return undefined;
    return {
      badge: '[]',
      tooltip: 'SVG file',
      propagate: false,
    };
  }
}
