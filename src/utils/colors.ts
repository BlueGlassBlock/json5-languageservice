/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Code from: https://github.com/microsoft/vscode-css-languageservice/blob/main/src/languageFacts/colors.ts

// FIXME: The conversion algorithm is a bit far from perfect, migrate to https://colorjs.io/ when upstream does it

import { Color } from "../jsonLanguageTypes";

const Digit0 = 48;
const Digit9 = 57;
const A = 65;
const a = 97;
const f = 102;

const DEGREES_PER_CIRCLE = 360; // Number of degrees in a full circle
const GRAD_TO_DEGREE_FACTOR = 0.9; // Conversion factor: grads to degrees
const RADIANS_TO_DEGREES_FACTOR = DEGREES_PER_CIRCLE / 2 / Math.PI; // Conversion factor: radians to degrees

export function hexDigit(charCode: number) {
	if (charCode < Digit0) {
		return 0;
	}
	if (charCode <= Digit9) {
		return charCode - Digit0;
	}
	if (charCode < a) {
		charCode += (a - A);
	}
	if (charCode >= a && charCode <= f) {
		return charCode - a + 10;
	}
	return 0;
}

export function colorFromHex(text: string): Color | undefined {
	if (text[0] !== '#') {
		return undefined;
	}
	switch (text.length) {
		case 4:
			return {
				red: (hexDigit(text.charCodeAt(1)) * 0x11) / 255.0,
				green: (hexDigit(text.charCodeAt(2)) * 0x11) / 255.0,
				blue: (hexDigit(text.charCodeAt(3)) * 0x11) / 255.0,
				alpha: 1
			};
		case 5:
			return {
				red: (hexDigit(text.charCodeAt(1)) * 0x11) / 255.0,
				green: (hexDigit(text.charCodeAt(2)) * 0x11) / 255.0,
				blue: (hexDigit(text.charCodeAt(3)) * 0x11) / 255.0,
				alpha: (hexDigit(text.charCodeAt(4)) * 0x11) / 255.0,
			};
		case 7:
			return {
				red: (hexDigit(text.charCodeAt(1)) * 0x10 + hexDigit(text.charCodeAt(2))) / 255.0,
				green: (hexDigit(text.charCodeAt(3)) * 0x10 + hexDigit(text.charCodeAt(4))) / 255.0,
				blue: (hexDigit(text.charCodeAt(5)) * 0x10 + hexDigit(text.charCodeAt(6))) / 255.0,
				alpha: 1
			};
		case 9:
			return {
				red: (hexDigit(text.charCodeAt(1)) * 0x10 + hexDigit(text.charCodeAt(2))) / 255.0,
				green: (hexDigit(text.charCodeAt(3)) * 0x10 + hexDigit(text.charCodeAt(4))) / 255.0,
				blue: (hexDigit(text.charCodeAt(5)) * 0x10 + hexDigit(text.charCodeAt(6))) / 255.0,
				alpha: (hexDigit(text.charCodeAt(7)) * 0x10 + hexDigit(text.charCodeAt(8))) / 255.0
			};
	}
	return undefined;
}

export function colorFrom256RGB(red: number, green: number, blue: number, alpha: number = 1.0) {
	return {
		red: red / 255.0,
		green: green / 255.0,
		blue: blue / 255.0,
		alpha
	};
}


export function colorFromHSL(hue: number, sat: number, light: number, alpha: number = 1.0): Color {
	hue = hue / 60.0;
	if (sat === 0) {
		return { red: light, green: light, blue: light, alpha };
	} else {
		const hueToRgb = (t1: number, t2: number, hue: number) => {
			while (hue < 0) { hue += 6; }
			while (hue >= 6) { hue -= 6; }

			if (hue < 1) { return (t2 - t1) * hue + t1; }
			if (hue < 3) { return t2; }
			if (hue < 4) { return (t2 - t1) * (4 - hue) + t1; }
			return t1;
		};
		const t2 = light <= 0.5 ? (light * (sat + 1)) : (light + sat - (light * sat));
		const t1 = light * 2 - t2;
		return { red: hueToRgb(t1, t2, hue + 2), green: hueToRgb(t1, t2, hue), blue: hueToRgb(t1, t2, hue - 2), alpha };
	}
}

export interface HSLA { h: number; s: number; l: number; a: number; }

export function hslFromColor(rgba: Color): HSLA {
	const r = rgba.red;
	const g = rgba.green;
	const b = rgba.blue;
	const a = rgba.alpha;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (min + max) / 2;
	const chroma = max - min;

	if (chroma > 0) {
		s = Math.min((l <= 0.5 ? chroma / (2 * l) : chroma / (2 - (2 * l))), 1);

		switch (max) {
			case r: h = (g - b) / chroma + (g < b ? 6 : 0); break;
			case g: h = (b - r) / chroma + 2; break;
			case b: h = (r - g) / chroma + 4; break;
		}

		h *= 60;
		h = Math.round(h);
	}
	return { h, s, l, a };
}

export function colorFromHWB(hue: number, white: number, black: number, alpha: number = 1.0): Color {
	if (white + black >= 1) {
		const gray = white / (white + black);
		return { red: gray, green: gray, blue: gray, alpha };
	}

	const rgb = colorFromHSL(hue, 1, 0.5, alpha);
	let red = rgb.red;
	red *= (1 - white - black);
	red += white;

	let green = rgb.green;
	green *= (1 - white - black);
	green += white;

	let blue = rgb.blue;
	blue *= (1 - white - black);
	blue += white;

	return {
		red: red,
		green: green,
		blue: blue,
		alpha
	};
}

export interface HWBA { h: number; w: number; b: number; a: number; }

export function hwbFromColor(rgba: Color): HWBA {
	const hsl = hslFromColor(rgba);
	const white = Math.min(rgba.red, rgba.green, rgba.blue);
	const black = 1 - Math.max(rgba.red, rgba.green, rgba.blue);

	return {
		h: hsl.h,
		w: white,
		b: black,
		a: hsl.a
	};
}

export interface XYZ { x: number; y: number; z: number; alpha: number; }

export interface RGB { r: number; g: number; b: number; alpha: number; }

export function xyzFromLAB(lab: LAB): XYZ {
	const xyz: XYZ = {
		x: 0,
		y: 0,
		z: 0,
		alpha: lab.alpha ?? 1
	};
	xyz.y = (lab.l + 16.0) / 116.0;
	xyz.x = (lab.a / 500.0) + xyz.y;
	xyz.z = xyz.y - (lab.b / 200.0);
	let key: keyof XYZ;

	for (key in xyz) {
		let pow = xyz[key] * xyz[key] * xyz[key];
		if (pow > 0.008856) {
			xyz[key] = pow;
		} else {
			xyz[key] = (xyz[key] - 16.0 / 116.0) / 7.787;
		}
	}

	xyz.x = xyz.x * 95.047;
	xyz.y = xyz.y * 100.0;
	xyz.z = xyz.z * 108.883;
	return xyz;
}

export function xyzFromOKLAB(lab: LAB): XYZ {
	// Convert from OKLab to XYZ
	// References: https://bottosson.github.io/posts/oklab/

	// lab.l is in 0-1 range
	// lab.a and lab.b are in -0.4 to 0.4 range
	const l = lab.l + 0.396_337_777_4 * lab.a + 0.215_803_757_3 * lab.b;
	const m = lab.l - 0.105_561_345_8 * lab.a - 0.063_854_172_8 * lab.b;
	const s = lab.l - 0.089_484_177_5 * lab.a - 1.291_485_548 * lab.b;

	// Apply non-linearity using exponentiation
	const l3 = l ** 3;
	const m3 = m ** 3;
	const s3 = s ** 3;

	// Convert to XYZ
	const x = 1.227_013_851_1 * l3 - 0.557_799_980_7 * m3 + 0.281_256_149 * s3;
	const y = -0.040_580_178_4 * l3 + 1.112_256_869_6 * m3 - 0.071_676_678_7 * s3;
	const z = -0.076_381_284_5 * l3 - 0.421_481_978_4 * m3 + 1.586_163_220_4 * s3;

	return {
		x: x * 100,
		y: y * 100,
		z: z * 100,
		alpha: lab.alpha ?? 1,
	};
}

export function xyzToRGB(xyz: XYZ): Color {
	const x = xyz.x / 100;
	const y = xyz.y / 100;
	const z = xyz.z / 100;

	const r = 3.2406254773200533 * x - 1.5372079722103187 * y - 0.4986285986982479 * z;
	const g = -0.9689307147293197 * x + 1.8757560608852415 * y + 0.041517523842953964 * z;
	const b = 0.055710120445510616 * x + -0.2040210505984867 * y + 1.0569959422543882 * z;

	const compand = (c: number) => {
		return c <= 0.0031308 ?
			12.92 * c :
			Math.min(1.055 * Math.pow(c, 1 / 2.4) - 0.055, 1);
	}

	return {
		red: Math.round(compand(r) * 255.0),
		blue: Math.round(compand(b) * 255.0),
		green: Math.round(compand(g) * 255.0),
		alpha: xyz.alpha
	};
}

export function RGBtoXYZ(rgba: Color): XYZ {
	let r: number = rgba.red,
		g: number = rgba.green,
		b: number = rgba.blue;

	if (r > 0.04045) {
		r = Math.pow((r + 0.055) / 1.055, 2.4);
	} else {
		r = r / 12.92;
	}
	if (g > 0.04045) {
		g = Math.pow((g + 0.055) / 1.055, 2.4);
	} else {
		g = g / 12.92;
	}
	if (b > 0.04045) {
		b = Math.pow((b + 0.055) / 1.055, 2.4);
	} else {
		b = b / 12.92;
	}
	r = r * 100;
	g = g * 100;
	b = b * 100;

	//Observer = 2°, Illuminant = D65
	const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
	const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
	return { x, y, z, alpha: rgba.alpha };
}

export function XYZtoLAB(xyz: XYZ, round: Boolean = true): LAB {
	const ref_X = 95.047, ref_Y = 100.000, ref_Z = 108.883;

	let x: number = xyz.x / ref_X,
		y: number = xyz.y / ref_Y,
		z: number = xyz.z / ref_Z;

	if (x > 0.008856) {
		x = Math.pow(x, 1 / 3);
	} else {
		x = (7.787 * x) + (16 / 116);
	}
	if (y > 0.008856) {
		y = Math.pow(y, 1 / 3);
	} else {
		y = (7.787 * y) + (16 / 116);
	}
	if (z > 0.008856) {
		z = Math.pow(z, 1 / 3);
	} else {
		z = (7.787 * z) + (16 / 116);
	}
	const l: number = (116 * y) - 16,
		a: number = 500 * (x - y),
		b: number = 200 * (y - z);
	if (round) {
		return {
			l: Math.round((l + Number.EPSILON) * 100) / 100,
			a: Math.round((a + Number.EPSILON) * 100) / 100,
			b: Math.round((b + Number.EPSILON) * 100) / 100,
			alpha: xyz.alpha
		};
	} else {
		return {
			l, a, b,
			alpha: xyz.alpha
		};
	}
}

export function XYZtoOKLAB(xyz: XYZ, round = true): LAB {
	// Convert XYZ to OKLab
	// References: https://bottosson.github.io/posts/oklab/

	// Normalize XYZ values
	const x = xyz.x / 100;
	const y = xyz.y / 100;
	const z = xyz.z / 100;

	// Convert to LMS
	const l = 0.818_933_010_1 * x + 0.361_866_742_4 * y - 0.128_859_713_7 * z;
	const m = 0.032_984_543_6 * x + 0.929_311_871_5 * y + 0.036_145_638_7 * z;
	const s = 0.048_200_301_8 * x + 0.264_366_269_1 * y + 0.633_851_707 * z;

	// Apply non-linearity
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	// Convert to OKLab
	const L = 0.210_454_255_3 * l_ + 0.793_617_785 * m_ - 0.004_072_046_8 * s_;
	const a = 1.977_998_495_1 * l_ - 2.428_592_205 * m_ + 0.450_593_709_9 * s_;
	const b = 0.025_904_037_1 * l_ + 0.782_771_766_2 * m_ - 0.808_675_766 * s_;

	return round
		// 5 decimal places for precision
		? {
			l: Number(L.toFixed(5)),
			a: Number(a.toFixed(5)),
			b: Number(b.toFixed(5)),
			alpha: xyz.alpha,
		}
		: {
			l: L,
			a,
			b,
			alpha: xyz.alpha,
		};
}

export function labFromColor(rgba: Color, round: Boolean = true): LAB {
	const xyz: XYZ = RGBtoXYZ(rgba);
	const lab: LAB = XYZtoLAB(xyz, round);
	return lab;
}

export function oklabFromColor(rgba: Color, round = true): LAB {
	const xyz: XYZ = RGBtoXYZ(rgba);
	const lab: LAB = XYZtoOKLAB(xyz, round);
	// Convert lightness to a percentage of oklab
	return { ...lab, l: lab.l * 100 };
}

/**
 * Calculate chroma and hue from Lab values
 * Returns LCH values without formatting/rounding
 */
function labToLCH(lab: LAB): LCH {
	const c: number = Math.sqrt(Math.pow(lab.a, 2) + Math.pow(lab.b, 2));
	let h: number = Math.atan2(lab.b, lab.a) * RADIANS_TO_DEGREES_FACTOR;
	while (h < 0) {
		h = h + 360;
	}
	return {
		l: lab.l,
		c: c,
		h: h,
		alpha: lab.alpha,
	};
}

export function lchFromColor(rgba: Color): LCH {
	const lab: LAB = labFromColor(rgba, false);
	const lch: LCH = labToLCH(lab);

	return {
		l: Math.round((lch.l + Number.EPSILON) * 100) / 100,
		c: Math.round((lch.c + Number.EPSILON) * 100) / 100,
		h: Math.round((lch.h + Number.EPSILON) * 100) / 100,
		alpha: lch.alpha,
	};
}

export function oklchFromColor(rgba: Color): LCH {
	const lab: LAB = oklabFromColor(rgba, false);
	const lch: LCH = labToLCH(lab);

	return {
		l: Number((lch.l).toFixed(3)),
		c: Number(lch.c.toFixed(5)),
		h: Number(lch.h.toFixed(3)),
		alpha: lch.alpha,
	};
}

/**
 * Generic function to convert LAB/OKLAB to Color
 */
function labToColor(lab: LAB, xyzConverter: (lab: LAB) => XYZ): Color {
	const xyz = xyzConverter(lab);
	const rgb = xyzToRGB(xyz);
	return {
		red: (rgb.red >= 0 ? Math.min(rgb.red, 255) : 0) / 255,
		green: (rgb.green >= 0 ? Math.min(rgb.green, 255) : 0) / 255,
		blue: (rgb.blue >= 0 ? Math.min(rgb.blue, 255) : 0) / 255,
		alpha: lab.alpha ?? 1,
	};
}

export function colorFromLAB(l: number, a: number, b: number, alpha = 1): Color {
	return labToColor({ l, a, b, alpha }, xyzFromLAB);
}

export function colorFromOKLAB(l: number, a: number, b: number, alpha = 1): Color {
	return labToColor({ l, a, b, alpha }, xyzFromOKLAB);
}

export interface LAB { l: number; a: number; b: number; alpha?: number; }

const DEGREES_TO_RADIANS_FACTOR = Math.PI / 180;

export function labFromLCH(l: number, c: number, h: number, alpha = 1): LAB {
	return {
		l: l,
		a: c * Math.cos(h * DEGREES_TO_RADIANS_FACTOR),
		b: c * Math.sin(h * DEGREES_TO_RADIANS_FACTOR),
		alpha: alpha,
	};
}

export function colorFromLCH(l: number, c: number, h: number, alpha = 1): Color {
	const lab: LAB = labFromLCH(l, c, h, alpha);
	return colorFromLAB(lab.l, lab.a, lab.b, alpha);
}

export function colorFromOKLCH(l: number, c: number, h: number, alpha = 1): Color {
	const lab: LAB = labFromLCH(l, c, h, alpha); // Conversion is the same as LCH->LAB for OKLCH-OKLAB
	return colorFromOKLAB(lab.l, lab.a, lab.b, alpha);
}

export interface LCH { l: number; c: number; h: number; alpha?: number; }

function getNumericValue(val: string, factor: number, lowerLimit: number = 0, upperLimit: number = 1): number {
	const m = val.match(/^([-+]?[0-9]*\.?[0-9]+)(%?)$/);
	if (m) {
		if (m[2]) {
			factor = 100.0;
		}
		const result = parseFloat(m[1]) / factor;
		if (result >= lowerLimit && result <= upperLimit) {
			return result;
		}
	}
	throw new Error();
}


function getAngle(val: string): number {
	// Hue angle keyword `none` is the equivilient of `0deg`
	if (val === 'none') {
		return 0;
	}

	const m = /^(?<numberString>[-+]?[0-9]*\.?[0-9]+)(?<unit>deg|rad|grad|turn)?$/iu.exec(val);
	if (m?.groups?.['numberString']) {
		const value = Number.parseFloat(m.groups['numberString']);
		if (!Number.isNaN(value)) {
			switch (m.groups['unit']) {
				case 'deg': {
					return value % DEGREES_PER_CIRCLE;
				}

				case 'grad': {
					return (value * GRAD_TO_DEGREE_FACTOR) % DEGREES_PER_CIRCLE;
				}

				case 'rad': {
					return (value * RADIANS_TO_DEGREES_FACTOR) % DEGREES_PER_CIRCLE;
				}

				case 'turn': {
					return (value * DEGREES_PER_CIRCLE) % DEGREES_PER_CIRCLE;
				}

				default: {
					// Unitless angles are treated as degrees
					return value % DEGREES_PER_CIRCLE;
				}
			}
		}
	}

	throw new Error(`Failed to parse '${val}' as angle`);
}

function colorFromFunc(func: string, args: string[]): Color | null {
	const alpha = args.length === 4 ? getNumericValue(args[3], 1) : 1.0;
	try {
		switch (func) {
			case 'rgb':
			case 'rgba': {
				const red = getNumericValue(args[0], 255);
				const green = getNumericValue(args[1], 255);
				const blue = getNumericValue(args[2], 255);
				return {red, green, blue, alpha};
			}
			case 'hsl':
			case 'hsla': {
				const hue = getAngle(args[0]);
				const saturation = getNumericValue(args[1], 100);
				const lightness = getNumericValue(args[2], 100);
				return colorFromHSL(hue, saturation, lightness, alpha);
			}

			case 'hwb': {
				const h = getAngle(args[0]);
				const w = getNumericValue(args[1], 100);
				const b = getNumericValue(args[2], 100);
				return colorFromHWB(h, w, b, alpha);
			}

			case 'lab': {
				// Reference: https://mina86.com/2021/srgb-lab-lchab-conversions/
				const l = getNumericValue(args[0], 100);
				// Since these two values can be negative, a lower limit of -1 has been added
				const a = getNumericValue(args[1], 125, -1);
				const b = getNumericValue(args[2], 125, -1);
				return colorFromLAB(l * 100, a * 125, b * 125, alpha);
			}

			case 'lch': {
				const l = getNumericValue(args[0], 100);
				const c = getNumericValue(args[1], 230);
				const h = getAngle(args[2]);
				return colorFromLCH(l * 100, c * 230, h, alpha);
			}

			case 'oklab': {
				const l = getNumericValue(args[0], 1);
				// Since these two values can be negative, a lower limit of -1 has been added
				const a = getNumericValue(args[1], 0.4, -1);
				const b = getNumericValue(args[2], 0.4, -1);
				return colorFromOKLAB(l, a * 0.4, b * 0.4, alpha);
			}

			case 'oklch': {
				const l = getNumericValue(args[0], 1);
				const c = getNumericValue(args[1], 0.4);
				const h = getAngle(args[2]);
				return colorFromOKLCH(l, c * 0.4, h, alpha);
			}
		}
	}
	catch (_) {
	}
	return null;
}

export function colorFromString(text: string): Color | undefined {
	// Hex color
	if (text.startsWith('#')) {
		return colorFromHex(text);
	}

	// Parse as function call
	const functionMatch = /^(?<func>[a-z]+)\((?<args>.+)\)$/i.exec(text);
	if (functionMatch?.groups) {
		const func = functionMatch.groups['func'];
		const legacyArgs = functionMatch.groups['args'].split(',').map(arg => arg.trim());
		const modernArgsAlpha = functionMatch.groups['args'].split('/').map(arg => arg.trim());
		const modernArgs = modernArgsAlpha[0].split(/\s+/).map(arg => arg.trim());
		if (modernArgs.length === 3 && modernArgsAlpha.length <= 2) {
			if (modernArgsAlpha.length === 2) {
				modernArgs.push(modernArgsAlpha[1]);
			}
			const modernColor = colorFromFunc(func, modernArgs);
			if (modernColor) {
				return modernColor;
			}
		}
		switch (func) {
			case 'rgb':
			case 'rgba':
			case 'hsl':
			case 'hsla':
				if (legacyArgs.length === 3 || legacyArgs.length === 4) {
					return colorFromFunc(func, legacyArgs) || undefined;
				}
		}
	}
	return undefined;
}
