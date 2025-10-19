// SSE-based Real-time Betslip Synchronization
// Based on the betslip_sync_guide.md implementation

const clients = []
let betslipState = {
  bets: [],
  totalStake: 0,
  potentialWin: 0
}

const DEBUG = true

function log(...args) {
  if (DEBUG) console.log('[Betslip SSE]', ...args)
}

export default function (req, res, next) {
  // Only handle /api/betslip/* routes
  if (!req.url.startsWith('/api/betslip')) {
    return next()
  }

  // SSE Stream endpoint
  if (req.url === '/api/betslip/stream' && req.method === 'GET') {
    log('New SSE connection established')

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Disable buffering for nginx
    })

    // Ensure response is writable
    res.flushHeaders()

    clients.push(res)
    log(`Active connections: ${clients.length}`)

    // Send current state immediately
    const initialData = `data: ${JSON.stringify(betslipState)}\n\n`
    log(`Sending initial state: ${initialData.substring(0, 100)}...`)
    res.write(initialData)

    // Send a heartbeat every 15 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n')
    }, 15000)

    // Handle disconnect
    req.on('close', () => {
      clearInterval(heartbeat)
      const index = clients.indexOf(res)
      if (index !== -1) {
        clients.splice(index, 1)
        log(`Client disconnected. Active connections: ${clients.length}`)
      }
    })

    return
  }

  // Helper function to broadcast updates
  function broadcastToClients(state) {
    const message = `data: ${JSON.stringify(state)}\n\n`
    log(`Broadcasting to ${clients.length} clients`)

    clients.forEach((client, index) => {
      try {
        client.write(message)
      } catch (e) {
        log(`Failed to send to client ${index}:`, e.message)
      }
    })
  }

  // Helper function to calculate totals
  function calculateTotals() {
    betslipState.totalStake = betslipState.bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    betslipState.potentialWin = betslipState.bets.reduce((total, bet) => {
      return total + ((bet.stake || 0) * (bet.odds || 0))
    }, 0)
  }

  // Handle all betslip actions
  if (req.url.startsWith('/api/betslip/') && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {}

        // Handle different actions
        if (req.url === '/api/betslip/add') {
          log('Adding bet:', data.bet)
          betslipState.bets.push(data.bet)
        }
        else if (req.url === '/api/betslip/remove') {
          log('Removing bet:', data.betId)
          betslipState.bets = betslipState.bets.filter(b => b.id !== data.betId)
        }
        else if (req.url === '/api/betslip/update-stake') {
          log('Updating stake for bet:', data.betId, 'to:', data.stake)
          const bet = betslipState.bets.find(b => b.id === data.betId)
          if (bet) bet.stake = data.stake
        }
        else if (req.url === '/api/betslip/submit') {
          log('Submitting betslip:', betslipState)
          // Handle submission logic
          // Maybe call another service, save to DB, etc.
          // For now, clear after submission
          betslipState.bets = []
        }
        else if (req.url === '/api/betslip/clear') {
          log('Clearing betslip')
          betslipState.bets = []
        }

        // Recalculate totals
        calculateTotals()

        // Broadcast updated state to ALL connected clients
        broadcastToClients(betslipState)

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(JSON.stringify({ success: true, state: betslipState }))
      } catch (error) {
        log('Error processing request:', error.message)
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(JSON.stringify({ success: false, error: error.message }))
      }
    })
    return
  }

  // OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end()
    return
  }

  // Unknown endpoint
  res.writeHead(404, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }))
}
