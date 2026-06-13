/* Markdown renderer propio (sin dependencias) — formato FIJO y consistente para las respuestas
   del agente. Soporta: # ## ### encabezados, listas - * y 1., tablas GFM, ``` código, > cita,
   --- regla, y en línea **negrita**, *itálica*, `código`, [texto](url). Estilizado con los tokens
   del design system para que toda respuesta "se vea igual". Seguro: no inyecta HTML crudo. */
"use client";
import { Fragment, type ReactNode } from "react";

// ── Inline: **bold** *italic* `code` [text](url) ──
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Orden importa: code primero (no se formatea adentro), luego links, bold, italic.
  const re = /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}-t${k}`}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(<code key={`${keyBase}-c${k}`} style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px", fontFamily: "var(--font-mono, ui-monospace, monospace)", fontSize: "0.9em" }}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok)!;
      out.push(<a key={`${keyBase}-l${k}`} href={mm[2]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>{mm[1]}</a>);
    } else if (tok.startsWith("**") || tok.startsWith("__")) {
      out.push(<strong key={`${keyBase}-b${k}`} style={{ fontWeight: 650, color: "var(--text)" }}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={`${keyBase}-i${k}`}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
    k++;
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}-tEnd`}>{text.slice(last)}</Fragment>);
  return out;
}

const isTableSep = (s: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s);
const splitRow = (s: string) => s.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());

export function Markdown({ text }: { text: string }) {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0, key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Código en bloque ```
    if (/^\s*```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++; // cierre
      blocks.push(
        <pre key={key++} style={{ background: "var(--bg-elevated-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 14px", overflow: "auto", fontSize: 13, lineHeight: 1.55, margin: "10px 0" }}>
          <code style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)", color: "var(--text)" }}>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Tabla GFM: fila de cabecera + separador
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") rows.push(splitRow(lines[i++]));
      blocks.push(
        <div key={key++} style={{ overflow: "auto", margin: "12px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr>{header.map((h, j) => <th key={j} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--border)", background: "var(--bg-elevated-2)", fontWeight: 650, color: "var(--text)", whiteSpace: "nowrap" }}>{inline(h, `th${key}-${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", verticalAlign: "top" }}>{inline(c, `td${key}-${ri}-${ci}`)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Encabezados
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const size = lvl === 1 ? 20 : lvl === 2 ? 17 : 15;
      blocks.push(<div key={key++} style={{ fontSize: size, fontWeight: 650, color: "var(--text)", margin: lvl === 1 ? "18px 0 8px" : "16px 0 6px", lineHeight: 1.3 }}>{inline(h[2], `h${key}`)}</div>);
      i++;
      continue;
    }

    // Regla horizontal
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />);
      i++;
      continue;
    }

    // Cita >
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={key++} style={{ borderLeft: "3px solid var(--primary)", padding: "4px 0 4px 14px", margin: "10px 0", color: "var(--text-secondary)", fontStyle: "italic" }}>{inline(buf.join(" "), `q${key}`)}</blockquote>);
      continue;
    }

    // Lista no ordenada
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(
        <ul key={key++} style={{ margin: "6px 0 6px 2px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((it, j) => <li key={j} style={{ lineHeight: 1.6, color: "var(--text)" }}>{inline(it, `ul${key}-${j}`)}</li>)}
        </ul>,
      );
      continue;
    }

    // Lista ordenada
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      blocks.push(
        <ol key={key++} style={{ margin: "6px 0 6px 2px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((it, j) => <li key={j} style={{ lineHeight: 1.6, color: "var(--text)" }}>{inline(it, `ol${key}-${j}`)}</li>)}
        </ol>,
      );
      continue;
    }

    // Línea en blanco → separador
    if (line.trim() === "") { i++; continue; }

    // Párrafo (junta líneas consecutivas no-especiales)
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*([-*]\s+|\d+\.\s+|#{1,3}\s+|>\s?|```)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      buf.push(lines[i++]);
    }
    if (buf.length) blocks.push(<p key={key++} style={{ margin: "8px 0", lineHeight: 1.65, color: "var(--text)" }}>{inline(buf.join(" "), `p${key}`)}</p>);
  }

  return <div style={{ fontSize: 14.5 }}>{blocks}</div>;
}
