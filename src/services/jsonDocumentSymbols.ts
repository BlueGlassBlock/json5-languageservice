/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Parser from '../parser/jsonParser';
import * as Strings from '../utils/strings';
import * as colorUtils from '../utils/colors';
import * as l10n from '@vscode/l10n';

import {
	TextDocument, ColorInformation, ColorPresentation, Color, ASTNode, PropertyASTNode, DocumentSymbolsContext, Range, TextEdit,
	SymbolInformation, SymbolKind, DocumentSymbol, Location
} from "../jsonLanguageTypes";

import { IJSONSchemaService } from "./jsonSchemaService";

export class JSONDocumentSymbols {

	private decorateAllColors: boolean = false;

	constructor(private schemaService: IJSONSchemaService) {
	}

	public updateDecorateColors(decorateAllColors: boolean): void {
		this.decorateAllColors = decorateAllColors;
	}

	public findDocumentSymbols(document: TextDocument, doc: Parser.JSONDocument, context: DocumentSymbolsContext = { resultLimit: Number.MAX_VALUE }): SymbolInformation[] {

		const root = doc.root;
		if (!root) {
			return [];
		}

		let limit = context.resultLimit || Number.MAX_VALUE;

		// special handling for key bindings
		const resourceString = document.uri;
		if ((resourceString === 'vscode://defaultsettings/keybindings.json') || Strings.endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
			if (root.type === 'array') {
				const result: SymbolInformation[] = [];
				for (const item of root.items) {
					if (item.type === 'object') {
						for (const property of item.properties) {
							if (property.keyNode.value === 'key' && property.valueNode) {
								const location = Location.create(document.uri, getRange(document, item));
								result.push({ name: getName(property.valueNode), kind: SymbolKind.Function, location: location });
								limit--;
								if (limit <= 0) {
									if (context && context.onResultLimitExceeded) {
										context.onResultLimitExceeded(resourceString);
									}
									return result;
								}
							}
						}
					}
				}
				return result;
			}
		}

		const toVisit: { node: ASTNode, containerName: string }[] = [
			{ node: root, containerName: '' }
		];
		let nextToVisit = 0;
		let limitExceeded = false;

		const result: SymbolInformation[] = [];

		const collectOutlineEntries = (node: ASTNode, containerName: string): void => {
			if (node.type === 'array') {
				node.items.forEach(node => {
					if (node) {
						toVisit.push({ node, containerName });
					}
				});
			} else if (node.type === 'object') {
				node.properties.forEach((property: PropertyASTNode) => {
					const valueNode = property.valueNode;
					if (valueNode) {
						if (limit > 0) {
							limit--;
							const location = Location.create(document.uri, getRange(document, property));
							const childContainerName = containerName ? containerName + '.' + property.keyNode.value : property.keyNode.value;
							result.push({ name: this.getKeyLabel(property), kind: this.getSymbolKind(valueNode.type), location: location, containerName: containerName });
							toVisit.push({ node: valueNode, containerName: childContainerName });
						} else {
							limitExceeded = true;
						}
					}
				});
			}
		};

		// breath first traversal
		while (nextToVisit < toVisit.length) {
			const next = toVisit[nextToVisit++];
			collectOutlineEntries(next.node, next.containerName);
		}

		if (limitExceeded && context && context.onResultLimitExceeded) {
			context.onResultLimitExceeded(resourceString);
		}
		return result;
	}

	public findDocumentSymbols2(document: TextDocument, doc: Parser.JSONDocument, context: DocumentSymbolsContext = { resultLimit: Number.MAX_VALUE }): DocumentSymbol[] {

		const root = doc.root;
		if (!root) {
			return [];
		}

		let limit = context.resultLimit || Number.MAX_VALUE;

		// special handling for key bindings
		const resourceString = document.uri;
		if ((resourceString === 'vscode://defaultsettings/keybindings.json') || Strings.endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
			if (root.type === 'array') {
				const result: DocumentSymbol[] = [];
				for (const item of root.items) {
					if (item.type === 'object') {
						for (const property of item.properties) {
							if (property.keyNode.value === 'key' && property.valueNode) {
								const range = getRange(document, item);
								const selectionRange = getRange(document, property.keyNode);
								result.push({ name: getName(property.valueNode), kind: SymbolKind.Function, range, selectionRange });
								limit--;
								if (limit <= 0) {
									if (context && context.onResultLimitExceeded) {
										context.onResultLimitExceeded(resourceString);
									}
									return result;
								}
							}
						}
					}
				}
				return result;
			}
		}

		const result: DocumentSymbol[] = [];
		const toVisit: { node: ASTNode, result: DocumentSymbol[] }[] = [
			{ node: root, result }
		];
		let nextToVisit = 0;
		let limitExceeded = false;

		const collectOutlineEntries = (node: ASTNode, result: DocumentSymbol[]) => {
			if (node.type === 'array') {
				node.items.forEach((node, index) => {
					if (node) {
						if (limit > 0) {
							limit--;
							const range = getRange(document, node);
							const selectionRange = range;
							const name = String(index);
							const symbol = { name, kind: this.getSymbolKind(node.type), range, selectionRange, children: [] };
							result.push(symbol);
							toVisit.push({ result: symbol.children, node });
						} else {
							limitExceeded = true;
						}
					}
				});
			} else if (node.type === 'object') {
				node.properties.forEach((property: PropertyASTNode) => {
					const valueNode = property.valueNode;
					if (valueNode) {
						if (limit > 0) {
							limit--;
							const range = getRange(document, property);
							const selectionRange = getRange(document, property.keyNode);
							const children: DocumentSymbol[] = [];
							const symbol: DocumentSymbol = { name: this.getKeyLabel(property), kind: this.getSymbolKind(valueNode.type), range, selectionRange, children, detail: this.getDetail(valueNode) };
							result.push(symbol);
							toVisit.push({ result: children, node: valueNode });
						} else {
							limitExceeded = true;
						}
					}
				});
			}
		};

		// breath first traversal
		while (nextToVisit < toVisit.length) {
			const next = toVisit[nextToVisit++];
			collectOutlineEntries(next.node, next.result);
		}

		if (limitExceeded && context && context.onResultLimitExceeded) {
			context.onResultLimitExceeded(resourceString);
		}
		return result;
	}

	private getSymbolKind(nodeType: string): SymbolKind {
		switch (nodeType) {
			case 'object':
				return SymbolKind.Module;
			case 'string':
				return SymbolKind.String;
			case 'number':
				return SymbolKind.Number;
			case 'array':
				return SymbolKind.Array;
			case 'boolean':
				return SymbolKind.Boolean;
			default: // 'null'
				return SymbolKind.Variable;
		}
	}

	private getKeyLabel(property: PropertyASTNode) {
		let name = property.keyNode.value;
		if (name) {
			name = name.replace(/[\n]/g, '↵');
		}
		if (name && name.trim()) {
			return name;
		}
		return `"${name}"`;
	}

	private getDetail(node: ASTNode | undefined) {
		if (!node) {
			return undefined;
		}
		if (node.type === 'boolean' || node.type === 'number' || node.type === 'null' || node.type === 'string') {
			return String(node.value);
		} else {
			if (node.type === 'array') {
				return node.children.length ? undefined : '[]';
			} else if (node.type === 'object') {
				return node.children.length ? undefined : '{}';
			}
		}
		return undefined;
	}

	public findDocumentColors(document: TextDocument, doc: Parser.JSONDocument, context?: DocumentSymbolsContext): PromiseLike<ColorInformation[]> {
		let limit = context && typeof context.resultLimit === 'number' ? context.resultLimit : Number.MAX_VALUE;

		if (this.decorateAllColors) {
			const result: ColorInformation[] = [];
			doc.visit((node) => {
				if (node.type === 'string') {
					const color = colorUtils.colorFromString(Parser.getNodeValue(node));
					if (color) {
						const range = getInnerRange(document, node);
						result.push({ color, range });
						limit--;
						if (limit <= 0) {
							if (context && context.onResultLimitExceeded) {
								context.onResultLimitExceeded(document.uri);
							}
							return false; // stop visiting
						}
					}
				}
				return true;
			});
			return Promise.resolve(result);
		}

		return this.schemaService.getSchemaForResource(document.uri, doc).then(schema => {
			const result: ColorInformation[] = [];
			if (schema) {

				const matchingSchemas = doc.getMatchingSchemas(schema.schema);
				const visitedNode: { [nodeId: string]: boolean } = {};
				for (const s of matchingSchemas) {
					if (!s.inverted && s.schema && (s.schema.format === 'color' || s.schema.format === 'color-hex') && s.node && s.node.type === 'string') {
						const nodeId = String(s.node.offset);
						if (!visitedNode[nodeId]) {
							const color = colorUtils.colorFromString(Parser.getNodeValue(s.node));
							if (color) {
								const range = getInnerRange(document, s.node);
								result.push({ color, range });
							}
							visitedNode[nodeId] = true;
							limit--;
							if (limit <= 0) {
								if (context && context.onResultLimitExceeded) {
									context.onResultLimitExceeded(document.uri);
								}
								return result;
							}
						}
					}
				}
			}
			return result;
		});
	}

	public getColorPresentations(document: TextDocument, doc: Parser.JSONDocument, color: Color, range: Range): ColorPresentation[] {
		// https://github.com/microsoft/vscode-css-languageservice/blob/f475d3faf0b9bdf437146ceb329f5c54210da028/src/services/cssNavigation.ts#L334
		const labels: string[] = [];

		const r = Math.round(color.red * 255), g = Math.round(color.green * 255), b = Math.round(color.blue * 255);

		function hexToTwoDigits(n: number): string {
			const r = n.toString(16);
			return r.length !== 2 ? '0' + r : r;
		}

		let label;

		if (color.alpha === 1) {
			label = `#${hexToTwoDigits(r)}${hexToTwoDigits(g)}${hexToTwoDigits(b)}`;
		}
		else {
			const a = Math.round(color.alpha * 255);
			label = `#${hexToTwoDigits(r)}${hexToTwoDigits(g)}${hexToTwoDigits(b)}${hexToTwoDigits(a)}`;
		}
		labels.push(label);

		if (color.alpha === 1) {
			label = `rgb(${r}, ${g}, ${b})`;
		}
		else {
			label = `rgba(${r}, ${g}, ${b}, ${color.alpha})`;
		}
		labels.push(label);

		const hsl = colorUtils.hslFromColor(color);
		if (hsl.a === 1) {
			label = `hsl(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
		} else {
			label = `hsla(${hsl.h}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${hsl.a})`;
		}
		labels.push(label);

		const hwb = colorUtils.hwbFromColor(color);
		if (hwb.a === 1) {
			label = `hwb(${hwb.h} ${Math.round(hwb.w * 100)}% ${Math.round(hwb.b * 100)}%)`;
		} else {
			label = `hwb(${hwb.h} ${Math.round(hwb.w * 100)}% ${Math.round(hwb.b * 100)}% / ${hwb.a})`;
		}
		labels.push(label);

		const lab = colorUtils.labFromColor(color);
		if (lab.alpha === 1) {
			label = `lab(${lab.l}% ${lab.a} ${lab.b})`;
		} else {
			label = `lab(${lab.l}% ${lab.a} ${lab.b} / ${lab.alpha})`;
		}
		labels.push(label);

		const lch = colorUtils.lchFromColor(color);
		if (lch.alpha === 1) {
			label = `lch(${lch.l}% ${lch.c} ${lch.h})`;
		} else {
			label = `lch(${lch.l}% ${lch.c} ${lch.h} / ${lch.alpha})`;
		}
		labels.push(label);

		const oklab = colorUtils.oklabFromColor(color);
		label = (oklab.alpha === 1) ? `oklab(${oklab.l}% ${oklab.a} ${oklab.b})` : `oklab(${oklab.l}% ${oklab.a} ${oklab.b} / ${oklab.alpha})`;
		labels.push(label);

		const oklch = colorUtils.oklchFromColor(color);
		label = (oklch.alpha === 1) ? `oklch(${oklch.l}% ${oklch.c} ${oklch.h})` : `oklch(${oklch.l}% ${oklch.c} ${oklch.h} / ${oklch.alpha})`;
		labels.push(label);

		return labels.map(label => {
			return { label: label, textEdit: TextEdit.replace(range, label) };
		});
	}

}
// hsl(343, 100%, 50%)
function getInnerRange(document: TextDocument, node: ASTNode) {
	return Range.create(document.positionAt(node.offset + 1), document.positionAt(node.offset + node.length - 1));
}

function getRange(document: TextDocument, node: ASTNode) {
	return Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
}

function getName(node: ASTNode) {
	return Parser.getNodeValue(node) || l10n.t('<empty>');
}
