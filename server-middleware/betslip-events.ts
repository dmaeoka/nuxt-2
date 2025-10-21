import { ServerResponse, IncomingMessage } from 'http'
import { URL } from 'url'

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

interface ClientConnection {
  response: ServerResponse
  sessionId: string
}

type NextFunction = () => void

class BetslipManager {
  private static instance: BetslipManager
  private clients: ClientConnection[] = []
  private sessionStates: Map<string, BetslipState> = new Map()
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

  private getOrCreateSessionState(sessionId: string): BetslipState {
    if (!this.sessionStates.has(sessionId)) {
      this.sessionStates.set(sessionId, {
        bets: [],
        totalStake: 0,
        potentialWin: 0
      })
      this.log(`🆕 Created new session state for: ${sessionId}`)
    }
    return this.sessionStates.get(sessionId)!
  }

  private broadcastToSession(sessionId: string): void {
    const state = this.getOrCreateSessionState(sessionId)
    const message = `data: ${JSON.stringify(state)}\n\n`
    const sessionClients = this.clients.filter(c => c.sessionId === sessionId)

    this.log(`📡 Broadcasting to ${sessionClients.length} clients in session ${sessionId}`)
    this.log(`📡 Message being sent:`, message.substring(0, 200))

    sessionClients.forEach((client, index) => {
      try {
        client.response.write(message)
        this.log(`✅ Sent to client ${index} in session ${sessionId}`)
      } catch (e) {
        this.log(`❌ Failed to send to client ${index}:`, (e as Error).message)
      }
    })
  }

  private calculateTotals(state: BetslipState): void {
    state.totalStake = state.bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    state.potentialWin = state.bets.reduce((total, bet) => {
      return total + ((bet.stake || 0) * (bet.odds || 0))
    }, 0)
  }

  private addClient(res: ServerResponse, sessionId: string): void {
    this.clients.push({ response: res, sessionId })
    this.log(`Active connections: ${this.clients.length} (session: ${sessionId})`)
  }

  private removeClient(res: ServerResponse): void {
    const index = this.clients.findIndex(c => c.response === res)
    if (index !== -1) {
      const sessionId = this.clients[index].sessionId
      this.clients.splice(index, 1)
      this.log(`Client disconnected. Active connections: ${this.clients.length} (session: ${sessionId})`)
    }
  }

  private extractSessionId(req: IncomingMessage): string | null {
    const cookieHeader = req.headers.cookie
    let sessionId: string | null = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const sessionCookie = cookies.find(c => c.startsWith('betslip_session_id='))
      if (sessionCookie) {
        const sessionId = sessionCookie.split('=')[1]
        this.log('🍪 Found session ID in cookie:', sessionId)
      }
    }
    return sessionId
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private getCorsOrigin(req: IncomingMessage): string {
    const origin = req.headers.origin
    // Allow all origins in development, or specify allowed origins
    return origin || '*'
  }

  public handleSSEStream(req: IncomingMessage, res: ServerResponse): void {
    this.log('🔌 New SSE connection established')
    let sessionId = this.extractSessionId(req)
    const isNewSession = !sessionId

    if (!sessionId) {
      sessionId = this.generateSessionId()
      this.log('🆕 Generated new session ID:', sessionId)
    } else {
      this.log(`♻️ Using existing session ID: ${sessionId}`)
    }

    const corsOrigin = this.getCorsOrigin(req)

    // Prepare cookie header - session cookie (no Max-Age = expires when browser closes)
    // Only set cookie if it's a new session to avoid updating on every request
    const cookieValue = `betslip_session_id=${sessionId}; Path=/; SameSite=Lax`

    // Set response headers (must include Set-Cookie BEFORE writeHead)
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity'
    }

    // Only set cookie if it's a new session
    if (isNewSession) {
      headers['Set-Cookie'] = cookieValue
      this.log('🍪 Set new session cookie:', sessionId)
    }

    res.writeHead(200, headers)
    this.log('✅ Headers sent')

    // Send initial comment to establish stream
    res.write(':connected\n\n')
    this.log('✅ Connection comment sent')

    this.addClient(res, sessionId)

    // Send current state immediately after a tiny delay to ensure stream is ready
    setImmediate(() => {
      const state = this.getOrCreateSessionState(sessionId)
      const initialData = `data: ${JSON.stringify(state)}\n\n`
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

  public addBet(sessionId: string, bet: Bet): void {
    this.log(`Adding bet to session ${sessionId}:`, bet)
    const state = this.getOrCreateSessionState(sessionId)
    state.bets.push(bet)
    this.calculateTotals(state)
    this.broadcastToSession(sessionId)
  }

  public removeBet(sessionId: string, betId: string): void {
    this.log(`Removing bet from session ${sessionId}:`, betId)
    const state = this.getOrCreateSessionState(sessionId)
    state.bets = state.bets.filter(b => b.id !== betId)
    this.calculateTotals(state)
    this.broadcastToSession(sessionId)
  }

  public updateStake(sessionId: string, betId: string, stake: number): void {
    this.log(`Updating stake for bet in session ${sessionId}:`, betId, 'to:', stake)
    const state = this.getOrCreateSessionState(sessionId)
    const bet = state.bets.find(b => b.id === betId)
    if (bet) {
      bet.stake = stake
      this.calculateTotals(state)
      this.broadcastToSession(sessionId)
    }
  }

  public submitBetslip(sessionId: string): void {
    const state = this.getOrCreateSessionState(sessionId)
    this.log(`Submitting betslip for session ${sessionId}:`, state)
    state.bets = []
    this.calculateTotals(state)
    this.broadcastToSession(sessionId)
  }

  public clearBetslip(sessionId: string): void {
    this.log(`Clearing betslip for session ${sessionId}`)
    const state = this.getOrCreateSessionState(sessionId)
    state.bets = []
    this.calculateTotals(state)
    this.broadcastToSession(sessionId)
  }

  public getState(sessionId: string): BetslipState {
    return { ...this.getOrCreateSessionState(sessionId) }
  }

  public handleBetslipAction(req: IncomingMessage, res: ServerResponse): void {
    let body = ''

    // Extract or generate session ID
    this.log('📥 Handling betslip action, URL:', req.url)
    let sessionId = this.extractSessionId(req)
    const isNewSession = !sessionId
    this.log('📥 Extracted sessionId:', sessionId)

    if (!sessionId) {
      this.log('🆕 No sessionId found, generating new one')
      sessionId = this.generateSessionId()
    }

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const data: BetslipAction = body ? JSON.parse(body) : {}
        const urlPath = req.url?.split('?')[0] // Get path without query params

        // Handle different actions
        if (urlPath === '/api/betslip/add' && data.bet) {
          this.addBet(sessionId, data.bet)
        }
        else if (urlPath === '/api/betslip/remove' && data.betId) {
          this.removeBet(sessionId, data.betId)
        }
        else if (urlPath === '/api/betslip/update-stake' && data.betId && data.stake !== undefined) {
          this.updateStake(sessionId, data.betId, data.stake)
        }
        else if (urlPath === '/api/betslip/submit') {
          this.submitBetslip(sessionId)
        }
        else if (urlPath === '/api/betslip/clear') {
          this.clearBetslip(sessionId)
        }

        const state = this.getState(sessionId)
        const corsOrigin = this.getCorsOrigin(req)

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Credentials': 'true'
        }

        // Only set cookie if it's a new session
        if (isNewSession) {
          const cookieValue = `betslip_session_id=${sessionId}; Path=/; SameSite=Lax`
          headers['Set-Cookie'] = cookieValue
          this.log('🍪 Set new session cookie:', sessionId)
        }

        res.writeHead(200, headers)
        res.end(JSON.stringify({ success: true, state }))
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

  public handleOptionsRequest(req: IncomingMessage, res: ServerResponse): void {
    const corsOrigin = this.getCorsOrigin(req)
    res.writeHead(200, {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
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

  // Extract path without query parameters for routing
  const urlPath = req.url.split('?')[0]

  // SSE Stream endpoint
  if (urlPath === '/api/betslip/stream' && req.method === 'GET') {
    manager.handleSSEStream(req, res)
    return
  }

  // Handle all betslip actions
  if (urlPath.startsWith('/api/betslip/') && req.method === 'POST') {
    manager.handleBetslipAction(req, res)
    return
  }

  // OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    manager.handleOptionsRequest(req, res)
    return
  }

  // Unknown endpoint
  manager.handleNotFound(res)
}
