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
    log('🔌 New SSE connection established')
    log('Request headers:', req.headers)

    // Set response headers
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Accel-Buffering', 'no')
    // Disable compression for this route
    res.setHeader('Content-Encoding', 'identity')

    // Send headers immediately
    res.flushHeaders()
    log('✅ Headers sent')

    // Send initial comment to establish stream
    res.write(':connected\n\n')
    log('✅ Connection comment sent')

    clients.push(res)
    log(`Active connections: ${clients.length}`)

    // Send current state immediately after a tiny delay to ensure stream is ready
    setImmediate(() => {
      const initialData = `data: ${JSON.stringify(betslipState)}\n\n`
      log(`Sending initial state: ${initialData.substring(0, 100)}...`)
      try {
        res.write(initialData)
        log('✅ Initial state written to stream')
      } catch (e) {
        log('❌ Failed to write initial state:', e.message)
      }
    })

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
    log(`📡 Broadcasting to ${clients.length} clients`)
    log(`📡 Message being sent:`, message.substring(0, 200))

    clients.forEach((client, index) => {
      try {
        client.write(message)
        log(`✅ Sent to client ${index}`)
      } catch (e) {
        log(`❌ Failed to send to client ${index}:`, e.message)
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
