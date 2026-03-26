export type ParsedChannel = {
  type: "handle" | "id"
  value: string
}

export function parseChannelInput(input: string): ParsedChannel | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try to parse as a URL
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    )
    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      const pathParts = url.pathname.split("/").filter(Boolean)

      // youtube.com/@handle
      if (pathParts[0]?.startsWith("@")) {
        return { type: "handle", value: pathParts[0] }
      }

      // youtube.com/channel/UCxxxxxx
      if (pathParts[0] === "channel" && pathParts[1]) {
        return { type: "id", value: pathParts[1] }
      }

      // youtube.com/c/ChannelName — try as handle (best effort, may not resolve)
      if (pathParts[0] === "c" && pathParts[1]) {
        return { type: "handle", value: `@${pathParts[1]}` }
      }

      // youtube.com/user/Username — legacy format, try as handle
      if (pathParts[0] === "user" && pathParts[1]) {
        return { type: "handle", value: `@${pathParts[1]}` }
      }
    }
  } catch {
    // Not a valid URL, try other formats
  }

  // Bare @handle
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed }
  }

  // Bare channel ID (starts with UC, 24 chars)
  if (trimmed.startsWith("UC") && trimmed.length === 24) {
    return { type: "id", value: trimmed }
  }

  // Assume it's a handle without @
  if (/^[\w.-]+$/.test(trimmed)) {
    return { type: "handle", value: `@${trimmed}` }
  }

  return null
}
