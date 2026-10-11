const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'images');

// 1. Victor Cross Portrait (Amber/Bronze Fortress Commander)
const victorPortrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1200" width="896" height="1200">
  <defs>
    <radialGradient id="vSpaceBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#241708" />
      <stop offset="50%" stop-color="#140c04" />
      <stop offset="100%" stop-color="#050301" />
    </radialGradient>
    <radialGradient id="vAmberGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#78350f" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="vExoArmor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="35%" stop-color="#b45309" />
      <stop offset="70%" stop-color="#3f3f46" />
      <stop offset="100%" stop-color="#18181b" />
    </linearGradient>
    <linearGradient id="vAmberCore" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <filter id="vGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="896" height="1200" fill="url(#vSpaceBg)" />
  <rect width="896" height="1200" fill="url(#vAmberGlow)" />
  
  <!-- Holographic Bastion Grid -->
  <g opacity="0.3" stroke="#f59e0b" stroke-width="1.5" fill="none">
    <circle cx="448" cy="400" r="280" stroke-dasharray="10 15" />
    <circle cx="448" cy="400" r="180" stroke-dasharray="4 8" />
    <line x1="168" y1="400" x2="728" y2="400" stroke-dasharray="8 8" />
    <polygon points="448,150 648,500 248,500" stroke-width="1" opacity="0.4" />
  </g>

  <!-- Body / Armor Silhouette -->
  <g id="victor-silhouette">
    <!-- Heavy Shoulders & Chest -->
    <path d="M 120 1200 L 220 780 L 330 680 L 448 720 L 566 680 L 676 780 L 776 1200 Z" fill="url(#vExoArmor)" stroke="#f59e0b" stroke-width="3" />
    <!-- Armor Collars & Plates -->
    <polygon points="280,720 380,750 448,730 516,750 616,720 560,860 336,860" fill="#27272a" stroke="#d97706" stroke-width="2" />
    <!-- Glowing Power Nodes -->
    <circle cx="330" cy="780" r="14" fill="url(#vAmberCore)" filter="url(#vGlow)" />
    <circle cx="566" cy="780" r="14" fill="url(#vAmberCore)" filter="url(#vGlow)" />
    <rect x="420" y="780" width="56" height="12" rx="6" fill="#fef08a" filter="url(#vGlow)" />

    <!-- Neck & Face -->
    <path d="M 380 660 L 448 720 L 516 660 L 500 500 L 396 500 Z" fill="#d4a373" />
    <!-- Head & Beard -->
    <path d="M 370 420 C 370 300, 526 300, 526 420 C 526 530, 490 570, 448 570 C 406 570, 370 530, 370 420 Z" fill="#e29578" />
    <!-- Hair & Beard -->
    <path d="M 350 400 C 350 260, 546 260, 546 400 L 530 420 C 530 330, 366 330, 366 420 Z" fill="#3f3f46" />
    <path d="M 380 470 C 380 580, 516 580, 516 470 L 490 510 C 470 540, 426 540, 406 510 Z" fill="#27272a" />
    <!-- Determined Eyes & Brow -->
    <rect x="400" y="420" width="36" height="8" rx="4" fill="#18181b" />
    <rect x="460" y="420" width="36" height="8" rx="4" fill="#18181b" />
    <circle cx="418" cy="435" r="7" fill="#f59e0b" filter="url(#vGlow)" />
    <circle cx="478" cy="435" r="7" fill="#f59e0b" filter="url(#vGlow)" />
  </g>

  <!-- Telemetry HUD Overlay -->
  <text x="50" y="90" font-family="monospace" font-size="28" font-weight="bold" fill="#f59e0b" letter-spacing="4">VICTOR CROSS // IRON WALL</text>
  <text x="50" y="130" font-family="monospace" font-size="16" fill="#fef08a" opacity="0.8">BASTION FLEET VETERAN · TACTICAL SHIELD PROTOCOL</text>
  <rect x="50" y="150" width="160" height="4" fill="#f59e0b" />
</svg>`;

// 2. Kaelen Voss Portrait (Neon-Orange Solar Striker)
const kaelenPortrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1200" width="896" height="1200">
  <defs>
    <radialGradient id="kSpaceBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#261005" />
      <stop offset="50%" stop-color="#140802" />
      <stop offset="100%" stop-color="#040201" />
    </radialGradient>
    <radialGradient id="kOrangeGlow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#ea580c" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="kHairCopper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="50%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#9a3412" />
    </linearGradient>
    <filter id="kGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="896" height="1200" fill="url(#kSpaceBg)" />
  <rect width="896" height="1200" fill="url(#kOrangeGlow)" />
  
  <!-- Solar Racing Rings -->
  <g opacity="0.35" stroke="#f97316" stroke-width="1.5" fill="none">
    <ellipse cx="448" cy="380" rx="340" ry="140" stroke-dasharray="12 10" transform="rotate(-15 448 380)" />
    <circle cx="448" cy="380" r="160" stroke-dasharray="5 7" />
  </g>

  <!-- Body & Jacket -->
  <g id="kaelen-silhouette">
    <path d="M 160 1200 L 240 760 L 340 660 L 448 700 L 556 660 L 656 760 L 736 1200 Z" fill="#18181b" stroke="#f97316" stroke-width="3" />
    <!-- Orange Racing Stripes -->
    <path d="M 280 820 L 330 670 L 360 670 L 310 820 Z" fill="#f97316" filter="url(#kGlow)" />
    <path d="M 616 820 L 566 670 L 536 670 L 586 820 Z" fill="#f97316" filter="url(#kGlow)" />
    <polygon points="360,700 448,720 536,700 486,880 410,880" fill="#f8fafc" stroke="#ea580c" stroke-width="2" />
    
    <!-- Face & Neck -->
    <path d="M 390 640 L 448 690 L 506 640 L 490 490 L 406 490 Z" fill="#ffedd5" />
    <path d="M 376 430 C 376 310, 520 310, 520 430 C 520 540, 486 580, 448 580 C 410 580, 376 540, 376 430 Z" fill="#fed7aa" />
    
    <!-- Spiky Energetic Hair -->
    <path d="M 350 400 Q 320 330 380 270 Q 430 220 470 250 Q 530 230 540 310 Q 580 370 530 420 Z" fill="url(#kHairCopper)" />
    <path d="M 370 330 L 410 370 L 448 310 L 480 370 L 520 340" stroke="#fef08a" stroke-width="3" fill="none" opacity="0.6" />

    <!-- Tactical Monocle HUD Over Left Eye -->
    <circle cx="484" cy="430" r="22" fill="none" stroke="#f97316" stroke-width="4" filter="url(#kGlow)" />
    <circle cx="484" cy="430" r="10" fill="#fef08a" opacity="0.7" filter="url(#kGlow)" />
    <line x1="506" y1="430" x2="536" y2="415" stroke="#f97316" stroke-width="3" />
    
    <!-- Right Eye -->
    <rect x="400" y="420" width="30" height="6" rx="3" fill="#18181b" />
    <circle cx="415" cy="432" r="6" fill="#f97316" />
    <!-- Smirk -->
    <path d="M 430 520 Q 455 532 470 516" stroke="#c2410c" stroke-width="3" fill="none" stroke-linecap="round" />
  </g>

  <text x="50" y="90" font-family="monospace" font-size="28" font-weight="bold" fill="#f97316" letter-spacing="4">KAELEN VOSS // SOLAR FLARE</text>
  <text x="50" y="130" font-family="monospace" font-size="16" fill="#ffedd5" opacity="0.8">PLASMA STRIKER · THERMAL CRITICAL OVERDRIVE</text>
  <rect x="50" y="150" width="160" height="4" fill="#f97316" />
</svg>`;

// 3. Lyra Sterling Portrait (Ice-Blue Cyber Infiltrator)
const lyraPortrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1200" width="896" height="1200">
  <defs>
    <radialGradient id="lSpaceBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#041824" />
      <stop offset="50%" stop-color="#020d14" />
      <stop offset="100%" stop-color="#010406" />
    </radialGradient>
    <radialGradient id="lCyanGlow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.38" />
      <stop offset="50%" stop-color="#0891b2" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="lHairIce" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#cffafe" />
      <stop offset="50%" stop-color="#67e8f9" />
      <stop offset="100%" stop-color="#0891b2" />
    </linearGradient>
    <filter id="lGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="896" height="1200" fill="url(#lSpaceBg)" />
  <rect width="896" height="1200" fill="url(#lCyanGlow)" />

  <!-- Quantum Lattice Hologram -->
  <g opacity="0.3" stroke="#22d3ee" stroke-width="1.2" fill="none">
    <polygon points="448,220 598,340 598,520 448,640 298,520 298,340" stroke-dasharray="8 6" />
    <circle cx="448" cy="430" r="190" stroke-dasharray="4 6" />
  </g>

  <g id="lyra-silhouette">
    <!-- Slim Sleek Bodysuit -->
    <path d="M 180 1200 L 260 800 L 350 680 L 448 710 L 546 680 L 636 800 L 716 1200 Z" fill="#090d16" stroke="#06b6d4" stroke-width="2.5" />
    <!-- Cyan Energy Traces -->
    <path d="M 330 840 Q 370 740 448 760 Q 526 740 566 840" stroke="#22d3ee" stroke-width="3" fill="none" filter="url(#lGlow)" />
    
    <!-- Neck & Face -->
    <path d="M 400 640 L 448 690 L 496 640 L 484 500 L 412 500 Z" fill="#f0fdfa" />
    <path d="M 386 430 C 386 320, 510 320, 510 430 C 510 535, 480 575, 448 575 C 416 575, 386 535, 386 430 Z" fill="#f8fafc" />

    <!-- Ice-Blue Ponytail & Bangs -->
    <path d="M 360 400 C 360 270, 536 270, 536 400 L 520 430 C 500 320, 396 320, 376 430 Z" fill="url(#lHairIce)" />
    <!-- High Ponytail flowing to the right -->
    <path d="M 520 310 Q 640 330 680 480 Q 690 620 660 720 Q 630 630 580 480 Z" fill="url(#lHairIce)" filter="url(#lGlow)" />
    <circle cx="525" cy="310" r="16" fill="#0891b2" />

    <!-- Silver Eyes & Sensor Headset -->
    <rect x="408" y="426" width="30" height="5" rx="2.5" fill="#334155" />
    <rect x="458" y="426" width="30" height="5" rx="2.5" fill="#334155" />
    <circle cx="423" cy="438" r="6" fill="#67e8f9" filter="url(#lGlow)" />
    <circle cx="473" cy="438" r="6" fill="#67e8f9" filter="url(#lGlow)" />
    <!-- Audio sensor clip on ear -->
    <polygon points="370,430 386,415 386,455" fill="#22d3ee" filter="url(#lGlow)" />
  </g>

  <text x="50" y="90" font-family="monospace" font-size="28" font-weight="bold" fill="#06b6d4" letter-spacing="4">LYRA STERLING // GHOST WEAVER</text>
  <text x="50" y="130" font-family="monospace" font-size="16" fill="#cffafe" opacity="0.8">ELECTRONIC WARFARE · QUANTUM INFILTRATION ACE</text>
  <rect x="50" y="150" width="160" height="4" fill="#06b6d4" />
</svg>`;

// 4. Selena Drake Portrait (Ruby-Red Regal Valkyrie)
const selenaPortrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1200" width="896" height="1200">
  <defs>
    <radialGradient id="sSpaceBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#2b050c" />
      <stop offset="50%" stop-color="#170206" />
      <stop offset="100%" stop-color="#050102" />
    </radialGradient>
    <radialGradient id="sRubyGlow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#be123c" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sHairRuby" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fda4af" />
      <stop offset="35%" stop-color="#e11d48" />
      <stop offset="80%" stop-color="#9f1239" />
      <stop offset="100%" stop-color="#4c0519" />
    </linearGradient>
    <linearGradient id="sGoldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#854d0e" />
    </linearGradient>
    <filter id="sGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="896" height="1200" fill="url(#sSpaceBg)" />
  <rect width="896" height="1200" fill="url(#sRubyGlow)" />

  <!-- Regal Crest Emblem -->
  <g opacity="0.3" stroke="#f43f5e" stroke-width="1.5" fill="none">
    <circle cx="448" cy="410" r="220" stroke-dasharray="14 10" />
    <polygon points="448,190 518,410 448,630 378,410" stroke-width="1.8" />
  </g>

  <g id="selena-silhouette">
    <!-- Regal Military Uniform & Cape -->
    <path d="M 150 1200 L 250 780 L 340 660 L 448 700 L 556 660 L 656 780 L 746 1200 Z" fill="#881337" stroke="url(#sGoldTrim)" stroke-width="3" />
    <!-- Left Shoulder Golden Epaulet & Half-Cape -->
    <path d="M 230 760 Q 200 900 180 1100 L 280 1100 Q 300 900 340 760 Z" fill="#4c0519" stroke="#eab308" stroke-width="2" />
    <rect x="230" y="750" width="80" height="24" rx="6" fill="url(#sGoldTrim)" />
    
    <!-- Neck & Face -->
    <path d="M 396 640 L 448 690 L 500 640 L 488 500 L 408 500 Z" fill="#fff1f2" />
    <path d="M 380 430 C 380 320, 516 320, 516 430 C 516 535, 484 575, 448 575 C 412 575, 380 535, 380 430 Z" fill="#ffe4e6" />

    <!-- Flowing Long Ruby-Red Hair -->
    <path d="M 350 420 C 350 250, 546 250, 546 420 Q 580 600 600 850 Q 530 800 500 650 Q 420 800 370 850 Q 330 650 350 420 Z" fill="url(#sHairRuby)" filter="url(#sGlow)" />

    <!-- Intense Crimson Eyes -->
    <rect x="404" y="424" width="30" height="6" rx="3" fill="#4c0519" />
    <rect x="462" y="424" width="30" height="6" rx="3" fill="#4c0519" />
    <circle cx="419" cy="436" r="7" fill="#f43f5e" filter="url(#sGlow)" />
    <circle cx="477" cy="436" r="7" fill="#f43f5e" filter="url(#sGlow)" />
    
    <!-- Confident Smile -->
    <path d="M 434 522 Q 448 530 462 522" stroke="#be123c" stroke-width="3" fill="none" stroke-linecap="round" />
  </g>

  <text x="50" y="90" font-family="monospace" font-size="28" font-weight="bold" fill="#f43f5e" letter-spacing="4">SELENA DRAKE // CRIMSON VALKYRIE</text>
  <text x="50" y="130" font-family="monospace" font-size="16" fill="#fecdd3" opacity="0.8">ASSAULT FLEET COMMANDER · VALKYRIE EXECUTION PROTOCOL</text>
  <rect x="50" y="150" width="160" height="4" fill="#f43f5e" />
</svg>`;

// Helper function to create 9:16 Full-Body SVGs
function createFullBodySVG(config) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1600" width="900" height="1600">
  <defs>
    <radialGradient id="bg_${config.id}" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="${config.auraColor}" stop-opacity="0.32" />
      <stop offset="50%" stop-color="#0a0a0f" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#020204" />
    </radialGradient>
    <linearGradient id="bodySuit_${config.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.suitColor1}" />
      <stop offset="60%" stop-color="${config.suitColor2}" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <filter id="glow_${config.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Sci-Fi Hangar Deck -->
  <rect width="900" height="1600" fill="url(#bg_${config.id})" />
  
  <!-- Hangar Deck Grid & Perspective Lines -->
  <g opacity="0.25" stroke="${config.auraColor}" stroke-width="1.5">
    <line x1="100" y1="1600" x2="350" y2="1100" />
    <line x1="250" y1="1600" x2="400" y2="1100" />
    <line x1="650" y1="1600" x2="500" y2="1100" />
    <line x1="800" y1="1600" x2="550" y2="1100" />
    <line x1="0" y1="1100" x2="900" y2="1100" stroke-dasharray="10 10" />
    <line x1="0" y1="1250" x2="900" y2="1250" stroke-dasharray="14 10" />
    <line x1="0" y1="1450" x2="900" y2="1450" stroke-dasharray="20 10" />
  </g>

  <!-- Full-Body Character Silhouette Head to Toe -->
  <g id="character-fullbody" transform="translate(0, 100)">
    <!-- Back Glow Aura -->
    <ellipse cx="450" cy="700" rx="220" ry="500" fill="${config.auraColor}" opacity="0.18" filter="url(#glow_${config.id})" />

    <!-- 1. Boots & Feet (Y: 1300 to 1420) -->
    <path d="M 340 1260 L 310 1380 L 390 1390 L 400 1260 Z" fill="#18181b" stroke="${config.auraColor}" stroke-width="2" />
    <path d="M 500 1260 L 510 1390 L 590 1380 L 560 1260 Z" fill="#18181b" stroke="${config.auraColor}" stroke-width="2" />
    <rect x="290" y="1370" width="110" height="24" rx="6" fill="#27272a" stroke="${config.auraColor}" stroke-width="2" />
    <rect x="500" y="1370" width="110" height="24" rx="6" fill="#27272a" stroke="${config.auraColor}" stroke-width="2" />

    <!-- 2. Legs / Thighs / Kneepads (Y: 820 to 1260) -->
    <path d="M 370 820 L 340 1060 L 350 1260 L 420 1260 L 430 1060 L 440 820 Z" fill="url(#bodySuit_${config.id})" stroke="${config.auraColor}" stroke-width="2" />
    <path d="M 460 820 L 470 1060 L 480 1260 L 550 1260 L 560 1060 L 530 820 Z" fill="url(#bodySuit_${config.id})" stroke="${config.auraColor}" stroke-width="2" />
    <!-- Kneepads -->
    <rect x="330" y="1030" width="80" height="50" rx="8" fill="#3f3f46" stroke="${config.auraColor}" stroke-width="2" />
    <rect x="490" y="1030" width="80" height="50" rx="8" fill="#3f3f46" stroke="${config.auraColor}" stroke-width="2" />

    <!-- 3. Skirt / Utility Belt / Waist (Y: 760 to 860) -->
    ${config.hasSkirt ? `
    <polygon points="340,770 560,770 610,870 290,870" fill="${config.skirtColor || config.suitColor1}" stroke="${config.auraColor}" stroke-width="3" />
    ` : `
    <rect x="350" y="770" width="200" height="80" rx="10" fill="#27272a" stroke="${config.auraColor}" stroke-width="2" />
    `}
    <rect x="340" y="750" width="220" height="26" rx="6" fill="#3f3f46" stroke="${config.auraColor}" stroke-width="2" />

    <!-- 4. Torso / Flightsuit Armor (Y: 480 to 760) -->
    <path d="M 300 520 L 350 760 L 550 760 L 600 520 L 530 460 L 370 460 Z" fill="url(#bodySuit_${config.id})" stroke="${config.auraColor}" stroke-width="3" />
    <!-- Chest Plate / Power Core -->
    <polygon points="390,520 510,520 480,640 420,640" fill="#18181b" stroke="${config.auraColor}" stroke-width="2" />
    <circle cx="450" cy="580" r="16" fill="${config.auraColor}" filter="url(#glow_${config.id})" />

    <!-- 5. Arms & Hands (Head to toe complete) -->
    <!-- Left Arm -->
    <path d="M 320 500 L 250 700 L 240 880 L 280 890 L 300 720 L 360 520 Z" fill="url(#bodySuit_${config.id})" stroke="${config.auraColor}" stroke-width="2" />
    <!-- Left Hand / Glove -->
    <rect x="230" y="870" width="46" height="54" rx="8" fill="#27272a" stroke="${config.auraColor}" stroke-width="2" />
    <!-- Right Arm -->
    <path d="M 580 500 L 650 700 L 660 880 L 620 890 L 600 720 L 540 520 Z" fill="url(#bodySuit_${config.id})" stroke="${config.auraColor}" stroke-width="2" />
    <!-- Right Hand / Glove -->
    <rect x="624" y="870" width="46" height="54" rx="8" fill="#27272a" stroke="${config.auraColor}" stroke-width="2" />

    <!-- 6. Neck & Head (Y: 260 to 460) -->
    <rect x="420" y="440" width="60" height="50" rx="8" fill="#ffedd5" />
    <ellipse cx="450" cy="380" rx="75" ry="90" fill="#fed7aa" stroke="${config.auraColor}" stroke-width="1.5" />
    <!-- Hair -->
    <path d="M 370 360 C 370 240, 530 240, 530 360 Q 560 480 500 500 Q 450 360 400 500 Z" fill="${config.hairColor}" />
    <!-- Visor / Eyes -->
    <rect x="410" y="370" width="80" height="18" rx="8" fill="${config.auraColor}" filter="url(#glow_${config.id})" />
  </g>

  <!-- High-End Sci-Fi Card Framing & Telemetry -->
  <rect x="20" y="20" width="860" height="1560" rx="16" fill="none" stroke="${config.auraColor}" stroke-width="2" opacity="0.6" />
  <rect x="28" y="28" width="844" height="1544" rx="12" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.2" />

  <text x="60" y="100" font-family="monospace" font-size="34" font-weight="black" fill="${config.auraColor}" letter-spacing="4">${config.name.toUpperCase()}</text>
  <text x="60" y="145" font-family="monospace" font-size="20" font-weight="bold" fill="#fff" letter-spacing="2">CALLSIGN: ${config.callsign} // ${config.gender.toUpperCase()} · ${config.age}T</text>
  <text x="60" y="180" font-family="monospace" font-size="16" fill="${config.auraColor}" opacity="0.8">GEAR SYNERGY: ${config.gear.toUpperCase()} · SPECIALTY: ${config.specialty}</text>
  <line x1="60" y1="200" x2="400" y2="200" stroke="${config.auraColor}" stroke-width="3" />

  <!-- Bottom Telemetry Specs -->
  <g transform="translate(60, 1460)" font-family="monospace" font-size="14" fill="#a1a1aa">
    <text x="0" y="0">TRAIL: <tspan fill="#fff" font-weight="bold">${config.trailName}</tspan></text>
    <text x="0" y="26">PASSIVE: <tspan fill="${config.auraColor}" font-weight="bold">${config.passiveName}</tspan></text>
    <text x="0" y="52">STATUS: COMBAT_READY · FULL_BODY_SILHOUETTE_VERIFIED</text>
  </g>
</svg>`;
}

// 8 Pilots configuration for Full-Body SVGs
const fullBodyConfigs = [
  {
    id: 'marcus',
    name: 'Marcus Thorne',
    callsign: 'WAR DOG',
    gender: 'Nam',
    age: 30,
    gear: 'Vanguard',
    specialty: 'Weapons Specialist & Frontline Commander',
    trailName: 'Vệt Lửa Trọng Pháo Vành Đai',
    passiveName: 'Hỏa Lực Dồn Ép (+8% Sát thương khi địch >70% HP)',
    auraColor: '#06b6d4',
    suitColor1: '#27272a',
    suitColor2: '#18181b',
    hairColor: '#3f3f46',
    hasSkirt: false,
  },
  {
    id: 'valentine',
    name: 'Valentine Vance',
    callsign: 'AEGIS ANGEL',
    gender: 'Nữ',
    age: 22,
    gear: 'Aegis',
    specialty: 'Sanctuary Guardian & Fleet Rescue',
    trailName: 'Thánh Vực Quang Học Aegis',
    passiveName: 'Lá Chắn Cấp Cứu (Hồi 30% khiên khi vỡ khiên)',
    auraColor: '#10b981',
    suitColor1: '#f8fafc',
    suitColor2: '#e2e8f0',
    skirtColor: '#f8fafc',
    hairColor: '#fef08a',
    hasSkirt: true,
  },
  {
    id: 'alviss',
    name: 'Levi Reed',
    callsign: 'SHADOW FALCON',
    gender: 'Nữ',
    age: 24,
    gear: 'Falcon',
    specialty: 'Supersonic Interceptor Ace',
    trailName: 'Tàn Ảnh Hư Không Diều Hâu',
    passiveName: 'Sáng Kiến Diều Hâu (+15 SPD 3 lượt, +8% Né, Phản kích)',
    auraColor: '#a855f7',
    suitColor1: '#3b0764',
    suitColor2: '#1e1b4b',
    skirtColor: '#581c87',
    hairColor: '#311042',
    hasSkirt: true,
  },
  {
    id: 'eric',
    name: 'Eric Brandt',
    callsign: 'BUNKER BREAKER',
    gender: 'Nam',
    age: 28,
    gear: 'Aegis',
    specialty: 'Siege Demolition Specialist',
    trailName: 'Vệt Đạn Pháo Hạt Nhân Nhiệt Hạch',
    passiveName: 'Hạt Nhân Xuyên Giáp (+20% Xuyên giáp cố định)',
    auraColor: '#ef4444',
    suitColor1: '#7f1d1d',
    suitColor2: '#18181b',
    hairColor: '#18181b',
    hasSkirt: false,
  },
  {
    id: 'victor',
    name: 'Victor Cross',
    callsign: 'IRON WALL',
    gender: 'Nam',
    age: 34,
    gear: 'Aegis',
    specialty: 'Bastion Fleet Veteran',
    trailName: 'Lũy Thép Vành Đai Orion',
    passiveName: 'Thành Trì Bất Khả Xâm Phạm (-12% Dmg khi HP<60%)',
    auraColor: '#f59e0b',
    suitColor1: '#78350f',
    suitColor2: '#27272a',
    hairColor: '#3f3f46',
    hasSkirt: false,
  },
  {
    id: 'kaelen',
    name: 'Kaelen Voss',
    callsign: 'SOLAR FLARE',
    gender: 'Nam',
    age: 23,
    gear: 'Falcon',
    specialty: 'Plasma Striker',
    trailName: 'Vệt Sáng Sao Băng Rực Lửa',
    passiveName: 'Quá Tải Nhiệt Hạch (+12% Crit, hồi SP & thiêu đốt)',
    auraColor: '#f97316',
    suitColor1: '#f8fafc',
    suitColor2: '#c2410c',
    hairColor: '#ea580c',
    hasSkirt: false,
  },
  {
    id: 'lyra',
    name: 'Lyra Sterling',
    callsign: 'GHOST WEAVER',
    gender: 'Nữ',
    age: 25,
    gear: 'Falcon',
    specialty: 'Electronic Warfare & Quantum Infiltrator',
    trailName: 'Màn Sương Lượng Tử Vô Ảnh',
    passiveName: 'Nhiễu Loạn Lượng Tử (-10% Dmg đơn, -25% ATK địch)',
    auraColor: '#06b6d4',
    suitColor1: '#083344',
    suitColor2: '#0f172a',
    skirtColor: '#164e63',
    hairColor: '#67e8f9',
    hasSkirt: true,
  },
  {
    id: 'selena',
    name: 'Selena Drake',
    callsign: 'CRIMSON VALKYRIE',
    gender: 'Nữ',
    age: 26,
    gear: 'Vanguard',
    specialty: 'Assault Fleet Commander',
    trailName: 'Hào Quang Huyết Nguyệt Tiên Phong',
    passiveName: 'Cuồng Nộ Valkyrie (+15% Dmg khi địch <50% HP)',
    auraColor: '#f43f5e',
    suitColor1: '#881337',
    suitColor2: '#4c0519',
    skirtColor: '#9f1239',
    hairColor: '#e11d48',
    hasSkirt: true,
  },
];

// Write portraits
fs.writeFileSync(path.join(outputDir, 'victor-portrait.svg'), victorPortrait);
fs.writeFileSync(path.join(outputDir, 'kaelen-portrait.svg'), kaelenPortrait);
fs.writeFileSync(path.join(outputDir, 'lyra-portrait.svg'), lyraPortrait);
fs.writeFileSync(path.join(outputDir, 'selena-portrait.svg'), selenaPortrait);

// Write fullbody files
fullBodyConfigs.forEach(cfg => {
  const fullBodySvg = createFullBodySVG(cfg);
  fs.writeFileSync(path.join(outputDir, `${cfg.id}-fullbody.svg`), fullBodySvg);
});
// Also write levi-fullbody.svg alias
const leviConfig = fullBodyConfigs.find(c => c.id === 'alviss');
if (leviConfig) {
  fs.writeFileSync(path.join(outputDir, 'levi-fullbody.svg'), createFullBodySVG(leviConfig));
}

console.log('Successfully generated all pilot portraits and fullbody vector assets in public/images/');
