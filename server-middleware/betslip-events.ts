import { ServerResponse, IncomingMessage } from 'http'

interface Bet {
  id: string
  name: string
  odds: number
  stake: number
}

interface BetslipState {
  bets: Bet[]
  totalStake: number
  potentialWin: number
}

interface BetslipAction {
  bet?: Bet
  betId?: string
  stake?: number
}

type NextFunction = () => void

class BetslipManager {
  private static instance: BetslipManager
  private clients: ServerResponse[] = []
  private state: BetslipState = {
    bets: [],
    totalStake: 0,
    potentialWin: 0
  }
  private readonly DEBUG = true

  private constructor() {
  }

  public static getInstance(): BetslipManager {
    if (!BetslipManager.instance) {
      BetslipManager.instance = new BetslipManager()
    }
    return BetslipManager.instance
  }

  private log(...args: unknown[]): void {
    if (this.DEBUG) console.log('[Betslip SSE]', ...args)
  }

  private broadcastToClients(): void {
    const message = `data: ${JSON.stringify(this.state)}\n\n`
    this.log(`📡 Broadcasting to ${this.clients.length} clients`)
    this.log(`📡 Message being sent:`, message.substring(0, 200))

    this.clients.forEach((client, index) => {
      try {
        client.write(message)
        this.log(`✅ Sent to client ${index}`)
      } catch (e) {
        this.log(`❌ Failed to send to client ${index}:`, (e as Error).message)
      }
    })
  }

  private calculateTotals(): void {
    this.state.totalStake = this.state.bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    this.state.potentialWin = this.state.bets.reduce((total, bet) => {
      return total + ((bet.stake || 0) * (bet.odds || 0))
    }, 0)
  }

  private addClient(res: ServerResponse): void {
    this.clients.push(res)
    this.log(`Active connections: ${this.clients.length}`)
  }

  private removeClient(res: ServerResponse): void {
    const index = this.clients.indexOf(res)
    if (index !== -1) {
      this.clients.splice(index, 1)
      this.log(`Client disconnected. Active connections: ${this.clients.length}`)
    }
  }

  public handleSSEStream(req: IncomingMessage, res: ServerResponse): void {
    this.log('🔌 New SSE connection established')
    this.log('Request headers:', req.headers)

    // Set response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity'
    })
    this.log('✅ Headers sent')

    // Send initial comment to establish stream
    res.write(':connected\n\n')
    this.log('✅ Connection comment sent')

    this.addClient(res)

    // Send current state immediately after a tiny delay to ensure stream is ready
    setImmediate(() => {
      const initialData = `data: ${JSON.stringify(this.state)}\n\n`
      this.log(`Sending initial state: ${initialData.substring(0, 100)}...`)
      try {
        res.write(initialData)
        this.log('✅ Initial state written to stream')
      } catch (e) {
        this.log('❌ Failed to write initial state:', (e as Error).message)
      }
    })

    // Send a heartbeat every 15 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n')
    }, 15000)

    // Handle disconnect
    req.on('close', () => {
      clearInterval(heartbeat)
      this.removeClient(res)
    })
  }

  public addBet(bet: Bet): void {
    this.log('Adding bet:', bet)
    this.state.bets.push(bet)
    this.calculateTotals()
    this.broadcastToClients()
  }

  public removeBet(betId: string): void {
    this.log('Removing bet:', betId)
    this.state.bets = this.state.bets.filter(b => b.id !== betId)
    this.calculateTotals()
    this.broadcastToClients()
  }

  public updateStake(betId: string, stake: number): void {
    this.log('Updating stake for bet:', betId, 'to:', stake)
    const bet = this.state.bets.find(b => b.id === betId)
    if (bet) {
      bet.stake = stake
      this.calculateTotals()
      this.broadcastToClients()
    }
  }

  public submitBetslip(): void {
    this.log('Submitting betslip:', this.state)
    this.state.bets = []
    this.calculateTotals()
    this.broadcastToClients()
  }

  public clearBetslip(): void {
    this.log('Clearing betslip')
    this.state.bets = []
    this.calculateTotals()
    this.broadcastToClients()
  }

  public getState(): BetslipState {
    return { ...this.state }
  }

  public handleBetslipAction(req: IncomingMessage, res: ServerResponse): void {
    let body = ''

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const data: BetslipAction = body ? JSON.parse(body) : {}

        // Handle different actions
        if (req.url === '/api/betslip/add' && data.bet) {
          this.addBet(data.bet)
        }
        else if (req.url === '/api/betslip/remove' && data.betId) {
          this.removeBet(data.betId)
        }
        else if (req.url === '/api/betslip/update-stake' && data.betId && data.stake !== undefined) {
          this.updateStake(data.betId, data.stake)
        }
        else if (req.url === '/api/betslip/submit') {
          this.submitBetslip()
        }
        else if (req.url === '/api/betslip/clear') {
          this.clearBetslip()
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(JSON.stringify({ success: true, state: this.state }))
      } catch (error) {
        this.log('Error processing request:', (error as Error).message)
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(JSON.stringify({ success: false, error: (error as Error).message }))
      }
    })
  }

  public handleOptionsRequest(res: ServerResponse): void {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end()
  }

  public handleNotFound(res: ServerResponse): void {
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }))
  }
}

export default function betslipEventsMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction
): void {
  const manager = BetslipManager.getInstance()

  // Only handle /api/betslip/* routes
  if (!req.url?.startsWith('/api/betslip')) {
    return next()
  }

  // SSE Stream endpoint
  if (req.url === '/api/betslip/stream' && req.method === 'GET') {
    manager.handleSSEStream(req, res)
    return
  }

  // Handle all betslip actions
  if (req.url.startsWith('/api/betslip/') && req.method === 'POST') {
    manager.handleBetslipAction(req, res)
    return
  }

  // OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    manager.handleOptionsRequest(res)
    return
  }

  // Unknown endpoint
  manager.handleNotFound(res)
}
