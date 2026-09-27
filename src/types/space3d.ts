/**
 * Stan fizyki dla pojedynczej karty dryfujacej w 3D ("DVD bounce").
 */
export interface CardPhysicsState {
  id: string
  /** Aktualna pozycja X w pikselach (od lewej krawedzi okna) */
  x: number
  /** Aktualna pozycja Y w pikselach (od gornej krawedzi okna) */
  y: number
  /** Aktualna glebokosc Z w pikselach (np. -350 do +150) */
  z: number
  /** Bazowa predkosc pozioma (px/frame) */
  vx: number
  /** Bazowa predkosc pionowa (px/frame) */
  vy: number
  /** Bazowa predkosc w osi Z (px/frame) */
  vz: number
  /** Biezace katy nachylenia (stopnie) */
  rotX: number
  rotY: number
  rotZ: number
  /** Predkosc obrotu katow */
  vRotX: number
  vRotY: number
  vRotZ: number
}
