import React from "react"
import { AccountSection } from "@/auth"
import { Tag } from "@/ui"
import { AI_META } from "@/data"
import { isElectron } from "@/lib/platform"

export function Sidebar({
  prompts,
  filter,
  setFilter,
  accent,
  accentSoft,
  onClose,
  isMobile,
  accountProps,
  section,
  setSection,
}) {
  const counts = React.useMemo(() => {
    const c = {
      all: prompts.length,
      starred: prompts.filter((p) => p.star).length,
      shared: prompts.filter((p) => p.public).length,
    }
    Object.keys(AI_META).forEach(
      (k) => (c[k] = prompts.filter((p) => p.ai === k).length),
    )
    return c
  }, [prompts])

  const tagCounts = React.useMemo(() => {
    const c = {}
    prompts.forEach((p) => p.tags.forEach((t) => (c[t] = (c[t] || 0) + 1)))
    return c
  }, [prompts])

  const item = (key, active, color, glyph, label, count, onClick) => (
    <div
      key={key}
      onClick={onClick}
      className="stash-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        borderRadius: 8,
        cursor: "pointer",
        background: active ? accentSoft : "transparent",
        color: active ? "var(--text)" : "var(--text-2)",
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: color,
          color: "var(--surface)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {glyph}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {count !== null && (
        <span
          style={{
            color: "var(--text-faint)",
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      )}
    </div>
  )

  const goLibrary = (filterFn) => () => {
    setSection("library")
    filterFn()
  }

  const globeIcon = (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )

  return (
    <aside
      style={{
        height: (!isElectron || isMobile) ? "100dvh" : undefined,
        width: isMobile ? "100vw" : 240,
        flexShrink: 0,
        borderRight: isMobile ? "none" : "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header con botón de cierre — solo en mobile */}
      {isMobile && (
        <div style={{
          display: "flex", alignItems: "center",
          padding: "14px 16px 10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            fontSize: 20, fontWeight: 500, color: "var(--text)", flex: 1,
          }}>Menu</span>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 9,
              border: "1px solid var(--border)", background: "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-2)", fontSize: 18, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Zona scrollable: Explore, Library, Models, Tags, Stats */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Explore */}
        <div>
          {item(
            "explore",
            section === "explore",
            "#0ea5e9",
            globeIcon,
            "Explore",
            null,
            () => setSection("explore"),
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.7,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "4px 10px 6px",
            }}
          >
            Library
          </div>
          {item(
            "all",
            section === "library" &&
              filter.scope === "all" &&
              !filter.ai &&
              filter.tags.length === 0,
            "var(--text)",
            "≡",
            "All prompts",
            counts.all,
            goLibrary(() => setFilter({ scope: "all", ai: null, tags: [] })),
          )}
          {item(
            "starred",
            section === "library" && filter.scope === "starred",
            accent,
            "★",
            "Starred",
            counts.starred,
            goLibrary(() => setFilter({ ...filter, scope: "starred" })),
          )}
          {accountProps?.user &&
            item(
              "shared",
              section === "library" && filter.scope === "shared",
              "#0ea5e9",
              globeIcon,
              "Shared",
              counts.shared,
              goLibrary(() => setFilter({ ...filter, scope: "shared" })),
            )}
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.7,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "4px 10px 6px",
            }}
          >
            Models
          </div>
          {Object.entries(AI_META).map(([k, m]) =>
            item(
              k,
              section === "library" && filter.ai === k,
              m.color,
              m.glyph,
              m.name,
              counts[k] || 0,
              goLibrary(() =>
                setFilter({
                  ...filter,
                  scope: "all",
                  ai: filter.ai === k ? null : k,
                }),
              ),
            ),
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.7,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "4px 10px 6px",
            }}
          >
            Tags
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              padding: "0 4px",
            }}
          >
            {Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => (
                <Tag
                  key={t}
                  on={section === "library" && (filter.tags || []).includes(t)}
                  size="sm"
                  onClick={goLibrary(() => {
                    const tags = filter.tags || []
                    const nextTags = tags.includes(t)
                      ? tags.filter((tag) => tag !== t)
                      : [...tags, t]
                    setFilter({ ...filter, tags: nextTags })
                  })}
                >
                  {t}
                </Tag>
              ))}
          </div>
        </div>

        {prompts.length > 0 && (
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-2)",
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              {prompts.reduce((a, p) => a + p.uses, 0)} runs this month
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted-2)" }}>
              Top:{" "}
              <i
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  color: "var(--text)",
                  fontWeight: 500,
                }}
              >
                {prompts.slice().sort((a, b) => b.uses - a.uses)[0].title}
              </i>
            </div>
          </div>
        )}
      </div>

      {/* Account — siempre pegado al fondo */}
      {accountProps && (
        <div style={{ flexShrink: 0, padding: "0 12px 12px" }}>
          <AccountSection accent={accent} {...accountProps} />
        </div>
      )}
    </aside>
  )
}
