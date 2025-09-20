import type { ScendContext } from "./ScendContext" // Assuming ScendContext is declared in another file

export interface ChatContext extends ScendContext {
  type: "chat"
  payload: {
    threadId: string
    action: "notify" | "message" | "system" | "trust_update"
    message: string
    userId?: string
    conversationTopic?: string
    trustLevel?: "contact" | "recognition" | "circle"
  }
}
