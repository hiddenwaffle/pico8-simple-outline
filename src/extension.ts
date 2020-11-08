import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.languages.registerDocumentSymbolProvider(
		{ scheme: 'file', pattern: '**/*.p8' },
		new Pico8DocumentSymbolProvider())
	context.subscriptions.push(disposable)
}

export function deactivate() { }

/**
 * Keep track of where each tab starts.
 */
class TabMeta {
	constructor(
		readonly range: vscode.Range,
		readonly name: string) { }
}

/**
 * Links tabs to their functions and their starting lines.
 */
class SymbolStore {
	currentTab: number
	readonly tabFns: Map<number, Array<vscode.DocumentSymbol>>
	readonly tabMetas: Map<number, TabMeta>

	constructor() {
		this.currentTab = 0
		this.tabFns = new Map()
		this.tabMetas = new Map()
	}

	/**
	 * Call this to add a function when one is found.
	 */
	add(fn: vscode.DocumentSymbol) {
		let fns = this.tabFns.get(this.currentTab)
		if (!fns) {
			fns = new Array()
			this.tabFns.set(this.currentTab, fns)
		}
		fns.push(fn)
	}

	/**
	 * Call this when a tab break is found.
	 */
	advanceTab(range: vscode.Range, name: string) {
		this.currentTab += 1
		const tabMeta = new TabMeta(range, name)
		this.tabMetas.set(this.currentTab, tabMeta)
	}

	/**
	 * Generates the final symbol hierarchy in VS Code terms.
	 *
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
					var name = i.toString()
					if(tabMeta.name.length > 0){
						name = tabMeta.name 
					}
					const tabSymbol = new vscode.DocumentSymbol(
						name,
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

/**
 * Loop through the lines of the file. When tabs or functions are
 * found, save them in the store. At the end, report the store's
 * final state back to VS Code.
 */
class Pico8DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentSymbol[]> {
		const store = new SymbolStore()

		//Special case for first tab
		const firstTabLine = document.lineAt(3)
		var firstName = ''
		if(firstTabLine.text.match(/^--/)){
			firstName = firstTabLine.text.replace(/-/g,'').trim()
		}
		store.tabMetas.set(0, new TabMeta(new vscode.Range(new vscode.Position(2, 0), new vscode.Position(2, 0)), firstName))

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i)
			if (line.text.match(/^-->8/)) {
				const nextLine = document.lineAt(i+1)
				var name = ''
				if(nextLine.text.match(/^--/)){
					name = nextLine.text.replace(/-/g,'').trim()
				}
				store.advanceTab(line.range, name)
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
