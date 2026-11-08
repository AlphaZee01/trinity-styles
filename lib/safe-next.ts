/** Same-origin relative path. Rejects protocol-relative, backslash, and scheme tricks. */
export function safeNext(value: string | null | undefined, fallback = "/account") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes(":") || value.includes("\0") || value.includes("..")) {
    return fallback;
  }
  return value;
}
