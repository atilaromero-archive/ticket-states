'use strict'

const TicketStates = require('./index')
const EventEmitter = require('events')

const emitter = new EventEmitter()

const readMessageSync = (message) => {
  return {
    event: message.event,
    instanceid: message.details.instance
  }
}
const postMessage = (event, self, callback) => {
  emitter.emit('message', {
    event: event,
    details: {
      chair: self.chair,
      instance: self.instanceid
    }
  })
}

class MyStates extends TicketStates {
  constructor (chair) {
    super(readMessageSync, postMessage)
    this.chair = chair
    emitter.on('message', (message) => {
      if (message.details.chair === this.chair) {
        this[message.event](message)
      }
    })
    this.init()
  }
}

const a1 = new MyStates('A')
const a2 = new MyStates('A')
const a3 = new MyStates('A')
const b4 = new MyStates('B')
setTimeout(() => {
  console.log('a1', a1.getMachineState())
  console.log('a2', a2.getMachineState())
  console.log('a3', a3.getMachineState())
  console.log('b4', b4.getMachineState())
}, 5000)
