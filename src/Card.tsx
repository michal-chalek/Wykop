import { useState } from "react"
import type { WykopConversation } from "./types/wykop.ts"
import { sendPrivateMessage } from "./api"
import "./Card.css"

export interface CardProps
{
  conversation: WykopConversation
  /** Czy karta jest renderowana w scenie 3D (wlacza glassmorphism) */
  is3D?: boolean
  token?: string
}

/**
 * Komponent pojedynczej konwersacji na liscie (karta).
 */
export function Card({ conversation, is3D = false, token }: CardProps)
{
  const { user, last_message, unread } = conversation
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [messageText, setMessageText] = useState(`Hej ${user.username}, Wykop się zepsuł`)

  const avatarSrc = user.avatar
    ? user.avatar
    : (user.gender === "f" ? "/avatar-f.png" : "/avatar-m.png")

  const classNames = [
    "card-item",
    unread ? "unread" : "",
    is3D ? "card-3d" : "",
  ].filter(Boolean).join(" ")

  const handleSendMessage = async (e: React.MouseEvent<HTMLButtonElement>) =>
  {
    e.stopPropagation()
    setStatus("sending")

    try
    {
      await sendPrivateMessage({
        username: user.username,
        content: messageText,
        token,
      })
      setStatus("sent")
    }
    catch (err)
    {
      console.error("Blad podczas wysylania wiadomosci:", err)
      setStatus("error")
    }
  }

  const isSent = status === "sent"
  const isSending = status === "sending"
  const isDisabled = isSent || isSending

  return (
    <div className={classNames}>
      {/* Awatar */}
      <img
        src={avatarSrc}
        alt={user.username}
        className="card-avatar"
      />

      {/* Tresc */}
      <div className="card-body">
        <div className="card-header">
          <span
            className="card-username"
            style={user.color?.hex ? { color: user.color.hex } : undefined}
          >
            {user.username}
          </span>
          {user.online && (
            <span className="card-online-dot" />
          )}
          {unread && (
            <span className="card-unread-dot" />
          )}
          {last_message?.created_at && (
            <>
              <span className="card-date">
                {last_message.created_at.slice(0, 16)}
              </span>
              <time className="card-time">
                {last_message.created_at.slice(11, 16)}
              </time>
            </>
          )}
        </div>

        <p className="card-message">
          {last_message.content}
        </p>
      </div>


      <div
        className="card-actions"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          className="card-action-input"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={isDisabled}
          placeholder="Treść wiadomości..."
        />

        <button
          type="button"
          className="card-action-btn"
          onClick={handleSendMessage}
          disabled={isDisabled || !messageText.trim()}
        >
          {isSending ? "Wysyłanie..." : isSent ? "Wysłano" : status === "error" ? "Błąd - ponów" : "Wyślij"}
        </button>
      </div>

    </div>
  )
}
