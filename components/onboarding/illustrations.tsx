import styles from "./onboarding.module.css"

/**
 * Illustrations des trois slides — PREMIER JET en SVG, pour valider la composition
 * et le mouvement. La version finale utilisera les dessins fournis par Sagio :
 * il suffira de garder les mêmes calques nommés (vapeur, bol, feuilles, piments,
 * curseur, scooter, route, repere) pour que les animations continuent de marcher.
 *
 * Style : vectoriel plat, formes généreuses, ombres en aplat, couleurs de la marque.
 */

const C = {
  liboke: "#E2572B",
  braise: "#BC4219",
  safou: "#F4A93B",
  safouOmbre: "#D98C22",
  pili: "#B23A2E",
  piliOmbre: "#8E2A22",
  feuille: "#4F7A4A",
  feuilleOmbre: "#3E6239",
  kwanga: "#FAF3E8",
  sable: "#F2E4CC",
  encre: "#2B1B12",
  encreClair: "#4A2F20",
  peau: "#9A6240",
}

interface IlloProps {
  active: boolean
}

const SVG_PROPS = {
  viewBox: "0 0 400 420",
  preserveAspectRatio: "xMidYMax meet",
  "aria-hidden": true,
} as const

// ─── Slide 1 — l'histoire des plats ───────────────────────────────

/** Feuille de manioc : sept folioles en éventail. */
function FeuilleManioc({ x, y, rotate, scale }: { x: number; y: number; rotate: number; scale: number }) {
  const lobes = [-78, -52, -26, 0, 26, 52, 78]
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <g className={styles.flotte}>
        <path d="M0 4V64" stroke={C.feuilleOmbre} strokeWidth="7" strokeLinecap="round" />
        {lobes.map((a, i) => (
          <path
            key={a}
            d="M0 0C13 -28 15 -88 0 -124C-15 -88 -13 -28 0 0Z"
            transform={`rotate(${a}) scale(${1 - Math.abs(a) / 300})`}
            fill={i % 2 ? C.feuille : C.feuilleOmbre}
          />
        ))}
      </g>
    </g>
  )
}

export function IlloBol({ active }: IlloProps) {
  return (
    <svg {...SVG_PROPS} className={`${styles.illo} h-full w-full overflow-visible`} data-active={active}>
      <defs>
        <clipPath id="illo-bol-clip">
          <path d="M46 214C46 318 116 376 200 376S354 318 354 214Z" />
        </clipPath>
        <pattern id="illo-bol-frise" width="40" height="34" patternUnits="userSpaceOnUse">
          <path d="M2 32 10 14l8 18Z M22 14h16l-8 18Z" fill={C.safou} />
          <circle cx="10" cy="5" r="3.2" fill={C.kwanga} />
          <circle cx="30" cy="5" r="3.2" fill={C.kwanga} />
        </pattern>
      </defs>

      <g id="feuilles">
        <FeuilleManioc x={40} y={262} rotate={-34} scale={1.25} />
        <FeuilleManioc x={366} y={246} rotate={36} scale={1.35} />
        <FeuilleManioc x={26} y={392} rotate={-78} scale={0.8} />
      </g>

      <ellipse cx="200" cy="386" rx="164" ry="19" fill={C.braise} />

      <g id="vapeur" fill="none" stroke={C.kwanga} strokeWidth="13" strokeLinecap="round">
        <path className={styles.vapeurBoucle} d="M148 176C126 148 170 130 148 98C132 74 158 58 150 38" />
        <path className={styles.vapeurBoucle} style={{ animationDelay: "0.9s" }} d="M204 166C180 134 228 112 204 76C186 48 218 28 206 4" />
        <path className={styles.vapeurBoucle} style={{ animationDelay: "1.8s" }} d="M260 176C238 148 282 130 260 98C244 74 270 58 262 38" />
      </g>

      <g id="bol">
        <path d="M46 214C46 318 116 376 200 376S354 318 354 214Z" fill={C.encre} />
        <path d="M46 214C46 290 84 344 136 366C98 330 80 276 80 214Z" fill={C.encreClair} />
        <rect x="40" y="268" width="320" height="34" fill="url(#illo-bol-frise)" clipPath="url(#illo-bol-clip)" />
        <rect x="150" y="370" width="100" height="15" rx="7.5" fill={C.encre} />
        <ellipse cx="200" cy="214" rx="158" ry="38" fill={C.kwanga} />
        <ellipse cx="200" cy="216" rx="140" ry="29" fill={C.safou} />
        <ellipse cx="152" cy="212" rx="32" ry="13" fill={C.pili} />
        <ellipse cx="242" cy="223" rx="38" ry="12" fill={C.braise} />
        <ellipse cx="212" cy="201" rx="22" ry="8" fill={C.pili} />
        <path d="M96 220c30-12 62 8 98-1s64-9 98 3" stroke={C.kwanga} strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="180" cy="228" r="4.5" fill={C.feuille} />
        <circle cx="270" cy="208" r="4.5" fill={C.feuille} />
        <circle cx="118" cy="224" r="4" fill={C.feuille} />
        <circle cx="228" cy="210" r="3.5" fill={C.feuille} />
      </g>
    </svg>
  )
}

// ─── Slide 2 — le piquant ─────────────────────────────────────────

function Piment({ x, y, scale, rotate, delay }: { x: number; y: number; scale: number; rotate: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate} 12 12)`}>
      <g className={styles.piment} style={{ animationDelay: `${delay}s` }}>
        <path d="M15.4 5.8C15.4 4.3 16.4 3 18 2.6" fill="none" stroke={C.feuilleOmbre} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M13 6C15 5 18.5 6.5 18.5 10C18.5 15 12 20.5 4.5 20.5C3.5 20.5 3.3 19.6 4.2 19.2C8 17.5 9.8 14.5 10 11C10.1 8.8 11 6.8 13 6Z" fill={C.pili} />
        <path d="M18.5 10C18.5 15 12 20.5 4.5 20.5C3.5 20.5 3.3 19.6 4.2 19.2C10 18 15.5 14 16.8 7.6C17.9 8.2 18.5 9 18.5 10Z" fill={C.piliOmbre} />
        <path d="M12.6 8.6C11.7 9.7 11.4 10.9 11.4 12.1" fill="none" stroke={C.kwanga} strokeOpacity="0.75" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M11.4 7.1C12.5 5.1 15.6 4.5 17.8 6.5C16.1 7.8 13.5 8.1 11.4 7.1Z" fill={C.feuille} />
      </g>
    </g>
  )
}

export function IlloPiments({ active }: IlloProps) {
  return (
    <svg {...SVG_PROPS} className={`${styles.illo} h-full w-full overflow-visible`} data-active={active}>
      <circle cx="210" cy="176" r="150" fill={C.kwanga} fillOpacity="0.4" />

      <g id="piments">
        <Piment x={-44} y={84} scale={8.4} rotate={-34} delay={0.4} />
        <Piment x={92} y={-14} scale={13} rotate={6} delay={0} />
        <Piment x={262} y={196} scale={5.6} rotate={42} delay={0.8} />
      </g>

      <g id="curseur">
        <rect x="60" y="358" width="280" height="28" rx="14" fill={C.encre} />
        <rect className={styles.jauge} x="66" y="364" width="268" height="16" rx="8" fill={C.liboke} />
        <g className={styles.curseur}>
          <circle cx="82" cy="372" r="24" fill={C.kwanga} />
          <circle cx="82" cy="372" r="10" fill={C.pili} />
        </g>
        <text x="60" y="416" fontSize="17" fontWeight="800" fill={C.encre}>Doux</text>
        <text x="340" y="416" fontSize="17" fontWeight="800" fill={C.encre} textAnchor="end">Fort</text>
      </g>
    </svg>
  )
}

// ─── Slide 3 — le suivi ───────────────────────────────────────────

function Roue({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy="316" r="36" fill={C.kwanga} />
      <circle cx={cx} cy="316" r="23" fill={C.encreClair} />
      <g className={styles.roue}>
        <path d={`M${cx - 21} 316H${cx + 21}M${cx} 295V337`} stroke={C.kwanga} strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy="316" r="8" fill={C.safou} />
    </g>
  )
}

export function IlloScooter({ active }: IlloProps) {
  return (
    <svg {...SVG_PROPS} className={`${styles.illo} h-full w-full overflow-visible`} data-active={active}>
      <defs>
        <pattern id="illo-sac-frise" width="24" height="22" patternUnits="userSpaceOnUse">
          <path d="M1 21 6 9l5 12Z M13 9h10l-5 12Z" fill={C.encre} />
        </pattern>
      </defs>

      <circle cx="214" cy="186" r="158" fill={C.encreClair} />

      <g id="repere">
        <path d="M344 250C378 206 370 156 340 130" fill="none" stroke={C.kwanga} strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12" />
        <ellipse cx="332" cy="124" rx="17" ry="4.5" fill="#1A100A" />
        <g className={styles.repere}>
          <path d="M332 34C314 34 302 47 302 63C302 84 332 112 332 112C332 112 362 84 362 63C362 47 350 34 332 34Z" fill={C.safou} />
          <path d="M332 34C350 34 362 47 362 63C362 84 332 112 332 112Z" fill={C.safouOmbre} />
          <circle cx="332" cy="63" r="11" fill={C.encre} />
        </g>
      </g>

      <g id="route">
        <path className={styles.route} d="M-140 366H540" stroke={C.kwanga} strokeWidth="6" strokeLinecap="round" strokeDasharray="40 28" />
      </g>
      <ellipse cx="208" cy="355" rx="150" ry="9" fill="#1A100A" />

      <g fill="none" stroke={C.kwanga} strokeWidth="5" strokeLinecap="round">
        <path className={styles.vitesse} d="M-6 176H30" />
        <path className={styles.vitesse} style={{ animationDelay: "0.3s" }} d="M-22 214H24" />
        <path className={styles.vitesse} style={{ animationDelay: "0.6s" }} d="M0 282H30" />
      </g>

      <g id="scooter" className={styles.scooter}>
        <Roue cx={112} />
        <Roue cx={306} />

        {/* Fourche, garde-boue et phare */}
        <path d="M300 214 306 316" stroke={C.kwanga} strokeWidth="7" strokeLinecap="round" />
        <path d="M266.5 301.6A42 42 0 0 1 345.5 301.6" fill="none" stroke={C.liboke} strokeWidth="11" strokeLinecap="round" />
        <path d="M320 214 398 190V254L320 232Z" fill={C.safou} fillOpacity="0.28" />

        {/* Carrosserie */}
        <path d="M68 300C68 262 96 248 132 248H212C223 248 227 257 223 267L210 300Z" fill={C.liboke} />
        <path d="M68 300C68 280 77 266 92 258L112 300Z" fill={C.braise} />
        <rect x="204" y="286" width="76" height="16" rx="8" fill={C.liboke} />
        <path d="M266 302 288 204C290 195 300 193 306 200L313 209 292 302Z" fill={C.liboke} />
        <path d="M292 302 313 209 306 200C304 198 302 197 300 197L280 302Z" fill={C.braise} />
        <circle cx="314" cy="223" r="8.5" fill={C.safou} />
        <path d="M296 206 286 184" stroke={C.kwanga} strokeWidth="7" strokeLinecap="round" />
        <path d="M272 181 300 176" stroke={C.kwanga} strokeWidth="9" strokeLinecap="round" />
        <rect x="120" y="232" width="96" height="20" rx="10" fill={C.sable} />

        {/* Sac isotherme */}
        <rect x="70" y="228" width="60" height="8" rx="4" fill={C.kwanga} />
        <rect x="42" y="132" width="100" height="98" rx="14" fill={C.safou} />
        <path d="M116 132H128C135.7 132 142 138.3 142 146V216C142 223.7 135.7 230 128 230H116Z" fill={C.safouOmbre} />
        <rect x="42" y="186" width="100" height="22" fill="url(#illo-sac-frise)" />
        <path d="M42 160H142" stroke={C.encre} strokeWidth="4" />
        <rect x="78" y="151" width="28" height="18" rx="6" fill={C.encre} />

        {/* Livreur */}
        <path d="M176 238 232 252 238 292" fill="none" stroke={C.pili} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="247" cy="298" rx="19" ry="9" fill={C.kwanga} />
        <path d="M150 246C146 198 162 158 196 144C216 138 232 152 230 174L220 246Z" fill={C.kwanga} />
        <path d="M196 144C216 138 232 152 230 174L220 246H200C210 210 212 172 196 144Z" fill={C.sable} />
        <path d="M208 168 246 202 282 186" fill="none" stroke={C.kwanga} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="285" cy="184" r="9.5" fill={C.peau} />
        <circle cx="214" cy="114" r="27" fill={C.peau} />
        <path d="M185 118A29 30 0 0 1 243 118Z" fill={C.liboke} />
        <path d="M185 118V132C185 138 190 142 196 142H202V118Z" fill={C.liboke} />
        <path d="M185 118H250" stroke={C.kwanga} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
