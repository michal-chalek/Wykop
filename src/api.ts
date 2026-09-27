import { getMemoryToken } from "./tokenMemory"
import type { WykopConversation, WykopConversationsResponse } from "./types/wykop.ts"

const WYKOP_API_BASE_URL = "https://wykop.pl/api/v3"

function resolveToken(token?: string): string
{
  const activeToken = token || getMemoryToken()
  if (!activeToken)
  {
    throw new Error("Brak aktywnego tokena autoryzacyjnego!")
  }
  return activeToken
}

async function requestWykopApi(endpoint: string, options: RequestInit = {}, token?: string): Promise<Response>
{
  const activeToken = resolveToken(token)

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Authorization": `Bearer ${activeToken}`,
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(`${WYKOP_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok)
  {
    const errData = await response.json().catch(() => ({}))
    console.error(`Blad API Wykopu (${response.status}) dla ${endpoint}:`, errData)
    throw new Error(`Blad API Wykopu (${response.status})`)
  }

  return response
}

/**
 * Pobranie listy konwersacji PM -- GET /pm/conversations z Bearer token.
 */
export async function fetchConversations(token?: string): Promise<WykopConversation[]>
{
  const response = await requestWykopApi(
    "/pm/conversations",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    token
  )

  const result: WykopConversationsResponse = await response.json()

  const fallbackConversations: WykopConversation[] = [
    {
      user: {
        username: "a__s",
        gender: "f",
        company: false,
        avatar: "https://wykop.pl/cdn/c3397992/a__s_FCteYgJD8h.jpg",
        status: "active",
        verified: true,
        online: true,
      },
      last_message: {
        adult: false,
        content: "O zBoże, usuń ten wpis! Bo dostaniesz bana!",
        type: 1,
        created_at: "2023-01-17 21:37:00",
        read: false,
      },
      unread: true,
    },
    {
      user: {
        username: "m__b",
        gender: "m",
        company: false,
        avatar: "https://wykop.pl/cdn/c0834752/77f890f613a9cccff1a394399c19121ff0497a97696c6f04504c3d478cb24873,q300.jpg",
        status: "active",
        verified: true,
        online: false,
      },
      last_message: {
        adult: false,
        content: "Nowa wersja wykopu, jak wrażenia? ",
        type: 1,
        created_at: "2023-01-17 21:37:59",
        read: false,
      },
      unread: true,
    },
    {
      user: {
        username: "WykopX",
        gender: "m",
        company: false,
        avatar: "https://wykop.pl/cdn/c0834752/4b00d403b662b79b0243a4523f8949acdd52ce53af8aa46ce18d76e157885d2b.gif",
        status: "active",
        verified: true,
        online: false,
      },
      last_message: {
        adult: false,
        content: "Nieoficjalna apka WykopX jest lepsza, obczaj www.wykopx.pl",
        type: 1,
        created_at: "2023-01-17 21:37:59",
        read: false,
      },
      unread: true,
    },
  ]

  const apiConversations = Array.isArray(result.data) ? result.data : []

  // Filtrujemy, aby nie zduplikować użytkowników, jeśli API już ich zwróciło
  const hardcodedFiltered = fallbackConversations.filter(
    (hardcoded) => !apiConversations.some((c) => c.user.username.toLowerCase() === hardcoded.user.username.toLowerCase()),
  )

  return [...apiConversations, ...hardcodedFiltered]
}

export interface SendPrivateMessageParams
{
  username: string
  content: string
  token?: string
}

/**
 * Wysyla prywatna wiadomosc (PM) do uzytkownika przez API Wykopu.
 */
export async function sendPrivateMessage({ username, content, token }: SendPrivateMessageParams): Promise<void>
{
  await requestWykopApi(
    `/pm/conversations/${username}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          content: content + " [( ͡° ͜ʖ ͡°)](https://wykopx.pl)",
        },
      }),
    },
    token
  )
}

export interface VoteEntryParams
{
  entryId: number | string
  token?: string
}

/**
 * 1. Plusowanie wpisu na podstawie id wpisu.
 * POST /api/v3/entries/{entryId}/votes (bez body)
 */
export async function voteEntry({ entryId, token }: VoteEntryParams): Promise<void>
{
  await requestWykopApi(`/entries/${entryId}/votes`, { method: "POST" }, token)
}

export interface VoteCommentParams
{
  entryId: number | string
  commentId: number | string
  token?: string
}

/**
 * 2. Plusowanie komentarza na podstawie id wpisu i id komentarza.
 * POST /api/v3/entries/{entryId}/comments/{commentId}/votes (bez body)
 */
export async function voteComment({ entryId, commentId, token }: VoteCommentParams): Promise<void>
{
  await requestWykopApi(`/entries/${entryId}/comments/${commentId}/votes`, { method: "POST" }, token)
}

/**
 * 3. Cofniecie plusa (odplusowanie) wpisu na podstawie id wpisu.
 * DELETE /api/v3/entries/{entryId}/votes (bez body)
 */
export async function unvoteEntry({ entryId, token }: VoteEntryParams): Promise<void>
{
  await requestWykopApi(`/entries/${entryId}/votes`, { method: "DELETE" }, token)
}

/**
 * 4. Cofniecie plusa (odplusowanie) komentarza na podstawie id wpisu i id komentarza.
 * DELETE /api/v3/entries/{entryId}/comments/{commentId}/votes (bez body)
 */
export async function unvoteComment({ entryId, commentId, token }: VoteCommentParams): Promise<void>
{
  await requestWykopApi(`/entries/${entryId}/comments/${commentId}/votes`, { method: "DELETE" }, token)
}

export interface FollowUserParams
{
  username: string
  token?: string
}

/**
 * 5. Obserwowanie uzytkownika na podstawie username.
 * POST /api/v3/observed/users/{username} (bez body)
 */
export async function followUser({ username, token }: FollowUserParams): Promise<void>
{
  await requestWykopApi(`/observed/users/${username}`, { method: "POST" }, token)
}

/**
 * 6. Cofniecie obserwowania uzytkownika na podstawie username.
 * DELETE /api/v3/observed/users/{username} (bez body)
 */
export async function unfollowUser({ username, token }: FollowUserParams): Promise<void>
{
  await requestWykopApi(`/observed/users/${username}`, { method: "DELETE" }, token)
}

export interface FollowTagParams
{
  tagName: string
  token?: string
}

/**
 * Obserwowanie tagu na podstawie tagName.
 * POST /api/v3/observed/tags/{tagName} (bez body)
 */
export async function followTag({ tagName, token }: FollowTagParams): Promise<void>
{
  const cleanTag = tagName.startsWith("#") ? tagName.slice(1) : tagName
  await requestWykopApi(`/observed/tags/${cleanTag}`, { method: "POST" }, token)
}

/**
 * Cofniecie obserwowania tagu na podstawie tagName.
 * DELETE /api/v3/observed/tags/{tagName} (bez body)
 */
export async function unfollowTag({ tagName, token }: FollowTagParams): Promise<void>
{
  const cleanTag = tagName.startsWith("#") ? tagName.slice(1) : tagName
  await requestWykopApi(`/observed/tags/${cleanTag}`, { method: "DELETE" }, token)
}

