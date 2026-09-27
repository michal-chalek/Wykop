import { useState, useEffect } from "react"
import "./Clock.css"

export function Clock()
{
  // Zawsze startujemy od godziny 21:37:00
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  useEffect(() =>
  {
    const interval = setInterval(() =>
    {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const initialTotalSeconds = 21 * 3600 + 37 * 60 + 0
  const currentTotalSeconds = (initialTotalSeconds + secondsElapsed) % (24 * 3600)

  const hours = Math.floor(currentTotalSeconds / 3600)
  const minutes = Math.floor((currentTotalSeconds % 3600) / 60)
  const seconds = currentTotalSeconds % 60

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return (
    <div className="clock-container" aria-label="Clock" role="timer">
      {formattedTime.split("").map((char, index) => (
        <span key={index} className="clock-char">
          {char}
        </span>
      ))}
    </div>
  )
}
