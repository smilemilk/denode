// Override process.exit
process.exit = function() { }

const FS = require('fs')
const Path = require('path')
const IPC = require('electron').ipcRenderer

IPC.once('setup', function(_, data) {
  const parsed = JSON.parse(data)
  process.argv = parsed.argv
  Object.assign(process.stdout, parsed.stdout)
  Object.assign(process.stderr, parsed.stderr)
  process.stdout._write = function(chunk, _, callback) {
    process.nextTick(callback)
    IPC.send('stdout', chunk.toString())
  }
  process.stderr._write = function(chunk, _, callback) {
    process.nextTick(callback)
    IPC.send('stderr', chunk.toString())
  }
  IPC.on('stdin', function(_, data) {
    process.stdin.push(data)
  })
  __dirname = process.cwd()
  __filename = Path.join(__dirname, 'denode')
  module.filename = __filename
  const App = parsed.request
  if (!App) {
    console.warn('No application specified')
  } else {
    const resolvedPath = FS.realpathSync(Path.resolve(process.cwd(), App))
    console.log('export of main file', require(resolvedPath))
  }
})
