'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
let languages = [];
for (let l of ['cpp', 'c', 'objective-c', 'objective-cpp', 'java', 'javascript', 'typescript', 'proto', 'apex']) {
    if (vscode.workspace.getConfiguration('clang-format').get('language.' + l + '.enable')) {
        languages.push(l);
    }
}
exports.MODES = languages.map((language) => ({ language, scheme: 'file' }));
//# sourceMappingURL=clangMode.js.map