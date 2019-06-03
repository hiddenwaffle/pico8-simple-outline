import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.languages.registerDocumentSymbolProvider(
		{ scheme: 'file', pattern: '**/*.p8' },
		new Pico8DocumentSymbolProvider())
	context.subscriptions.push(disposable)
}

export function deactivate() { }

class TabMeta {
	constructor(
		readonly range: vscode.Range) { }
}

class SymbolStore {
	currentTab: number
	readonly tabFns: Map<number, Array<vscode.DocumentSymbol>>
	readonly tabMetas: Map<number, TabMeta>

	constructor() {
		this.currentTab = 0
		this.tabFns = new Map()
		this.tabMetas = new Map()
		// Special case: There is always a tab 0. Range is the start of the Lua section.
		this.tabMetas.set(0, new TabMeta(new vscode.Range(new vscode.Position(2, 0), new vscode.Position(2, 0))))
	}

	add(fn: vscode.DocumentSymbol) {
		let fns = this.tabFns.get(this.currentTab)
		if (!fns) {
			fns = new Array()
			this.tabFns.set(this.currentTab, fns)
		}
		fns.push(fn)
	}

	advanceTab(range: vscode.Range) {
		this.currentTab += 1
		const tabMeta = new TabMeta(range)
		this.tabMetas.set(this.currentTab, tabMeta)
	}

	/**
	 * Runs either a flat listing of functions if not tabs,
	 * or tabs with functions below each.
	 */
	asSymbolArray(): vscode.DocumentSymbol[] {
		if (this.currentTab == 0) {
			return this.tabFns.get(0) || new Array()
	 	} else {
			const tabSymbols = new Array<vscode.DocumentSymbol>()
			for (let i = 0; i <= this.currentTab; i++) {
				const fns = this.tabFns.get(i)
				const tabMeta = this.tabMetas.get(i)
				if (tabMeta) {
					const tabSymbol = new vscode.DocumentSymbol(
						'' + i,
						'',
						vscode.SymbolKind.Field,
						tabMeta.range,
						tabMeta.range)
					if (fns) {
						tabSymbol.children = fns
					}
					tabSymbols.push(tabSymbol)
				}
			}
			return tabSymbols
		}
	}
}

class Pico8DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentSymbol[]> {
		const store = new SymbolStore()
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i)
			if (line.text.match(/^-->8/)) {
				store.advanceTab(line.range)
			} else if (line.text.match(/^ *function /i)) {
				const functionName = line.text.replace(/^ *function /i, '').replace(/\(.*/, '').trim()
				// Must validate that it is not blank, otherwise it will report others incorrectly.
				if (functionName.length > 0) {
					store.add(new vscode.DocumentSymbol(
						functionName,
						'',
						vscode.SymbolKind.Function,
						line.range,
						line.range))
				}
			}
		}
		return store.asSymbolArray()
	}
}
