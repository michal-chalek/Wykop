import { useEffect } from "react"

export function BackgroundAudio()
{
  useEffect(() =>
  {
    const audio = document.getElementById("bg-audio") as HTMLAudioElement | null
    if (!audio) return

    audio.volume = 0.02

    const listenerOptions = { capture: true }

    const handleFirstInteraction = () =>
    {
      audio.volume = 0.2

      audio.play().catch(() =>
      {
        // Ignore autoplay errors if browser blocks until another gesture
      })

      window.removeEventListener("pointerdown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("mousedown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("keydown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("touchstart", handleFirstInteraction, listenerOptions)
      window.removeEventListener("click", handleFirstInteraction, listenerOptions)
    }

    window.addEventListener("pointerdown", handleFirstInteraction, listenerOptions)
    window.addEventListener("mousedown", handleFirstInteraction, listenerOptions)
    window.addEventListener("keydown", handleFirstInteraction, listenerOptions)
    window.addEventListener("touchstart", handleFirstInteraction, listenerOptions)
    window.addEventListener("click", handleFirstInteraction, listenerOptions)

    return () =>
    {
      window.removeEventListener("pointerdown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("mousedown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("keydown", handleFirstInteraction, listenerOptions)
      window.removeEventListener("touchstart", handleFirstInteraction, listenerOptions)
      window.removeEventListener("click", handleFirstInteraction, listenerOptions)
    }
  }, [])

  return null
}
