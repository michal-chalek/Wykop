/**
 * Typy danych dla Wykop API v3.
 */

/** Para tokenow zwracana przez /refresh-token */
export interface Tokens {
  refresh_token: string;
  token: string;
}

/** Profil uzytkownika w konwersacji PM */
export interface WykopUser {
  username: string;
  avatar: string;
  company?: boolean;
  gender?: string;
  online?: boolean;
  status?: string;
  color?: {
    name: string;
    hex: string;
    hex_dark?: string;
  };
  verified?: boolean;
}

/** Ostatnia wiadomosc w konwersacji PM */
export interface WykopLastMessage {
  created_at: string;
  content: string;
  type?: number;
  adult?: boolean;
  read: boolean;
  key?: string;
}

/** Pojedyncza konwersacja PM */
export interface WykopConversation {
  user: WykopUser;
  last_message: WykopLastMessage;
  unread: boolean;
}

/** Odpowiedz z /pm/conversations */
export interface WykopConversationsResponse {
  data: WykopConversation[];
  pagination?: {
    per_page: number;
    total: number;
  };
}

/** Odpowiedz z /refresh-token */
export interface WykopRefreshTokenResponse {
  data: {
    refresh_token: string;
    token: string;
  };
}
