type AvatarTheme = {
  skin: string
  hair: string
  eye: string
  ear?: string
  visor?: string
}

const AVATAR_THEMES: AvatarTheme[] = [
  { skin: "#e8b690", hair: "#5c3a21", eye: "#1a1a1a" },
  { skin: "#e8b690", hair: "#c0531f", eye: "#1a1a1a" },
  { skin: "#d9641f", hair: "#d9641f", eye: "#1a1a1a", ear: "#d9641f" },
  { skin: "#9aa5b1", hair: "#5b6672", eye: "#55e0ff", visor: "#263140" },
  { skin: "#e8b690", hair: "#2b2b2b", eye: "#1a1a1a" },
  { skin: "#c9d97a", hair: "#4a6b2a", eye: "#1a1a1a" },
]

function buildPixels(theme: AvatarTheme) {
  const pixels: { x: number; y: number; fill: string }[] = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let fill: string
      if (theme.ear && y === 0 && (x === 0 || x === 7)) fill = theme.ear
      else if (y <= 1) fill = theme.hair
      else if (theme.visor && y === 4) fill = theme.visor
      else fill = theme.skin
      pixels.push({ x, y, fill })
    }
  }
  pixels.push({ x: 2, y: 4, fill: theme.eye })
  pixels.push({ x: 5, y: 4, fill: theme.eye })
  return pixels
}

type PlayerAvatarProps = {
  index: number
  className?: string
}

export function PlayerAvatar({ index, className }: PlayerAvatarProps) {
  const theme = AVATAR_THEMES[index % AVATAR_THEMES.length]
  const pixels = buildPixels(theme)

  return (
    <span
      className={
        className ?? "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-panel-2"
      }
    >
      <svg viewBox="0 0 8 8" shapeRendering="crispEdges" className="h-full w-full">
        {pixels.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={p.fill} />
        ))}
      </svg>
    </span>
  )
}
