import { useState, useEffect, useRef, useCallback } from "react"
import type { WykopConversation } from "./types/wykop.ts"
import type { CardPhysicsState } from "./types/space3d.ts"
import { Card } from "./Card"
import "./Space3D.css"

interface Space3DProps
{
  conversations: WykopConversation[]
  token?: string
}

/**
 * Prosty hash do inicjalizacji losowych wektorow ruchu.
 */
function hashString(str: string): number
{
  let hash = 5381
  for (let i = 0; i < str.length; i++)
  {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number, index: number): number
{
  const x = Math.sin(seed + index * 127.1) * 43758.5453
  return x - Math.floor(x)
}

export function Space3D({ conversations, token }: Space3DProps)
{
  const [isPaused, setIsPaused] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const cardElementsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const physicsRef = useRef<CardPhysicsState[]>([])
  const activeIdRef = useRef<string | null>(null)
  const isPausedRef = useRef<boolean>(false)

  // Synchronizacja refów z aktualnym stanem
  useEffect(() =>
  {
    activeIdRef.current = activeCardId
  }, [activeCardId])

  useEffect(() =>
  {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Inicjalizacja stanu fizyki kart po zamontowaniu lub zmianie listy konwersacji
  useEffect(() =>
  {
    const width = window.innerWidth || 1200
    const height = window.innerHeight || 800

    physicsRef.current = conversations.map((conv, idx) =>
    {
      const seed = hashString(conv.user.username)
      const r = (i: number) => seededRandom(seed, i)

      // Rozrzut startowy po ekranie
      const x = 50 + r(idx * 7 + 1) * Math.max(100, width - 400)
      const y = 50 + r(idx * 7 + 2) * Math.max(100, height - 250)
      const z = -300 + r(idx * 7 + 3) * 450 // od -300px do +150px

      // Bazowe wolne predkosci (px per frame ~60fps)
      const speedX = 0.5 + r(idx * 7 + 4) * 0.7
      const speedY = 0.4 + r(idx * 7 + 5) * 0.6
      const speedZ = 0.3 + r(idx * 7 + 6) * 0.5

      const dirX = r(idx * 7 + 7) > 0.5 ? 1 : -1
      const dirY = r(idx * 7 + 8) > 0.5 ? 1 : -1
      const dirZ = r(idx * 7 + 9) > 0.5 ? 1 : -1

      return {
        id: conv.user.username,
        x,
        y,
        z,
        vx: speedX * dirX,
        vy: speedY * dirY,
        vz: speedZ * dirZ,
        rotX: (r(idx * 7 + 10) - 0.5) * 12,
        rotY: (r(idx * 7 + 11) - 0.5) * 16,
        rotZ: (r(idx * 7 + 12) - 0.5) * 8,
        vRotX: (r(idx * 7 + 13) - 0.5) * 0.05,
        vRotY: (r(idx * 7 + 14) - 0.5) * 0.06,
        vRotZ: (r(idx * 7 + 15) - 0.5) * 0.03,
      }
    })
  }, [conversations])


  // Silnik fizyki odbijania ("DVD bounce") w 3D
  useEffect(() =>
  {
    let animId: number
    const CARD_WIDTH = 320
    const CARD_HEIGHT = 100
    const OVERFLOW_MARGIN = 70 // czesciowe wyjechanie poza ekran przed odbiciem
    const SLOWDOWN_ZONE = 180 // strefa przed sciana, w ktorej karta zwalnia
    const Z_MIN = -380
    const Z_MAX = 140

    const updatePhysics = () =>
    {
      const screenW = window.innerWidth
      const screenH = window.innerHeight
      const currentActiveId = activeIdRef.current
      const paused = isPausedRef.current

      if (!paused)
      {
        for (const card of physicsRef.current)
        {
          // Jesli karta jest aktywna, jej transformacja jest wycentrowana przez CSS
          if (card.id === currentActiveId)
          {
            continue
          }

          // Granice odbijania z czesciowym wyjechaniem poza viewport
          const minX = -OVERFLOW_MARGIN
          const maxX = screenW - CARD_WIDTH + OVERFLOW_MARGIN
          const minY = -OVERFLOW_MARGIN
          const maxY = screenH - CARD_HEIGHT + OVERFLOW_MARGIN

          // Odleglosci do scian w kierunku aktualnego ruchu (do zwalniania)
          const distToEdgeX = card.vx > 0 ? maxX - card.x : card.x - minX
          const distToEdgeY = card.vy > 0 ? maxY - card.y : card.y - minY

          // Wspolczynnik predkosci: im blizej sciany, tym wolniej
          const factorX = Math.max(0.25, Math.min(1, distToEdgeX / SLOWDOWN_ZONE))
          const factorY = Math.max(0.25, Math.min(1, distToEdgeY / SLOWDOWN_ZONE))

          // Aktualizacja pozycji
          card.x += card.vx * factorX
          card.y += card.vy * factorY
          card.z += card.vz

          // Odbicie od lewej lub prawej sciany
          if (card.x <= minX)
          {
            card.x = minX
            card.vx = Math.abs(card.vx)
          } else if (card.x >= maxX)
          {
            card.x = maxX
            card.vx = -Math.abs(card.vx)
          }

          // Odbicie od gornej lub dolnej sciany
          if (card.y <= minY)
          {
            card.y = minY
            card.vy = Math.abs(card.vy)
          } else if (card.y >= maxY)
          {
            card.y = maxY
            card.vy = -Math.abs(card.vy)
          }

          // Odbicie w osi Z (glebokosc)
          if (card.z <= Z_MIN)
          {
            card.z = Z_MIN
            card.vz = Math.abs(card.vz)
          } else if (card.z >= Z_MAX)
          {
            card.z = Z_MAX
            card.vz = -Math.abs(card.vz)
          }

          // Delikatny, powolny obrot
          card.rotX += card.vRotX
          card.rotY += card.vRotY
          card.rotZ += card.vRotZ

          // Odbicie zakresu katow (stabilizacja przechylenia)
          if (Math.abs(card.rotX) > 14) card.vRotX *= -1
          if (Math.abs(card.rotY) > 18) card.vRotY *= -1
          if (Math.abs(card.rotZ) > 8) card.vRotZ *= -1

          // Bezposrednie nalozenie stylu na element DOM karty
          const el = cardElementsRef.current.get(card.id)
          if (el)
          {
            el.style.transform = `translate3d(${card.x}px, ${card.y}px, ${card.z}px) rotateX(${card.rotX}deg) rotateY(${card.rotY}deg) rotateZ(${card.rotZ}deg)`
            el.style.zIndex = `${Math.round(card.z + 1000)}`

            // Glebia ostrosci: karty w glebi lekko zamglone
            const blurAmount = card.z < 0 ? Math.min(3, -card.z * 0.001) : 0
            el.style.filter = blurAmount > 0.3 ? `blur(${blurAmount.toFixed(1)}px)` : "none"
          }
        }
      }

      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Klikniecie w karte: wlaczenie lub wylaczenie stanu active
  const handleCardClick = useCallback((cardId: string) =>
  {
    setActiveCardId((prev) =>
    {
      const next = prev === cardId ? null : cardId

      // Gdy karta staje sie aktywna, wyliczamy pozycje docelowa (dokladny srodek ekranu)
      if (next === cardId)
      {
        const clickAudio = new Audio("/click.mp3")
        clickAudio.volume = 0.2
        clickAudio.play().catch(() => { })

        const el = cardElementsRef.current.get(cardId)

        if (el)
        {
          const centerX = (window.innerWidth - 320) / 2
          const centerY = (window.innerHeight - 400) / 2

          // Przelot na srodek ekranu z wyprostowaniem katow do 0deg
          el.style.transform = `translate3d(${centerX}px, ${centerY}px, 160px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`
          el.style.zIndex = "9999"
          el.style.filter = "none"
        }
      } else
      {
        // Po dezaktywacji przywracamy biezace wspolrzedne fizyczne
        const card = physicsRef.current.find((c) => c.id === cardId)
        const el = cardElementsRef.current.get(cardId)
        if (card && el)
        {
          el.style.transform = `translate3d(${card.x}px, ${card.y}px, ${card.z}px) rotateX(${card.rotX}deg) rotateY(${card.rotY}deg) rotateZ(${card.rotZ}deg)`
          el.style.zIndex = `${Math.round(card.z + 1000)}`
        }
      }

      return next
    })
  }, [])

  // Klikniecie w puste tlo usuwa klase active ze wszystkich kart
  const handleStageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) =>
  {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains("space3d-camera")
    )
    {
      if (activeCardId)
      {
        const card = physicsRef.current.find((c) => c.id === activeCardId)
        const el = cardElementsRef.current.get(activeCardId)
        if (card && el)
        {
          el.style.transform = `translate3d(${card.x}px, ${card.y}px, ${card.z}px) rotateX(${card.rotX}deg) rotateY(${card.rotY}deg) rotateZ(${card.rotZ}deg)`
          el.style.zIndex = `${Math.round(card.z + 1000)}`
        }
        setActiveCardId(null)
      }
    }
  }, [activeCardId])

  return (
    <>
      <div
        ref={stageRef}
        className="space3d-stage"
        onClick={handleStageClick}
      >
        <div className="space3d-camera">
          {conversations.map((conv) =>
          {
            const id = conv.user.username
            const isActive = activeCardId === id

            return (
              <div
                key={id}
                ref={(el) =>
                {
                  if (el) cardElementsRef.current.set(id, el)
                  else cardElementsRef.current.delete(id)
                }}
                className={`card-3d-wrapper ${isActive ? "active" : ""}`}
                onPointerDown={(e) =>
                {
                  e.stopPropagation()
                }}
                onClick={(e) =>
                {
                  e.stopPropagation()
                  handleCardClick(id)
                }}
              >
                <Card conversation={conv} is3D token={token} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Kontrolki sceny */}
      <div className="space3d-controls">
        <button
          type="button"
          className={`space3d-btn ${isPaused ? "active-btn" : ""}`}
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? "Wznow animacje" : "Zatrzymaj animacje"}
        >
          {isPaused ? "Wznow" : "Pauza"}
        </button>
      </div>
    </>
  )
}
