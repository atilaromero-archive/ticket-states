'use strict'

const debug = require('debug')('ticket-states:states')
const Stately = require('stately.js')
const uniqid = require('uniqid')

class TicketStates extends Stately {
  constructor (readMessageSync, postMessage) {
    super({
      'ENABLED': {
        'ticket enabled': 'ENABLED',
        'ticket reserving': (message) => {
          const details = readMessageSync(message)
          debug(details)
          this.reserving.push(details.instanceid)
          return 'RESERVING'
        }
      },
      'RESERVING': {
        'ticket reserving': (message) => {
          const details = readMessageSync(message)
          debug(details)
          this.reserving.push(details.instanceid)
          return 'OTHERS'
        },
        'ticket giveup': (message) => {
          const details = readMessageSync(message)
          debug(details)
          this.reserving = this.reserving.filter((x) => x !== details.instanceid)
          if (this.reserving.length === 0) {
            return 'ENABLED'
          }
        },
        'ticket claim': (message) => {
          const mine = (
            this.reserving.length === 1 &&
            this.reserving[0] === this.instanceid
          )
          if (mine) {
            return 'MINE'
          } else {
            return 'OTHERS'
          }
        }
      },
      'MINE': {
        'ticket failed': (message) => {
          const details = readMessageSync(message)
          debug(details)
          this.reserving = this.reserving.filter((x) => x !== details.instanceid)
          if (this.reserving.length === 0) {
            return 'FAILED'
          }
        },
        'ticket done': 'DONE'
      },
      'OTHERS': {
        'ticket failed': (message) => {
          const details = readMessageSync(message)
          debug(details)
          this.reserving = this.reserving.filter((x) => x !== details.instanceid)
          if (this.reserving.length === 0) {
            return 'FAILED'
          }
        },
        'ticket done': 'DONE'
      },
      'DONE': {},
      'FAILED': {
        'ticket tryagain': 'ENABLED'
      }
    })
    this.reserving = []
    this.instanceid = uniqid()
    this.init = () => {
      const waitTime = Math.random() * this.waitTime + this.waitTime
      this.waitUnchanged(waitTime, (err) => {
        if (err) { return }
        postMessage('ticket reserving', this)
      })
    }
    this.bind((event, oldState, newState) => {
      debug({event: event, oldState: oldState, newState: newState})
    })
    this.bind((event, oldState, newState) => {
      if (newState === 'ENABLED') {
        this.init()
      }
    })
    this.bind((event, oldState, newState) => {
      const itsForMe = (
        newState === 'RESERVING' &&
        this.reserving.length === 1 &&
        this.reserving[0] === this.instanceid
      )
      if (itsForMe) {
        // wait a second to see if there are other candidates
        this.waitUnchanged(this.waitTime, (err) => {
          if (err) {
            return postMessage('ticket giveup', this)
          } else {
            debug('got ticket', this.instanceid)
            return postMessage('ticket claim', this)
          }
        })
      }
    })
    this.waitUnchanged = (milisec, callback) => {
      let unchanged = true
      function inner (event, oldState, newState) {
        unchanged = false
      }
      this.bind(inner)
      setTimeout(() => {
        this.unbind(inner)
        if (unchanged) {
          callback(null)
        } else {
          callback(new Error('State changed'))
        }
      }, milisec)
    }
    this.waitTime = 1000
  }
}

module.exports = TicketStates
