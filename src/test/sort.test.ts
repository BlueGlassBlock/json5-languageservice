
import { getLanguageService, ClientCapabilities, TextDocument, SortOptions } from '../jsonLanguageService';
import * as assert from 'assert';

suite('Sort JSON', () => {

    const ls = getLanguageService({ clientCapabilities: ClientCapabilities.LATEST });
    let formattingOptions = { tabSize: 2, insertSpaces: true, keepLines: false, eol: '\n', insertFinalNewline: false };

    function testSort(unsorted: string, expected: string, options: SortOptions) {
        let document = TextDocument.create('test://test.json', 'json', 0, unsorted);
        const edits = ls.sort(document, options);
        const sorted = TextDocument.applyEdits(document, edits);
        assert.equal(sorted, expected);
    }

    test('sorting a simple JSONC object with numeric values', () => {
        const content = [
            '{"b" : 1, "a" : 2}'
        ].join('\n');

        const expected = [
            '{\n  "a": 2,\n  "b": 1\n}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a simple JSONC object with an array spanning several lines', () => {
        const content = [
            '{"array":["volleyball",',
            '      "drawing",',
            '  "hiking"]}'
        ].join('\n');

        const expected = [
            '{',
            '  "array": [',
            '    "volleyball",',
            '    "drawing",',
            '    "hiking"',
            '  ]',
            '}'

        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with nested objects', () => {
        const content = [
            '{"name": "Brigitte","age" : 30,',
            '"hobbies" : ["volleyball","drawing","hiking"],',
            '"friends" : {',
            '"Marc" : {"hobbies" : ["kayaking", "mountaineering"],',
            '"age" : 35,},',
            '"Leila" : {"hobbies" : ["watching movies",',
            '"reading books"], "age" : 32}}}'
        ].join('\n');

        const expected = [
            '{',
            '  "age": 30,',
            '  "friends": {',
            '    "Leila": {',
            '      "age": 32,',
            '      "hobbies": [',
            '        "watching movies",',
            '        "reading books"',
            '      ]',
            '    },',
            '    "Marc": {',
            '      "age": 35,',
            '      "hobbies": [',
            '        "kayaking",',
            '        "mountaineering"',
            '      ]',
            '    }',
            '  },',
            '  "hobbies": [',
            '    "volleyball",',
            '    "drawing",',
            '    "hiking"',
            '  ],',
            '  "name": "Brigitte"',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with line comments', () => {
        const content = [
            '{ // this is a comment',
            '"boolean" : true,',
            '"array" : [',
            '// this is a second comment',
            ' "element1", "element2"]',
            '}'

        ].join('\n');

        const expected = [
            '{ // this is a comment',
            '  "array": [',
            '    // this is a second comment',
            '    "element1",',
            '    "element2"',
            '  ],',
            '  "boolean": true',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with an object nested inside of an array value', () => {
        const content = [
            '{',
            '"boolean" : true,',
            '"array" : [',
            ' "element1", {"property" : "element2"}, "element3"]',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "array": [',
            '    "element1",',
            '    {',
            '      "property": "element2"',
            '    },',
            '    "element3"',
            '  ],',
            '  "boolean": true',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with comments appearing before and after the main JSON object', () => {
        const content = [
            '// comment appearing before',
            '',
            '{',
            '"boolean" : true,',
            '"array" : [',
            ' "element1", {"property" : "element2"}, "element3"]',
            '} /* block comment appearing ',
            'after, it spans several',
            'lines */'
        ].join('\n');

        const expected = [
            '// comment appearing before',
            '{',
            '  "array": [',
            '    "element1",',
            '    {',
            '      "property": "element2"',
            '    },',
            '    "element3"',
            '  ],',
            '  "boolean": true',
            '} /* block comment appearing ',
            'after, it spans several',
            'lines */'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with new lines appearing before and after the main JSON object', () => {
        const content = [
            '',
            '',
            '{',
            '"boolean" : true,',
            '"array" : [',
            ' "element1", {"property" : "element2"}, "element3"]',
            '}',
            '',
            ''
        ].join('\n');

        const expected = [
            '{',
            '  "array": [',
            '    "element1",',
            '    {',
            '      "property": "element2"',
            '    },',
            '    "element3"',
            '  ],',
            '  "boolean": true',
            '}',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with a block comment appearing on the same line as a comma but not ending on that line', () => {
        const content = [
            '{',
            '"boolean" : true, /* this is block comment starting on',
            'the line where the comma is but ending on another line */',
            '"array" : []',
            '}',
        ].join('\n');

        const expected = [
            '{',
            '  "array": [],',
            '  "boolean": true /* this is block comment starting on',
            'the line where the comma is but ending on another line */',
            '}',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with a block comment starting at the end of a property and such that a new property starts on the end of that block comment', () => {
        const content = [
            '{',
            '"boolean" : true, /* this is block comment starting on',
            'the line where the comma is but ending on another line */ "array" : []',
            '}',
        ].join('\n');

        const expected = [
            '{',
            '  "array": [],',
            '  "boolean": true /* this is block comment starting on',
            'the line where the comma is but ending on another line */',
            '}',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with comments between properties', () => {
        const content = [
            '// comment appearing before',
            '',
            '{',
            ' // some comment',
            '"boolean" : true,',
            ' // some other comment',
            '"numeric" : 2,',
            ' /* a third comment',
            ' which is a block comment */',
            '"array": []',
            '}'
        ].join('\n');

        const expected = [
            '// comment appearing before',
            '{',
            '  /* a third comment',
            ' which is a block comment */',
            '  "array": [],',
            '  // some comment',
            '  "boolean": true,',
            '  // some other comment',
            '  "numeric": 2',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with comments appearing between a value and the comma', () => {
        const content = [
            '{',
            '"boolean" : true // some comment',
            ',',
            '"array" : [],',
            '"numeric" : 2',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "array": [],',
            '  "boolean": true // some comment',
            '  ,',
            '  "numeric": 2',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object with block comments on the same line as the arrays', () => {
        const content = [
            '/* multi-line comment',
            '..',
            '*/',
            '{ /* multi-line comment',
            '..',
            '*/ ',
            '"information_for_contributors": [',
            '/* multi-line comment',
            '..',
            '*/',
            '"This file has been converted from https://github.com/textmate/perl.tmbundle/blob/master/Syntaxes/Perl%206.tmLanguage",',
            '"Once accepted there, we are happy to receive an update request."',
            '], /* multi-line comment',
            '..',
            '*/',
            '"version": "https://github.com/textmate/perl.tmbundle/commit/d9841a0878239fa43f88c640f8d458590f97e8f5", /* multi-line comment',
            '..',
            '*/',
            '"name": "Perl 6" /* multi-line comment',
            '..',
            '*/',
            '}'
        ].join('\n');

        const expected = [
            '/* multi-line comment',
            '..',
            '*/',
            '{ /* multi-line comment',
            '..',
            '*/',
            '  "information_for_contributors": [',
            '    /* multi-line comment',
            '..',
            '*/',
            '    "This file has been converted from https://github.com/textmate/perl.tmbundle/blob/master/Syntaxes/Perl%206.tmLanguage",',
            '    "Once accepted there, we are happy to receive an update request."',
            '  ], /* multi-line comment',
            '..',
            '*/',
            '  "name": "Perl 6", /* multi-line comment',
            '..',
            '*/',
            '  "version": "https://github.com/textmate/perl.tmbundle/commit/d9841a0878239fa43f88c640f8d458590f97e8f5" /* multi-line comment',
            '..',
            '*/',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSONC object where the colon is not on the same line as the key or the value', () => {
        const content = [
            '{',
            '"boolean"',
            ':',
            'true // some comment',
            ',',
            '"array"',
            ': [],',
            '"numeric" : 2',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "array": [],',
            '  "boolean": true // some comment',
            '  ,',
            '  "numeric": 2',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 1', () => {
        const content = [
            '// Comment ouside the main JSON object',
            '',
            '{',
            '// A comment which belongs to b',
            '"b": "some value",',
            '',
            '"a": "some other value" /* a block comment which starts on the same line as key a',
            '..*/,',
            '',
            '"array": [',
            '"first element",',
            '{',
            '    // comment belonging to r',
            '    "r" : 1,',
            '',
            '    // comment belonging to q',
            '    "q" : {',
            '        "s" : 2',
            '    },',
            '    // comment belonging to p',
            '    "p" : 3',
            '},',
            '"third element"',
            '] // some comment on the line where the array ends',
            ',',
            '',
            '"numeric" : [ 1, 2, 3]',
            '}',
            '',
            '',
            '/* Comment below the main JSON object',
            '...',
            '...',
            '*/'
        ].join('\n');

        const expected = [
            '// Comment ouside the main JSON object',
            '{',
            '  "a": "some other value" /* a block comment which starts on the same line as key a',
            '..*/,',
            '  "array": [',
            '    "first element",',
            '    {',
            '      // comment belonging to p',
            '      "p": 3,',
            '      // comment belonging to q',
            '      "q": {',
            '        "s": 2',
            '      },',
            '      // comment belonging to r',
            '      "r": 1',
            '    },',
            '    "third element"',
            '  ] // some comment on the line where the array ends',
            '  ,',
            '  // A comment which belongs to b',
            '  "b": "some value",',
            '  "numeric": [',
            '    1,',
            '    2,',
            '    3',
            '  ]',
            '}',
            '/* Comment below the main JSON object',
            '...',
            '...',
            '*/'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 2', () => {
        const content = [
            '/*',
            '',
            'adding some comment before the actual JSON file',
            '',
            '*/ {',
            '    "webviewContentExternalBaseUrlTemplate": "https://{{uuid}}.vscode-cdn.net/insider/ef65ac1ba57f57f2a3961bfe94aa20481caca4c6/out/vs/workbench/contrib/webview/browser/pre/",',
            '    // some other comment',
            '    "builtInExtensions": [',
            '        {',
            '            "name": "ms-vscode.js-debug-companion", /** adding some more comments **/',
            '            "version": "1.0.18",',
            '            "repo": "https://github.com/microsoft/vscode-js-debug-companion",',
            '            "metadata": {',
            '                "id": "99cb0b7f-7354-4278-b8da-6cc79972169d",',
            '                "publisherId": {',
            '                    "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '                    "publisherName": "ms-vscode" // comment',
            '                    ,',
            '                    "displayName": "Microsoft",',
            '                    "flags": "verified"',
            '                },',
            '                "publisherDisplayName": "Microsoft"',
            '            }',
            '        },',
            '        {',
            '            "name": "ms-vscode.js-debug", /** adding some more comments',
            '            ...',
            '            ...',
            '            */ "version": "1.75.1",',
            '            "repo": "https://github.com/microsoft/vscode-js-debug",',
            '            "metadata": {',
            '                "id": "25629058-ddac-4e17-abba-74678e126c5d",',
            '                "publisherId": {',
            '                    "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '                    "publisherName": "ms-vscode",',
            '                    "displayName": "Microsoft",',
            '                    "flags": "verified"',
            '                },',
            '                "publisherDisplayName": "Microsoft"',
            '            }',
            '           // some more comments at the end after all properties',
            '        },',
            '        {',
            '            "name": "ms-vscode.vscode-js-profile-table",',
            '            "version": "1.0.3",',
            '            "repo": "https://github.com/microsoft/vscode-js-profile-visualizer",',
            '            "metadata": {',
            '                "id": "7e52b41b-71ad-457b-ab7e-0620f1fc4feb",',
            '                "publisherId": {',
            '                    "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '                    "publisherName": "ms-vscode",',
            '                    "displayName": "Microsoft",',
            '                    "flags": "verified"',
            '                },',
            '                "publisherDisplayName": "Microsoft"',
            '            }',
            '        } ',
            '    ] // comment on the end of an array',
            '}',
        ].join('\n');

        const expected = [
            '/*',
            '',
            'adding some comment before the actual JSON file',
            '',
            '*/ {',
            '  // some other comment',
            '  "builtInExtensions": [',
            '    {',
            '      "metadata": {',
            '        "id": "99cb0b7f-7354-4278-b8da-6cc79972169d",',
            '        "publisherDisplayName": "Microsoft",',
            '        "publisherId": {',
            '          "displayName": "Microsoft",',
            '          "flags": "verified",',
            '          "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '          "publisherName": "ms-vscode" // comment',
            '        }',
            '      },',
            '      "name": "ms-vscode.js-debug-companion", /** adding some more comments **/',
            '      "repo": "https://github.com/microsoft/vscode-js-debug-companion",',
            '      "version": "1.0.18"',
            '    },',
            '    {',
            '      "metadata": {',
            '        "id": "25629058-ddac-4e17-abba-74678e126c5d",',
            '        "publisherDisplayName": "Microsoft",',
            '        "publisherId": {',
            '          "displayName": "Microsoft",',
            '          "flags": "verified",',
            '          "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '          "publisherName": "ms-vscode"',
            '        }',
            '      },',
            '      // some more comments at the end after all properties',
            '      "name": "ms-vscode.js-debug", /** adding some more comments',
            '            ...',
            '            ...',
            '            */',
            '      "repo": "https://github.com/microsoft/vscode-js-debug",',
            '      "version": "1.75.1"',
            '    },',
            '    {',
            '      "metadata": {',
            '        "id": "7e52b41b-71ad-457b-ab7e-0620f1fc4feb",',
            '        "publisherDisplayName": "Microsoft",',
            '        "publisherId": {',
            '          "displayName": "Microsoft",',
            '          "flags": "verified",',
            '          "publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",',
            '          "publisherName": "ms-vscode"',
            '        }',
            '      },',
            '      "name": "ms-vscode.vscode-js-profile-table",',
            '      "repo": "https://github.com/microsoft/vscode-js-profile-visualizer",',
            '      "version": "1.0.3"',
            '    }',
            '  ], // comment on the end of an array',
            '  "webviewContentExternalBaseUrlTemplate": "https://{{uuid}}.vscode-cdn.net/insider/ef65ac1ba57f57f2a3961bfe94aa20481caca4c6/out/vs/workbench/contrib/webview/browser/pre/"',
            '}',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a deeply nested JSONC object', () => {
        const content = [
            '{',
            '    "a" : {',
            '        "y" : {},',
            '        "a" : {}',
            '    }, // comment',
            '',
            '   "b" : [',
            '        [',
            '            { /* some comment',
            '            */',
            '                "b" : {',
            '                    "y" : [],',
            '                    "x" : []',
            '                },',
            '                "a" : {',
            '                    "z" : [],',
            '                    "m" : [],',
            '                    "b" : {',
            '                        "b" : 1,',
            '                        "a" : 2',
            '                    }',
            '                },',
            '                "c" : {',
            '                    "a" : {',
            '                        "b" : 1',
            '                    }',
            '                   // comment at the end',
            '                }',
            '            }',
            '        ]',
            '    ]',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "a": {',
            '    "a": {},',
            '    "y": {}',
            '  }, // comment',
            '  "b": [',
            '    [',
            '      { /* some comment',
            '            */',
            '        "a": {',
            '          "b": {',
            '            "a": 2,',
            '            "b": 1',
            '          },',
            '          "m": [],',
            '          "z": []',
            '        },',
            '        "b": {',
            '          "x": [],',
            '          "y": []',
            '        },',
            '        "c": {',
            '          "a": {',
            '            "b": 1',
            '          }',
            '          // comment at the end',
            '        }',
            '      }',
            '    ]',
            '  ]',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a simple JSONC document where the outer container is an array', () => {
        const content = [
            '[',
            '    {',
            '        "hi": 1',
            '    },',
            '',
            '    // some comment',
            '',
            '    {',
            '        "b" : 2,',
            '        "a" : 1',
            '    }',
            ']'
        ].join('\n');

        const expected = [
            '[',
            '  {',
            '    "hi": 1',
            '  },',
            '  // some comment',
            '  {',
            '    "a": 1,',
            '    "b": 2',
            '  }',
            ']'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 3', () => {
        const content = [
            '{',
            '    "type": "array",',
            '    "items": {',
            '        /* multi-line comment',
            '        ..',
            '        */',
            '        "oneOf": [ /* multi-line comment',
            '                ..',
            '                */',
            '            {',
            '                "type": "object",',
            '                "required": [ /* multi-line comment',
            '                            ..',
            '                            */',
            '                    "name",',
            '                    "prependLicenseText"',
            '                   /* multi-line comment',
            '                    ..',
            '                    */,',
            '                    {',
            '                        "name" : "some property", /* multi-line comment',
            '                        ..',
            '                        */',
            '                        "value" : "some value" // some value',
            '                        /* multi-line comment',
            '                        ..',
            '                        */',
            '                    }',
            '                ],',
            '                // one-line comment',
            '                "properties": { // one-line comment',
            '                    "name": {',
            '                        "type": "string",',
            '                        "description": "The name of the dependency" // one-line comment',
            '                    },',
            '                    "fullLicenseText": {',
            '                        "type": "array",',
            '                        "description": "The complete license text of the dependency",',
            '                        "items": {',
            '                            "type": "string"',
            '                            /* multi-line comment',
            '                            ..',
            '                            */',
            '                        },',
            '                        "array" : [',
            '                            {',
            '                                "key" : "value" /* multi-line comment',
            '                                ..',
            '                                */',
            '                            }',
            '                        ]',
            '                    },',
            '                    // one-line comment',
            '                    "prependLicenseText": {',
            '                        "type": "array", /* multi-line comment',
            '                        ..',
            '                        */',
            '                        "description": "A piece of text to prepend to the auto-detected license text of the dependency",',
            '                        /* multi-line comment',
            '                        ..',
            '                        */',
            '                        "items": {',
            '                            "type": "string"',
            '                        }',
            '                    }',
            '                }',
            '            },',
            '            {',
            '                "type": "object",',
            '                "required": [ // one-line comment',
            '                     "name",',
            '                    // one-line comment',
            '                    "fullLicenseText"',
            '                ],',
            '                "properties": {',
            '                    /* multi-line comment',
            '                    ..',
            '                    */',
            '                    "name": {',
            '                        "type": "string",',
            '                        "description": "The name of the dependency"',
            '                    },',
            '                    "fullLicenseText": {',
            '                        "type": "array",',
            '                        "description": "The complete license text of the dependency",',
            '                        "items": {',
            '                            "type": "string"',
            '                        }',
            '                    },',
            '                    /* multi-line comment',
            '                    ..',
            '                    */',
            '                    "prependLicenseText": {',
            '                        "type": "array",',
            '                        "description": "A piece of text to prepend to the auto-detected license text of the dependency", /* multi-line comment',
            '                        ..',
            '                        */',
            '                        "items": {',
            '                            "type": "string"',
            '                        }',
            '                    }',
            '                }',
            '            },',
            '            {',
            '                "type": "object",',
            '                "required": [',
            '                    "name",',
            '                    /* multi-line comment',
            '                    ..',
            '                    */',
            '                    "fullLicenseTextUri"',
            '                ],',
            '                "properties": {',
            '                    "name": {',
            '                        "type": "string", /* multi-line comment',
            '                        ..',
            '                        */',
            '                         "description": "The name of the dependency"',
            '                    },',
            '                    "fullLicenseTextUri": {',
            '                        "type": "string",',
            '                        "description": "The URI to the license text of this repository",',
            '                        "format": "uri" /* multi-line comment',
            '                        ..',
            '                        */',
            '                    },',
            '                    // one-line comment',
            '                    "prependLicenseText": { // one-line comment',
            '                        "type": "array",',
            '                        "description": "A piece of text to prepend to the auto-detected license text of the dependency",',
            '                        "items": {',
            '                            "type": "string"',
            '                        }',
            '                    } /* multi-line comment',
            '                    ..',
            '                    */',
            '                }',
            '            } /* multi-line comment',
            '            ..',
            '            */',
            '        ]',
            '    } // one-line comment',
            '}',
        ].join('\n');

        const expected = [
            '{',
            '  "items": {',
            '    /* multi-line comment',
            '        ..',
            '        */',
            '    "oneOf": [ /* multi-line comment',
            '                ..',
            '                */',
            '      {',
            '        // one-line comment',
            '        "properties": { // one-line comment',
            '          "fullLicenseText": {',
            '            "array": [',
            '              {',
            '                "key": "value" /* multi-line comment',
            '                                ..',
            '                                */',
            '              }',
            '            ],',
            '            "description": "The complete license text of the dependency",',
            '            "items": {',
            '              "type": "string"',
            '              /* multi-line comment',
            '                            ..',
            '                            */',
            '            },',
            '            "type": "array"',
            '          },',
            '          "name": {',
            '            "description": "The name of the dependency", // one-line comment',
            '            "type": "string"',
            '          },',
            '          // one-line comment',
            '          "prependLicenseText": {',
            '            "description": "A piece of text to prepend to the auto-detected license text of the dependency",',
            '            /* multi-line comment',
            '                        ..',
            '                        */',
            '            "items": {',
            '              "type": "string"',
            '            },',
            '            "type": "array" /* multi-line comment',
            '                        ..',
            '                        */',
            '          }',
            '        },',
            '        "required": [ /* multi-line comment',
            '                            ..',
            '                            */',
            '          "name",',
            '          "prependLicenseText"',
            '          /* multi-line comment',
            '                    ..',
            '                    */ ,',
            '          {',
            '            "name": "some property", /* multi-line comment',
            '                        ..',
            '                        */',
            '            "value": "some value" // some value',
            '            /* multi-line comment',
            '                        ..',
            '                        */',
            '          }',
            '        ],',
            '        "type": "object"',
            '      },',
            '      {',
            '        "properties": {',
            '          "fullLicenseText": {',
            '            "description": "The complete license text of the dependency",',
            '            "items": {',
            '              "type": "string"',
            '            },',
            '            "type": "array"',
            '          },',
            '          /* multi-line comment',
            '                    ..',
            '                    */',
            '          "name": {',
            '            "description": "The name of the dependency",',
            '            "type": "string"',
            '          },',
            '          /* multi-line comment',
            '                    ..',
            '                    */',
            '          "prependLicenseText": {',
            '            "description": "A piece of text to prepend to the auto-detected license text of the dependency", /* multi-line comment',
            '                        ..',
            '                        */',
            '            "items": {',
            '              "type": "string"',
            '            },',
            '            "type": "array"',
            '          }',
            '        },',
            '        "required": [ // one-line comment',
            '          "name",',
            '          // one-line comment',
            '          "fullLicenseText"',
            '        ],',
            '        "type": "object"',
            '      },',
            '      {',
            '        "properties": {',
            '          "fullLicenseTextUri": {',
            '            "description": "The URI to the license text of this repository",',
            '            "format": "uri", /* multi-line comment',
            '                        ..',
            '                        */',
            '            "type": "string"',
            '          },',
            '          "name": {',
            '            "description": "The name of the dependency",',
            '            "type": "string" /* multi-line comment',
            '                        ..',
            '                        */',
            '          },',
            '          // one-line comment',
            '          "prependLicenseText": { // one-line comment',
            '            "description": "A piece of text to prepend to the auto-detected license text of the dependency",',
            '            "items": {',
            '              "type": "string"',
            '            },',
            '            "type": "array"',
            '          } /* multi-line comment',
            '                    ..',
            '                    */',
            '        },',
            '        "required": [',
            '          "name",',
            '          /* multi-line comment',
            '                    ..',
            '                    */',
            '          "fullLicenseTextUri"',
            '        ],',
            '        "type": "object"',
            '      } /* multi-line comment',
            '            ..',
            '            */',
            '    ]',
            '  }, // one-line comment',
            '  "type": "array"',
            '}',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 4', () => {
        const content = [
            '/** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '// one line comment',
            '{',
            '    "version": "2.0.0",',
            '    "tasks": [ // one line comment',
            '        { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '            "type": "npm" /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */,',
            '            "script": "watch-clientd",',
            '            "label": "Core - Build", /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '            "isBackground": true,',
            '            // one line comment',
            '            "presentation": {',
            '                "reveal": "never",',
            '                "group": "buildWatchers", // one line comment',
            '                "close": false',
            '            },',
            '            "problemMatcher": {',
            '                "owner": "typescript",',
            '                "applyTo": "closedDocuments",',
            '                "fileLocation": [',
            '                    /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */',
            '                    "absolute"',
            '                ],',
            '                "pattern": {',
            '                    "regexp": "Error: ([^(]+)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\): (.*)$",',
            '                    "file": 1,',
            '                    "location": 2, /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */',
            '                    "message": 3',
            '                },',
            '                // one line comment',
            '                "background": {',
            '                    "beginsPattern": "Starting compilation...",',
            '                    "endsPattern": "Finished compilation with"',
            '                }',
            '            } // one line comment',
            '        },',
            '        { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '            "type": "npm",',
            '            "script": "watch-extensionsd",',
            '            "label": "Ext - Build",',
            '            "isBackground": true,',
            '            "presentation": {',
            '                "reveal": "never",',
            '                "group": "buildWatchers",',
            '                "close": false',
            '            },',
            '            "problemMatcher": {',
            '                "owner": "typescript",',
            '                "applyTo": "closedDocuments",',
            '                "fileLocation": [ // one line comment',
            '                    "absolute"',
            '                ],',
            '                "pattern": { /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */',
            '                    "regexp": "Error: ([^(]+)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\): (.*)$",',
            '                    "file": 1,',
            '                    "location": 2,',
            '                    "message": 3',
            '                },',
            '                "background": {',
            '                    "beginsPattern": "Starting compilation",',
            '                    "endsPattern": "Finished compilation"',
            '                }',
            '            }',
            '        }',
            '    ]',
            '}',
            '',
            '/** multi-line or block comment',
            '...',
            '...',
            '*/',
        ].join('\n');

        const expected = [
            '/** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '// one line comment',
            '{',
            '  "tasks": [ // one line comment',
            '    { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '      "isBackground": true,',
            '      "label": "Core - Build", /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '      // one line comment',
            '      "presentation": {',
            '        "close": false,',
            '        "group": "buildWatchers", // one line comment',
            '        "reveal": "never"',
            '      },',
            '      "problemMatcher": {',
            '        "applyTo": "closedDocuments",',
            '        // one line comment',
            '        "background": {',
            '          "beginsPattern": "Starting compilation...",',
            '          "endsPattern": "Finished compilation with"',
            '        },',
            '        "fileLocation": [',
            '          /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */',
            '          "absolute"',
            '        ],',
            '        "owner": "typescript",',
            '        "pattern": {',
            '          "file": 1,',
            '          "location": 2, /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */',
            '          "message": 3,',
            '          "regexp": "Error: ([^(]+)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\): (.*)$"',
            '        }',
            '      }, // one line comment',
            '      "script": "watch-clientd",',
            '      "type": "npm" /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '    },',
            '    { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '      "isBackground": true,',
            '      "label": "Ext - Build",',
            '      "presentation": {',
            '        "close": false,',
            '        "group": "buildWatchers",',
            '        "reveal": "never"',
            '      },',
            '      "problemMatcher": {',
            '        "applyTo": "closedDocuments",',
            '        "background": {',
            '          "beginsPattern": "Starting compilation",',
            '          "endsPattern": "Finished compilation"',
            '        },',
            '        "fileLocation": [ // one line comment',
            '          "absolute"',
            '        ],',
            '        "owner": "typescript",',
            '        "pattern": { /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */',
            '          "file": 1,',
            '          "location": 2,',
            '          "message": 3,',
            '          "regexp": "Error: ([^(]+)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\): (.*)$"',
            '        }',
            '      },',
            '      "script": "watch-extensionsd",',
            '      "type": "npm"',
            '    }',
            '  ],',
            '  "version": "2.0.0"',
            '}',
            '/** multi-line or block comment',
            '...',
            '...',
            '*/',
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 5', () => {
        const content = [
            '{ /** multi-line or block comment',
            '...',
            '...',
            '*/',
            '    "registrations": [ /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '        { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '            "component": { /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '                "type": "git",',
            '                "git": {',
            '                    "name": "textmate/markdown.tmbundle" /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */,',
            '                    "repositoryUrl": /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */ "https://github.com/textmate/markdown.tmbundle",',
            '                    "commitHash": /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */ "11cf764606cb2cde54badb5d0e5a0758a8871c4b"',
            '                }',
            '            },',
            '            "licenseDetail": /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */ [ /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '                "Copyright (c) markdown.tmbundle authors",',
            '                "" /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */,',
            '                "If not otherwise specified (see below), files in this repository fall under the following license:",',
            '                "" /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */,',
            '                "Permission to copy, use, modify, sell and distribute this", /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */',
            '                "",',
            '                "An exception is made for files in readable text which contain their own license information,",',
            '                "or files where an accompanying file exists (in the same directory) with a \"-license\" suffix added",',
            '                "to the base-name name of the original file, and an extension of txt, html, or similar. For example",',
            '                "\"tidy\" is accompanied by \"tidy-license.txt\"."',
            '            ] /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */,',
            '            "license": "TextMate Bundle License",',
            '            "version": "0.0.0"',
            '        } /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */,',
            '',
            '        /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '        {',
            '            "component": {',
            '                "type": "git",',
            '                "git": {',
            '                    "name": "microsoft/vscode-markdown-tm-grammar",',
            '                    "repositoryUrl": "https://github.com/microsoft/vscode-markdown-tm-grammar",',
            '                    "commitHash": "443261e8f75b2eaa8b36a2613fe7c4354208260a"',
            '                }',
            '            },',
            '            /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '            "license": "MIT",',
            '            "version": "1.0.0"',
            '        }',
            '    ],',
            '    "version": 1',
            '} /** multi-line or block comment',
            '...',
            '...',
            '*/'
        ].join('\n');

        const expected = [
            '{ /** multi-line or block comment',
            '...',
            '...',
            '*/',
            '  "registrations": [ /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '    { /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */',
            '      "component": { /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '        "git": {',
            '          "commitHash": /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */ "11cf764606cb2cde54badb5d0e5a0758a8871c4b",',
            '          "name": "textmate/markdown.tmbundle" /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */,',
            '          "repositoryUrl": /** multi-line or block comment',
            '                    ...',
            '                    ...',
            '                    */ "https://github.com/textmate/markdown.tmbundle"',
            '        },',
            '        "type": "git"',
            '      },',
            '      "license": "TextMate Bundle License",',
            '      "licenseDetail": /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */ [ /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */',
            '        "Copyright (c) markdown.tmbundle authors",',
            '        "" /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */,',
            '        "If not otherwise specified (see below), files in this repository fall under the following license:",',
            '        "" /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */,',
            '        "Permission to copy, use, modify, sell and distribute this", /** multi-line or block comment',
            '                ...',
            '                ...',
            '                */',
            '        "",',
            '        "An exception is made for files in readable text which contain their own license information,",',
            '        "or files where an accompanying file exists (in the same directory) with a \"-license\" suffix added",',
            '        "to the base-name name of the original file, and an extension of txt, html, or similar. For example",',
            '        "\"tidy\" is accompanied by \"tidy-license.txt\"."',
            '      ] /** multi-line or block comment',
            '            ...',
            '            ...',
            '            */,',
            '      "version": "0.0.0"',
            '    } /** multi-line or block comment',
            '        ...',
            '        ...',
            '        */,',
            '    /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '    {',
            '      "component": {',
            '        "git": {',
            '          "commitHash": "443261e8f75b2eaa8b36a2613fe7c4354208260a",',
            '          "name": "microsoft/vscode-markdown-tm-grammar",',
            '          "repositoryUrl": "https://github.com/microsoft/vscode-markdown-tm-grammar"',
            '        },',
            '        "type": "git"',
            '      },',
            '      /** multi-line or block comment',
            '    ...',
            '    ...',
            '    */',
            '      "license": "MIT",',
            '      "version": "1.0.0"',
            '    }',
            '  ],',
            '  "version": 1',
            '} /** multi-line or block comment',
            '...',
            '...',
            '*/'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a complicated JSONC object 6', () => {
        const content = [
            '{',
            '    "tsImportSorter.configuration.groupRules": [',
            '        [{ "builtin": true }, "^[@][^/]", {}],',
            '        [',
            '            "^@(/|$)",',
            '            "^apis?(/|$)",',
            '            "^assets(/|$)",',
            '            "^components?(/|$)",',
            '            "^pages?(/|$)",',
            '            "^slices?(/|$)",',
            '            "^store(/|$)",',
            '            "^typings?(/|$)",',
            '            "^utils(/|$)"',
            '        ],',
            '        { "flags": "named", "regex": "^[.]" },',
            '        [{ "flags": "scripts" }, { "flags": "scripts", "regex": "[.]((css)|(less)|(scss))$" }]',
            '    ]',
            '}',
        ].join('\n');

        const expected = [
            '{',
            '  "tsImportSorter.configuration.groupRules": [',
            '    [',
            '      {',
            '        "builtin": true',
            '      },',
            '      "^[@][^/]",',
            '      {}',
            '    ],',
            '    [',
            '      "^@(/|$)",',
            '      "^apis?(/|$)",',
            '      "^assets(/|$)",',
            '      "^components?(/|$)",',
            '      "^pages?(/|$)",',
            '      "^slices?(/|$)",',
            '      "^store(/|$)",',
            '      "^typings?(/|$)",',
            '      "^utils(/|$)"',
            '    ],',
            '    {',
            '      "flags": "named",',
            '      "regex": "^[.]"',
            '    },',
            '    [',
            '      {',
            '        "flags": "scripts"',
            '      },',
            '      {',
            '        "flags": "scripts",',
            '        "regex": "[.]((css)|(less)|(scss))$"',
            '      }',
            '    ]',
            '  ]',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting a JSON object with mixed case keys', () => {
        const content = [
            '{',
            '  "tEst": "tEst",',
            '  "tesT": "tesT",',
            '  "teSt": "teSt",',
            '  "Test": "Test",',
            '  "test": "test"',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "test": "test",',
            '  "tesT": "tesT",',
            '  "teSt": "teSt",',
            '  "tEst": "tEst",',
            '  "Test": "Test"',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('sorting an already sorted JSON object with mixed case keys', () => {
        const content = [
            '{',
            '  "test": "test",',
            '  "tesT": "tesT",',
            '  "teSt": "teSt",',
            '  "tEst": "tEst",',
            '  "Test": "Test"',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "test": "test",',
            '  "tesT": "tesT",',
            '  "teSt": "teSt",',
            '  "tEst": "tEst",',
            '  "Test": "Test"',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });


    test('sorting symbols before letters', () => {
        const content = [
            '{',
            '  "Test": "Test",',
            '  "test": "test",',
            '  "[test]: "test',
            '}'
        ].join('\n');

        const expected = [
            '{',
            '  "[test]: "test,',
            '  "test": "test",',
            '  "Test": "Test"',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });

    test('Sort JSON5 mixed object keys', () => {
        const content = [
            '{',
            '  bbbb: "bbbb",  ',
            "  'aaaa': 'tEst',",
            '  "cccc": "tesT",',
            '}'
        ].join('\n');

        const expected = [
            '{',
            "  'aaaa': 'tEst',",
            '  bbbb: "bbbb",',
            '  "cccc": "tesT"',
            '}'
        ].join('\n');

        testSort(content, expected, formattingOptions);
    });
});
