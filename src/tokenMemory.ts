import type { Tokens } from "./types/wykop"

let memoryTokens: Tokens | null = null

export function setMemoryTokens(tokens: Tokens | null): void {
  memoryTokens = tokens
}

export function getMemoryTokens(): Tokens | null {
  return memoryTokens
}

export function getMemoryToken(): string | null {
  return memoryTokens?.token ?? null
}
