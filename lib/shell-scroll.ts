const SCROLL_KEY = "wg-shell-scroll"

export function shellScrollId(pathname: string, search: string): string {
  return `${pathname}?${search}`
}

export function saveShellScroll(id: string, top: number): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ id, top }))
}

export function readShellScroll(id: string): number | null {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "") as { id?: string; top?: number }
    if (parsed.id === id && typeof parsed.top === "number") return parsed.top
  } catch {
    return null
  }
  return null
}
