import { Resvg } from "@resvg/resvg-js"
import * as fs from "fs"
import * as path from "path"

const OUTPUT_DIR = path.join(process.cwd(), "public", "images")

interface PilotVisualSpec {
  id: string
  name: string
  callsign: string
  gender: "Nam" | "Nữ"
  age: number
  themeColor: string
  accentColor: string
  bgColor: string
  hairColor: string
  eyeColor: string
  suitColor: string
  bootsColor: string
}

export const PILOT_SPECS: Record<string, PilotVisualSpec> = {
  marcus: {
    id: "marcus",
    name: "Marcus Thorne",
    callsign: "WAR DOG",
    gender: "Nam",
    age: 30,
    themeColor: "#06b6d4",
    accentColor: "#38bdf8",
    bgColor: "#082f49",
    hairColor: "#3e2723",
    eyeColor: "#78350f",
    suitColor: "#1e293b",
    bootsColor: "#0f172a",
  },
  valentine: {
    id: "valentine",
    name: "Valentine Vance",
    callsign: "AEGIS ANGEL",
    gender: "Nữ",
    age: 22,
    themeColor: "#f59e0b",
    accentColor: "#10b981",
    bgColor: "#14532d",
    hairColor: "#fef08a",
    eyeColor: "#0284c7",
    suitColor: "#f8fafc",
    bootsColor: "#ffffff",
  },
  alviss: {
    id: "alviss",
    name: "Alviss Drake",
    callsign: "GHOSTFIRE",
    gender: "Nam",
    age: 26,
    themeColor: "#a855f7",
    accentColor: "#c084fc",
    bgColor: "#3b0764",
    hairColor: "#18181b",
    eyeColor: "#f59e0b",
    suitColor: "#1e1b4b",
    bootsColor: "#09090b",
  },
  eric: {
    id: "eric",
    name: "Eric Brandt",
    callsign: "BUNKER BREAKER",
    gender: "Nam",
    age: 28,
    themeColor: "#ef4444",
    accentColor: "#f97316",
    bgColor: "#450a0a",
    hairColor: "#1c1917",
    eyeColor: "#57534e",
    suitColor: "#292524",
    bootsColor: "#18181b",
  },
  lyra: {
    id: "lyra",
    name: "Lyra Song",
    callsign: "VALKYRIE",
    gender: "Nữ",
    age: 24,
    themeColor: "#c084fc",
    accentColor: "#e879f9",
    bgColor: "#2e1065",
    hairColor: "#e9d5ff",
    eyeColor: "#a855f7",
    suitColor: "#1e1b4b",
    bootsColor: "#312e81",
  },
  kaelen: {
    id: "kaelen",
    name: "Kaelen Quinn",
    callsign: "WRAITH",
    gender: "Nữ",
    age: 25,
    themeColor: "#14b8a6",
    accentColor: "#06b6d4",
    bgColor: "#042f2e",
    hairColor: "#0f172a",
    eyeColor: "#2dd4bf",
    suitColor: "#090d16",
    bootsColor: "#020617",
  },
  selena: {
    id: "selena",
    name: "Selena Vega",
    callsign: "SOLARIS",
    gender: "Nữ",
    age: 27,
    themeColor: "#ea580c",
    accentColor: "#fbbf24",
    bgColor: "#431407",
    hairColor: "#991b1b",
    eyeColor: "#f59e0b",
    suitColor: "#450a0a",
    bootsColor: "#7c2d12",
  },
  victor: {
    id: "victor",
    name: "Victor Sterling",
    callsign: "TITAN GAUSS",
    gender: "Nam",
    age: 34,
    themeColor: "#d97706",
    accentColor: "#fbbf24",
    bgColor: "#292524",
    hairColor: "#71717a",
    eyeColor: "#38bdf8",
    suitColor: "#1c1917",
    bootsColor: "#0c0a09",
  },
}

function generateFullBodySvg(spec: PilotVisualSpec): string {
  const isFemale = spec.gender === "Nữ"
  const w = 900
  const h = 1600

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bg_${spec.id}" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="${spec.accentColor}" stop-opacity="0.35" />
      <stop offset="45%" stop-color="${spec.bgColor}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#020204" />
    </radialGradient>

    <!-- Suit Gradient -->
    <linearGradient id="suit_${spec.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${spec.suitColor}" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="glow_${spec.id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Soft Drop Shadow -->
    <filter id="shadow_${spec.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- 1. Background: Atmospheric Sci-Fi Aerospace Hangar -->
  <rect width="${w}" height="${h}" fill="url(#bg_${spec.id})" />

  <!-- Subtle Perspective Floor Grid -->
  <g opacity="0.18" stroke="${spec.themeColor}" stroke-width="1.5">
    <line x1="150" y1="1600" x2="380" y2="1150" />
    <line x1="300" y1="1600" x2="420" y2="1150" />
    <line x1="600" y1="1600" x2="480" y2="1150" />
    <line x1="750" y1="1600" x2="520" y2="1150" />
    <line x1="50" y1="1150" x2="850" y2="1150" stroke-dasharray="12 12" />
    <line x1="30" y1="1300" x2="870" y2="1300" stroke-dasharray="16 12" />
    <line x1="0" y1="1480" x2="900" y2="1480" stroke-dasharray="24 16" />
  </g>

  <!-- Volumetric Nebula Starfield & Energy Dust -->
  <g opacity="0.4">
    <circle cx="200" cy="300" r="3" fill="#ffffff" />
    <circle cx="720" cy="240" r="2.5" fill="#ffffff" />
    <circle cx="340" cy="180" r="2" fill="${spec.themeColor}" />
    <circle cx="600" cy="360" r="3" fill="${spec.accentColor}" />
    <circle cx="150" cy="550" r="2" fill="#ffffff" />
    <circle cx="780" cy="620" r="2.5" fill="${spec.themeColor}" />
    <circle cx="280" cy="750" r="1.5" fill="#ffffff" />
    <circle cx="680" cy="880" r="2" fill="${spec.accentColor}" />
  </g>

  <!-- Silhouette Aura Behind Pilot -->
  <ellipse cx="450" cy="800" rx="260" ry="580" fill="${spec.themeColor}" opacity="0.14" filter="url(#glow_${spec.id})" />

  <!-- ==================================================================== -->
  <!-- 2. CHARACTER MODEL: COMPLETE HEAD-TO-TOE ARTWORK                     -->
  <!-- ==================================================================== -->
  <g filter="url(#shadow_${spec.id})">
    ${
      isFemale
        ? generateFemaleBody(spec)
        : generateMaleBody(spec)
    }
  </g>
</svg>`
}

function generateFemaleBody(spec: PilotVisualSpec): string {
  return `<!-- FEMALE PILOT: ELEGANT & AGILE SILHOUETTE (HEAD TO TOE) -->
    <!-- A. BOOTS & FEET (Y: 1260 to 1480) -->
    <g id="boots">
      <!-- Left Boot -->
      <path d="M 330 1250 L 305 1410 Q 300 1445 345 1455 L 405 1455 Q 415 1435 410 1250 Z" fill="${spec.bootsColor}" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Left Sole & Heel -->
      <path d="M 295 1445 L 415 1445 L 420 1465 L 290 1465 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Left Boot Glow Strap -->
      <rect x="315" y="1320" width="85" height="10" rx="3" fill="${spec.themeColor}" opacity="0.85" filter="url(#glow_${spec.id})" />

      <!-- Right Boot -->
      <path d="M 490 1250 L 485 1435 Q 480 1455 550 1455 L 600 1445 Q 605 1410 570 1250 Z" fill="${spec.bootsColor}" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Right Sole & Heel -->
      <path d="M 480 1445 L 610 1445 L 610 1465 L 480 1465 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Right Boot Glow Strap -->
      <rect x="500" y="1320" width="85" height="10" rx="3" fill="${spec.themeColor}" opacity="0.85" filter="url(#glow_${spec.id})" />
    </g>

    <!-- B. LEGS & THIGHS IN NANO-SUIT (Y: 820 to 1250) -->
    <g id="legs">
      <!-- Left Thigh & Shin -->
      <path d="M 365 830 Q 330 1020 345 1250 L 405 1250 Q 425 1020 425 830 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Right Thigh & Shin -->
      <path d="M 475 830 Q 475 1020 495 1250 L 565 1250 Q 575 1020 535 830 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2" />

      <!-- Kneepads with kinetic stabilizers -->
      <path d="M 335 1060 L 415 1060 L 410 1120 L 340 1120 Z" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2" />
      <circle cx="375" cy="1090" r="6" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />

      <path d="M 490 1060 L 570 1060 L 565 1120 L 495 1120 Z" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2" />
      <circle cx="530" cy="1090" r="6" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />

      <!-- Tactical Holster / Thigh Strap -->
      <rect x="330" y="930" width="88" height="16" rx="4" fill="#3f3f46" stroke="${spec.themeColor}" stroke-width="1.5" />
      <rect x="345" y="946" width="35" height="55" rx="5" fill="#18181b" stroke="${spec.themeColor}" stroke-width="1.5" />
    </g>

    <!-- C. TACTICAL SHORT SKIRT / WAIST / UTILITY BELT (Y: 740 to 860) -->
    <g id="skirt_and_waist">
      <!-- Flared Tactical Short Skirt -->
      <path d="M 360 750 Q 450 765 540 750 L 595 860 Q 450 885 305 860 Z" fill="${spec.suitColor}" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Skirt Pleats / Armor Panels -->
      <path d="M 390 755 L 370 865" stroke="${spec.themeColor}" stroke-width="1.5" opacity="0.7" />
      <path d="M 450 760 L 450 875" stroke="${spec.themeColor}" stroke-width="2" opacity="0.9" />
      <path d="M 510 755 L 530 865" stroke="${spec.themeColor}" stroke-width="1.5" opacity="0.7" />

      <!-- High-tech Utility Belt -->
      <rect x="350" y="735" width="200" height="26" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Belt Buckle Core -->
      <rect x="430" y="730" width="40" height="36" rx="5" fill="#27272a" stroke="${spec.accentColor}" stroke-width="2" />
      <circle cx="450" cy="748" r="7" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
    </g>

    <!-- D. TORSO, BODICE & ARMORED FLIGHT BOLERO (Y: 480 to 740) -->
    <g id="torso">
      <!-- Hourglass Bodice -->
      <path d="M 370 510 Q 345 620 365 740 L 535 740 Q 555 620 530 510 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2.5" />

      <!-- Chest Armor Cuirass / Tailored Bolero Jacket -->
      <path d="M 350 490 Q 450 515 550 490 L 540 610 Q 450 645 360 610 Z" fill="${spec.suitColor}" stroke="${spec.themeColor}" stroke-width="2.5" />

      <!-- Chest Accent Lines & Core Emitter -->
      <path d="M 400 520 L 450 560 L 500 520" fill="none" stroke="${spec.themeColor}" stroke-width="3" />
      <circle cx="450" cy="575" r="9" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
      <circle cx="450" cy="575" r="4" fill="#ffffff" />

      <!-- Collar & Neck -->
      <path d="M 415 450 L 485 450 L 495 500 L 405 500 Z" fill="#fed7aa" stroke="${spec.themeColor}" stroke-width="1.5" />
      <path d="M 405 480 Q 450 495 495 480 L 485 510 Q 450 520 415 510 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
    </g>

    <!-- E. ARMS & HANDS (Y: 490 to 860) -->
    <g id="arms">
      <!-- Left Arm -->
      <path d="M 350 490 Q 280 620 285 760 L 325 760 Q 330 630 380 500 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Left Pauldron Shoulder Armor -->
      <path d="M 330 470 L 380 470 L 370 540 L 320 520 Z" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Left Forearm Gauntlet & Holographic Telemetry Screen -->
      <rect x="275" y="680" width="45" height="70" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <rect x="282" y="695" width="30" height="40" rx="3" fill="${spec.themeColor}" opacity="0.9" filter="url(#glow_${spec.id})" />
      <!-- Left Hand -->
      <path d="M 285 760 Q 280 810 305 825 L 325 810 L 320 760 Z" fill="#fed7aa" stroke="${spec.themeColor}" stroke-width="1.5" />

      <!-- Right Arm (Raised Gracefully / Tactically) -->
      <path d="M 545 490 Q 610 600 620 730 L 580 740 Q 565 620 525 500 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Right Pauldron -->
      <path d="M 520 470 L 570 470 L 580 520 L 530 540 Z" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Right Forearm Gauntlet -->
      <rect x="580" y="660" width="45" height="70" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <!-- Right Hand with Energy Shimmer -->
      <path d="M 590 730 Q 625 770 635 790 L 615 805 L 580 740 Z" fill="#fed7aa" stroke="${spec.themeColor}" stroke-width="1.5" />
      <!-- Radiant Energy Hex Ring on Hand -->
      <polygon points="620,775 640,765 650,785 640,805 620,805 610,785" fill="none" stroke="${spec.accentColor}" stroke-width="2" filter="url(#glow_${spec.id})" />
    </g>

    <!-- F. HEAD, FACE & ANIME-REALISTIC HAIR (Y: 230 to 460) -->
    <g id="head">
      <!-- Hair Back / Twin Tails / Flowing Waves -->
      <path d="M 340 330 Q 230 460 250 680 Q 320 580 370 420 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="1.5" />
      <path d="M 560 330 Q 670 460 650 680 Q 580 580 530 420 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="1.5" />

      <!-- Face Contour -->
      <path d="M 390 320 Q 380 410 450 465 Q 520 410 510 320 Z" fill="#ffedd5" stroke="#fed7aa" stroke-width="1.5" />

      <!-- Eyes (Anime-Realistic Expressive) -->
      <!-- Left Eye -->
      <ellipse cx="420" cy="370" rx="15" ry="10" fill="#ffffff" />
      <ellipse cx="422" cy="370" rx="9" ry="9" fill="${spec.eyeColor}" />
      <circle cx="425" cy="367" r="3.5" fill="#ffffff" />
      <path d="M 405 362 Q 420 355 436 362" stroke="#18181b" stroke-width="2.5" fill="none" />

      <!-- Right Eye -->
      <ellipse cx="480" cy="370" rx="15" ry="10" fill="#ffffff" />
      <ellipse cx="478" cy="370" rx="9" ry="9" fill="${spec.eyeColor}" />
      <circle cx="481" cy="367" r="3.5" fill="#ffffff" />
      <path d="M 464 362 Q 480 355 495 362" stroke="#18181b" stroke-width="2.5" fill="none" />

      <!-- Nose & Delicate Lips -->
      <path d="M 450 385 L 447 398 L 452 399" stroke="#fdba74" stroke-width="1.5" fill="none" />
      <path d="M 440 420 Q 450 428 460 420" stroke="#f43f5e" stroke-width="2.5" fill="none" />

      <!-- Bangs / Front Hair Strands -->
      <path d="M 360 320 Q 420 220 540 320 Q 520 380 470 340 Q 450 380 430 340 Q 390 380 360 320 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="1.5" />
      <!-- Communication Earpiece / Headset -->
      <rect x="365" y="355" width="12" height="24" rx="4" fill="#18181b" stroke="${spec.accentColor}" stroke-width="1.5" />
      <circle cx="371" cy="367" r="3" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
    </g>`
}

function generateMaleBody(spec: PilotVisualSpec): string {
  return `<!-- MALE PILOT: MUSCULAR & TACTICAL SILHOUETTE (HEAD TO TOE) -->
    <!-- A. BOOTS & MAGNETIC TACTICAL SOLES (Y: 1250 to 1480) -->
    <g id="boots_male">
      <!-- Left Boot -->
      <path d="M 310 1240 L 290 1420 Q 285 1455 335 1460 L 415 1460 Q 425 1435 415 1240 Z" fill="${spec.bootsColor}" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Left Reinforced Steel Sole -->
      <path d="M 275 1445 L 425 1445 L 430 1470 L 270 1470 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <rect x="300" y="1330" width="105" height="12" rx="3" fill="${spec.themeColor}" opacity="0.8" filter="url(#glow_${spec.id})" />

      <!-- Right Boot -->
      <path d="M 485 1240 L 475 1435 Q 475 1460 555 1460 L 610 1445 Q 615 1410 590 1240 Z" fill="${spec.bootsColor}" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Right Reinforced Steel Sole -->
      <path d="M 470 1445 L 625 1445 L 625 1470 L 470 1470 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <rect x="495" y="1330" width="105" height="12" rx="3" fill="${spec.themeColor}" opacity="0.8" filter="url(#glow_${spec.id})" />
    </g>

    <!-- B. LEGS & TACTICAL CARGO EXOSUIT (Y: 820 to 1250) -->
    <g id="legs_male">
      <!-- Left Leg -->
      <path d="M 350 820 L 320 1050 L 330 1250 L 415 1250 L 435 1050 L 440 820 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Right Leg -->
      <path d="M 460 820 L 465 1050 L 485 1250 L 575 1250 L 585 1050 L 550 820 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2.5" />

      <!-- Heavy Angular Kneepads -->
      <polygon points="310,1050 425,1050 415,1120 320,1120" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2.5" />
      <rect x="345" y="1075" width="45" height="15" rx="3" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />

      <polygon points="475,1050 590,1050 580,1120 485,1120" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2.5" />
      <rect x="510" y="1075" width="45" height="15" rx="3" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />

      <!-- Side Holster & Demolition Ammo Pouches -->
      <rect x="295" y="900" width="40" height="70" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
      <rect x="565" y="900" width="40" height="70" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2" />
    </g>

    <!-- C. WAIST, COMBAT HARNESS & MODULAR BELT (Y: 740 to 830) -->
    <g id="waist_male">
      <rect x="330" y="750" width="240" height="40" rx="6" fill="#18181b" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Heavy Duty Buckle -->
      <rect x="420" y="745" width="60" height="50" rx="6" fill="#27272a" stroke="${spec.accentColor}" stroke-width="2.5" />
      <circle cx="450" cy="770" r="10" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
      <circle cx="450" cy="770" r="4" fill="#ffffff" />
    </g>

    <!-- D. BROAD TORSO & MECHANICAL CUIRASS (Y: 460 to 760) -->
    <g id="torso_male">
      <!-- V-Taper Muscular Torso -->
      <path d="M 300 480 L 340 760 L 560 760 L 600 480 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="3" />

      <!-- Heavy Plated Armor Cuirass -->
      <path d="M 320 480 L 580 480 L 540 660 L 360 660 Z" fill="${spec.suitColor}" stroke="${spec.themeColor}" stroke-width="3" />
      <line x1="450" y1="480" x2="450" y2="660" stroke="${spec.themeColor}" stroke-width="2" />

      <!-- Reactor Arc Core / Telemetry Beacon -->
      <polygon points="450,530 480,570 450,610 420,570" fill="#09090b" stroke="${spec.accentColor}" stroke-width="3" />
      <circle cx="450" cy="570" r="14" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
      <circle cx="450" cy="570" r="6" fill="#ffffff" />

      <!-- Neck & Collar -->
      <path d="M 405 420 L 495 420 L 515 480 L 385 480 Z" fill="#fed7aa" stroke="#fdba74" stroke-width="2" />
      <path d="M 385 460 L 515 460 L 505 490 L 395 490 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2.5" />
    </g>

    <!-- E. BROAD SHOULDERS, ARMS & ARMORED GAUNTLETS (Y: 460 to 860) -->
    <g id="arms_male">
      <!-- Left Arm -->
      <path d="M 300 480 Q 230 620 250 780 L 295 780 Q 295 640 350 490 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Left Pauldron (Heavy Angular Shoulder Guard) -->
      <polygon points="270,460 350,460 340,540 260,530" fill="#27272a" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Left Gauntlet -->
      <rect x="235" y="680" width="55" height="90" rx="8" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Left Hand / Holding Flight Helmet or Clenched -->
      <ellipse cx="270" cy="815" rx="35" ry="32" fill="#27272a" stroke="${spec.accentColor}" stroke-width="2.5" />
      <rect x="250" y="800" width="40" height="15" rx="4" fill="${spec.themeColor}" opacity="0.9" filter="url(#glow_${spec.id})" />

      <!-- Right Arm -->
      <path d="M 600 480 Q 670 620 650 780 L 605 780 Q 605 640 550 490 Z" fill="url(#suit_${spec.id})" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Right Pauldron -->
      <polygon points="630,460 550,460 560,540 640,530" fill="#27272a" stroke="${spec.themeColor}" stroke-width="3" />
      <!-- Right Gauntlet -->
      <rect x="610" y="680" width="55" height="90" rx="8" fill="#18181b" stroke="${spec.themeColor}" stroke-width="2.5" />
      <!-- Right Arm Clenched Fist -->
      <path d="M 620 780 L 655 780 L 650 835 L 615 830 Z" fill="#27272a" stroke="${spec.themeColor}" stroke-width="2" />
    </g>

    <!-- F. HEAD, FACE & DETERMINED EXPRESSION (Y: 220 to 440) -->
    <g id="head_male">
      <!-- Strong Jaw & Head Contour -->
      <path d="M 380 290 Q 370 380 450 435 Q 530 380 520 290 Z" fill="#ffedd5" stroke="#fed7aa" stroke-width="2" />

      <!-- Sharp Eyes -->
      <!-- Left Eye -->
      <path d="M 395 340 L 435 340 L 430 355 L 400 355 Z" fill="#ffffff" stroke="#18181b" stroke-width="2" />
      <circle cx="415" cy="347" r="7" fill="${spec.eyeColor}" />
      <circle cx="417" cy="345" r="2.5" fill="#ffffff" />
      <line x1="390" y1="332" x2="438" y2="335" stroke="#18181b" stroke-width="3" />

      <!-- Right Eye -->
      <path d="M 465 340 L 505 340 L 500 355 L 470 355 Z" fill="#ffffff" stroke="#18181b" stroke-width="2" />
      <circle cx="485" cy="347" r="7" fill="${spec.eyeColor}" />
      <circle cx="487" cy="345" r="2.5" fill="#ffffff" />
      <line x1="462" y1="335" x2="510" y2="332" stroke="#18181b" stroke-width="3" />

      <!-- Battle Scar / Facial Character -->
      <line x1="495" y1="320" x2="510" y2="345" stroke="#dc2626" stroke-width="2" opacity="0.75" />

      <!-- Strong Nose & Firm Mouth -->
      <path d="M 450 350 L 445 375 L 455 377" stroke="#ea580c" stroke-width="2" fill="none" />
      <line x1="430" y1="400" x2="470" y2="400" stroke="#78350f" stroke-width="2.5" />

      <!-- Hair (Short Textured Military Hair) -->
      <path d="M 360 290 Q 450 200 540 290 L 530 250 Q 450 180 370 250 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="1.5" />
      <!-- Communication Earpiece / Headset -->
      <rect x="360" y="325" width="14" height="28" rx="4" fill="#18181b" stroke="${spec.accentColor}" stroke-width="2" />
      <circle cx="367" cy="339" r="4" fill="${spec.accentColor}" filter="url(#glow_${spec.id})" />
    </g>`
}

function generatePortraitSvg(spec: PilotVisualSpec): string {
  const isFemale = spec.gender === "Nữ"
  const s = 1024

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <radialGradient id="p_bg_${spec.id}" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${spec.accentColor}" stop-opacity="0.4" />
      <stop offset="50%" stop-color="${spec.bgColor}" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#020204" />
    </radialGradient>

    <filter id="p_glow_${spec.id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" fill="url(#p_bg_${spec.id})" />

  <!-- Bokeh Particles -->
  <g opacity="0.3">
    <circle cx="200" cy="200" r="4" fill="#ffffff" />
    <circle cx="850" cy="300" r="5" fill="${spec.accentColor}" />
    <circle cx="300" cy="750" r="3" fill="${spec.themeColor}" />
    <circle cx="750" cy="800" r="4" fill="#ffffff" />
  </g>

  <!-- Character Aura -->
  <ellipse cx="512" cy="540" rx="320" ry="360" fill="${spec.themeColor}" opacity="0.2" filter="url(#p_glow_${spec.id})" />

  <!-- Character Bust Portrait -->
  <g transform="translate(62, -20) scale(1.0)">
    ${
      isFemale
        ? `<!-- Female Bust -->
        <!-- Hair Back -->
        <path d="M 310 400 Q 180 540 220 820 Q 320 700 370 520 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="2" />
        <path d="M 590 400 Q 720 540 680 820 Q 580 700 530 520 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="2" />

        <!-- Shoulders & Flight Jacket -->
        <path d="M 230 800 Q 450 750 670 800 L 730 1050 L 170 1050 Z" fill="${spec.suitColor}" stroke="${spec.themeColor}" stroke-width="4" />
        <path d="M 330 780 Q 450 810 570 780 L 530 1050 L 370 1050 Z" fill="#1e1b4b" stroke="${spec.themeColor}" stroke-width="3" />
        
        <!-- Chest Emitter -->
        <circle cx="450" cy="870" r="18" fill="${spec.accentColor}" filter="url(#p_glow_${spec.id})" />
        <circle cx="450" cy="870" r="8" fill="#ffffff" />

        <!-- Neck -->
        <path d="M 390 620 L 510 620 L 525 780 L 375 780 Z" fill="#fed7aa" stroke="#fdba74" stroke-width="2" />
        <path d="M 375 750 Q 450 780 525 750 L 515 800 Q 450 820 385 800 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="3" />

        <!-- Face -->
        <path d="M 350 440 Q 330 580 450 680 Q 570 580 550 440 Z" fill="#ffedd5" stroke="#fed7aa" stroke-width="2" />

        <!-- Left Eye -->
        <ellipse cx="400" cy="510" rx="24" ry="16" fill="#ffffff" />
        <ellipse cx="404" cy="510" rx="14" ry="14" fill="${spec.eyeColor}" />
        <circle cx="408" cy="505" r="5" fill="#ffffff" />
        <path d="M 375 496 Q 400 485 425 496" stroke="#18181b" stroke-width="4" fill="none" />

        <!-- Right Eye -->
        <ellipse cx="500" cy="510" rx="24" ry="16" fill="#ffffff" />
        <ellipse cx="496" cy="510" rx="14" ry="14" fill="${spec.eyeColor}" />
        <circle cx="500" cy="505" r="5" fill="#ffffff" />
        <path d="M 475 496 Q 500 485 525 496" stroke="#18181b" stroke-width="4" fill="none" />

        <!-- Nose & Lips -->
        <path d="M 450 540 L 444 560 L 454 562" stroke="#fdba74" stroke-width="2.5" fill="none" />
        <path d="M 430 600 Q 450 615 470 600" stroke="#f43f5e" stroke-width="4" fill="none" />

        <!-- Bangs / Front Hair -->
        <path d="M 310 440 Q 410 290 590 440 Q 560 540 480 470 Q 450 540 420 470 Q 360 540 310 440 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="2" />
        <!-- Headset -->
        <rect x="315" y="490" width="18" height="38" rx="6" fill="#18181b" stroke="${spec.accentColor}" stroke-width="2.5" />
        <circle cx="324" cy="509" r="5" fill="${spec.accentColor}" filter="url(#p_glow_${spec.id})" />`
        : `<!-- Male Bust -->
        <!-- Broad Shoulders & Heavy Cuirass -->
        <path d="M 170 780 Q 450 710 730 780 L 800 1050 L 100 1050 Z" fill="${spec.suitColor}" stroke="${spec.themeColor}" stroke-width="4" />
        <path d="M 280 770 L 620 770 L 570 1050 L 330 1050 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="3" />
        <circle cx="450" cy="880" r="24" fill="${spec.accentColor}" filter="url(#p_glow_${spec.id})" />
        <circle cx="450" cy="880" r="10" fill="#ffffff" />

        <!-- Neck -->
        <path d="M 370 580 L 530 580 L 550 770 L 350 770 Z" fill="#fed7aa" stroke="#fdba74" stroke-width="2.5" />
        <path d="M 350 720 L 550 720 L 535 770 L 365 770 Z" fill="#18181b" stroke="${spec.themeColor}" stroke-width="3" />

        <!-- Jaw & Face -->
        <path d="M 340 390 Q 320 540 450 640 Q 580 540 560 390 Z" fill="#ffedd5" stroke="#fed7aa" stroke-width="2.5" />

        <!-- Left Eye -->
        <path d="M 370 480 L 425 480 L 420 500 L 375 500 Z" fill="#ffffff" stroke="#18181b" stroke-width="2.5" />
        <circle cx="400" cy="490" r="10" fill="${spec.eyeColor}" />
        <circle cx="403" cy="487" r="3.5" fill="#ffffff" />
        <line x1="360" y1="468" x2="430" y2="472" stroke="#18181b" stroke-width="4" />

        <!-- Right Eye -->
        <path d="M 475 480 L 530 480 L 525 500 L 480 500 Z" fill="#ffffff" stroke="#18181b" stroke-width="2.5" />
        <circle cx="500" cy="490" r="10" fill="${spec.eyeColor}" />
        <circle cx="503" cy="487" r="3.5" fill="#ffffff" />
        <line x1="470" y1="472" x2="540" y2="468" stroke="#18181b" stroke-width="4" />

        <!-- Scar -->
        <line x1="515" y1="450" x2="535" y2="490" stroke="#dc2626" stroke-width="3" opacity="0.8" />

        <!-- Nose & Mouth -->
        <path d="M 450 495 L 442 535 L 458 538" stroke="#ea580c" stroke-width="3" fill="none" />
        <line x1="420" y1="575" x2="480" y2="575" stroke="#78350f" stroke-width="3.5" />

        <!-- Short Textured Military Hair -->
        <path d="M 310 390 Q 450 250 590 390 L 570 330 Q 450 230 330 330 Z" fill="${spec.hairColor}" stroke="${spec.themeColor}" stroke-width="2" />
        <!-- Headset -->
        <rect x="310" y="450" width="18" height="42" rx="6" fill="#18181b" stroke="${spec.accentColor}" stroke-width="2.5" />
        <circle cx="319" cy="471" r="5" fill="${spec.accentColor}" filter="url(#p_glow_${spec.id})" />`
    }
  </g>
</svg>`
}

async function run() {
  console.log("=== BẮT ĐẦU TẠO CONCEPT ART CHO 8 PILOT STARFRONT ===")

  for (const pilotId of Object.keys(PILOT_SPECS)) {
    const spec = PILOT_SPECS[pilotId]
    console.log(`\n-> Đang tạo asset cho Pilot: ${spec.name} (${spec.callsign}) [${spec.gender}, ${spec.age}t]`)

    // 1. Tạo Full-body SVG
    const fullbodySvg = generateFullBodySvg(spec)
    const fullbodySvgPath = path.join(OUTPUT_DIR, `${spec.id}-fullbody.svg`)
    fs.writeFileSync(fullbodySvgPath, fullbodySvg, "utf8")

    // 2. Render Full-body PNG (900x1600, 9:16)
    const resvgFullbody = new Resvg(fullbodySvg, {
      fitTo: { mode: "width", value: 900 },
    })
    const fullbodyPng = resvgFullbody.render().asPng()
    const fullbodyPngPath = path.join(OUTPUT_DIR, `${spec.id}-fullbody.png`)
    fs.writeFileSync(fullbodyPngPath, fullbodyPng)
    console.log(`  ✓ Đã lưu Full-Body PNG: ${fullbodyPngPath} (${Math.round(fullbodyPng.length / 1024)} KB)`)

    // 3. Tạo Portrait SVG
    const portraitSvg = generatePortraitSvg(spec)
    const portraitSvgPath = path.join(OUTPUT_DIR, `${spec.id}-portrait.svg`)
    fs.writeFileSync(portraitSvgPath, portraitSvg, "utf8")

    // 4. Render Portrait PNG (1024x1024, 1:1)
    const resvgPortrait = new Resvg(portraitSvg, {
      fitTo: { mode: "width", value: 1024 },
    })
    const portraitPng = resvgPortrait.render().asPng()
    const portraitPngPath = path.join(OUTPUT_DIR, `${spec.id}-portrait.png`)
    fs.writeFileSync(portraitPngPath, portraitPng)

    // Đồng thời đồng bộ portrait jpg nếu cần
    const portraitJpgPath = path.join(OUTPUT_DIR, `${spec.id}-portrait.jpg`)
    fs.writeFileSync(portraitJpgPath, portraitPng)
    console.log(`  ✓ Đã lưu Portrait PNG & JPG: ${portraitPngPath} (${Math.round(portraitPng.length / 1024)} KB)`)
  }

  console.log("\n=== HOÀN TẤT TẠO TOÀN BỘ ASSET CHO 8 PILOT (4 NAM & 4 NỮ) ===")
}

run().catch((err) => {
  console.error("Lỗi tạo ảnh:", err)
  process.exit(1)
})
