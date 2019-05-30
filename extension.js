const uuidv4 = require('uuid/v4');
const vscode = require('vscode');

const pythonTerminalName = 'Docker-IPython';
let pythonTerminal = null;
let textQueue = [];
let waitsQueue = [];
let currentFilename = null;
let uuid = null;

function createPythonTerminal() {
    textQueue = [];
    waitsQueue = [];
    pythonTerminal = vscode.window.createTerminal(pythonTerminalName);
    uuid = 'docker-ipython-' + uuidv4().substring(0,8);
    sendQueuedText(`docker build . -t ${uuid}`, 1500);
    sendQueuedText(`docker run -v \${HOME}/.aws:/root/.aws:ro -v \${PWD}:/docker-ipython -w /docker-ipython -e DIP_PWD=\${PWD} -it ${uuid} /bin/bash`, 1500);
    sendQueuedText('pip install ipython', 1500);
    sendQueuedText('ipython', 1500);
    sendQueuedText('import os');
    sendQueuedText('DIP_PWD = os.environ["DIP_PWD"]');
}

function removePythonTerminal() {
    pythonTerminal = null;
    currentFilename = null;
    textQueue = [];
    waitsQueue = [];
    var terminal = vscode.window.createTerminal(pythonTerminalName + '-close');
    terminal.sendText(`docker rm $(docker stop $(docker ps -a -q --filter ancestor=${uuid} --format="{{.ID}}"))`);
    terminal.dispose();
}

function sendQueuedText(text, waitTime = 50) {
    textQueue.push(text);
    waitsQueue.push(waitTime);
}

function queueLoop() {
    if (textQueue.length > 0 && pythonTerminal !== null && pythonTerminal._queuedRequests.length === 0) {
        const text = textQueue.shift();
        const waitTime = waitsQueue.shift();
        pythonTerminal.sendText(text);
        setTimeout(queueLoop, waitTime);
    } else {
        setTimeout(queueLoop, 50);
    }
}

function updateFilename(filename) {
    currentFilename = filename;
    sendQueuedText(`__file__ = '${filename}'.replace(DIP_PWD, '')`);
    sendQueuedText('if __file__.startswith("/"): __file__ = __file__[1:]')
}


function activate(context) {
    vscode.window.onDidCloseTerminal(function (event) {
        if (event.name === pythonTerminalName) {
            removePythonTerminal();
        }
    });

    queueLoop();

    let sendSelectedToIPython = vscode.commands.registerCommand('docker-ipython.sendSelectedToIPython', function () {
        if (pythonTerminal === null) {
            createPythonTerminal();
        }
        const editor = vscode.window.activeTextEditor;
        const filename = editor.document.fileName;
        if (filename !== currentFilename) {
            updateFilename(filename);
        }

        let startLine, endLine;
        if (editor.selection.isEmpty) {
            startLine = editor.selection.active.line + 1
            endLine = startLine;
        } else {
            startLine = editor.selection.start.line + 1;
            endLine = editor.selection.end.line + 1;
        }

        const command = `%load -r ${startLine}-${endLine} $__file__`;
        sendQueuedText(command);
        sendQueuedText('\n\n');
        pythonTerminal.show();
    });

    let sendFileContentsToIPython = vscode.commands.registerCommand('docker-ipython.sendFileContentsToIPython', function () {
        if (pythonTerminal === null) {
            createPythonTerminal();
        }

        const editor = vscode.window.activeTextEditor;
        const filename = editor.document.fileName;
        if (filename !== currentFilename) {
            updateFilename(filename);
        }

        sendQueuedText('%load $__file__', 100);
        sendQueuedText('\n\n');
        pythonTerminal.show();
    });

    context.subscriptions.push(sendSelectedToIPython);
    context.subscriptions.push(sendFileContentsToIPython);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;