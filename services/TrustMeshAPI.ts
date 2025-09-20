/**
 * TrustMesh API Client
 * Maps 1:1 to backend endpoints in setup/trustmesh_api.py
 */

const BASE_URL = 'http://localhost:8000'

// Types matching backend models
export interface CreateProfileRequest {
  display_name: string
  visibility: 'public' | 'private'
}

export interface GiveTrustTokenRequest {
  recipient: string
  trust_type: 'personal' | 'professional' | 'institutional'
  relationship: string
  context?: string
  trst_staked?: number
}

export interface CreateSignalRequest {
  recipient: string
  name: string
  description: string
  signal_type: 'achievement' | 'skill' | 'personality' | 'contribution'
  category?: string
  issuance_context?: any
}

export interface CreatePollRequest {
  title: string
  description: string
  options: PollOption[]
  voting_duration_hours: number
}

export interface PollOption {
  option_id: string
  nominee: string
  display_name: string
  reason?: string
}

export interface VoteRequest {
  option_id: string
}

export interface APIResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface ReputationResponse {
  user_id: string
  overall_score: number
  breakdown: any
  milestone: any
  calculated_at: string
}

class TrustMeshAPIClient {
  private baseURL: string

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // 1. POST /profiles - Create user profile
  async createProfile(request: CreateProfileRequest): Promise<APIResponse> {
    return this.request('/profiles', 'POST', request)
  }

  // 2. POST /trust-tokens - Give trust token
  async giveTrustToken(request: GiveTrustTokenRequest): Promise<APIResponse> {
    return this.request('/trust-tokens', 'POST', request)
  }

  // 3. POST /signals - Create recognition signal
  async createSignal(request: CreateSignalRequest): Promise<APIResponse> {
    return this.request('/signals', 'POST', request)
  }

  // 4. GET /reputation/{user_id} - Calculate reputation
  async getReputation(userId: string): Promise<ReputationResponse> {
    const response = await this.request<ReputationResponse>(`/reputation/${userId}`)
    return response.data as ReputationResponse
  }

  // 5. POST /polls - Create community poll
  async createPoll(request: CreatePollRequest): Promise<APIResponse> {
    return this.request('/polls', 'POST', request)
  }

  // 6. POST /polls/{poll_id}/vote - Vote in poll
  async voteInPoll(pollId: string, request: VoteRequest): Promise<APIResponse> {
    return this.request(`/polls/${pollId}/vote`, 'POST', request)
  }

  // 7. GET /demo/setup - Set up demo data
  async setupDemo(): Promise<APIResponse> {
    return this.request('/demo/setup')
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseURL}/health`)
    return response.json()
  }
}

export const trustMeshAPI = new TrustMeshAPIClient()
export default trustMeshAPI