import type { ScendContext } from "../types/ScendContext"

type ContextHandler<T extends ScendContext = ScendContext> = (context: T) => Promise<void> | void

export class ContextEngine {
  private handlers: Map<string, ContextHandler> = new Map()

  registerHandler<T extends ScendContext>(type: T["type"], handler: ContextHandler<T>) {
    this.handlers.set(type, handler as ContextHandler)
    console.log(`[ContextEngine] Registered handler for: ${type}`)
  }

  async processContext(context: ScendContext): Promise<void> {
    const handler = this.handlers.get(context.type)

    if (!handler) {
      console.warn(`[ContextEngine] No handler found for context type: ${context.type}`)
      return
    }

    try {
      console.log(`[ContextEngine] Processing context:`, context)
      await handler(context)
    } catch (error) {
      console.error(`[ContextEngine] Error processing context:`, error)
    }
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}

export const contextEngine = new ContextEngine()
