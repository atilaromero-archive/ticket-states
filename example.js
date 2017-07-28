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
    this.onMINE = () => {
      console.log(chair, 'MINE')
      a1.enabled = a2.enabled = a3.enabled = b4.enabled = false
      this['ticket done']()
    }
    this.onOTHERS = () => { console.log(chair, 'OTHERS') }
    this.onDONE = () => {
      setTimeout(() => {
        a1.enable()
        a2.enable()
        a3.enable()
        b4.enable()
      }, 2000)
    }
  }
}

const a1 = new MyStates('A')
const a2 = new MyStates('A')
const a3 = new MyStates('A')
const b4 = new MyStates('B')
a1.enable()
a2.enable()
a3.enable()
b4.enable()
