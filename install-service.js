import { Service } from 'node-windows'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const svc = new Service({
  name: 'ExpenseManagerServer',
  description: 'Expense Manager AdonisJS Server on Port 3333',
  script: path.join(__dirname, 'build', 'bin', 'server.js'),
  env: [{
    name: 'NODE_ENV',
    value: 'production'
  }, {
    name: 'HOST',
    value: '0.0.0.0'
  }, {
    name: 'PORT',
    value: '3333'
  }]
})

svc.on('install', () => {
  console.log('Service installed successfully!')
  svc.start()
})

svc.on('alreadyinstalled', () => {
  console.log('Service already installed, starting...')
  svc.start()
})

svc.on('start', () => {
  console.log('Service started!')
})

svc.install()

