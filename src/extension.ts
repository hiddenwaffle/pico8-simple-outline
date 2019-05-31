import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.languages.registerDocumentSymbolProvider(
		{ scheme: 'file', pattern: '**/*.p8' },
		new Pico8DocumentSymbolProvider())
	context.subscriptions.push(disposable)
}

export function deactivate() { }

class Pico8DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentSymbol[]> {
		const symbols = new Array<vscode.DocumentSymbol>()
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i)
			if (line.text.match(/^ *function /i)) {
				const functionName = line.text.replace(/^ *function /i, '').replace(/\(.*/, '').trim()
				// Must validate that it is not blank, otherwise it will report others incorrectly.
				if (functionName.length > 0) {
					symbols.push(new vscode.DocumentSymbol(
						functionName,
						'',
						vscode.SymbolKind.Function,
						line.range,
						line.range))
				}
			}
		}
		return symbols
	}
}
