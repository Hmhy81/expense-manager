import { Service } from 'node-windows'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const svc = new Service({
  name: 'ExpenseManagerServer',
  script: path.join(__dirname, 'build', 'bin', 'server.js')
})

svc.on('uninstall', () => {
  console.log('ExpenseManagerServer Windows Service uninstalled.')
})

svc.uninstall()

