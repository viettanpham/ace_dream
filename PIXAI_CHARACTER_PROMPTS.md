# STARFRONT — PixAI Character Generation Prompts
*Master Anime Sci-Fi Character Art Generation Catalog for PixAI & SDXL*  
*Document Version: 1.0 — Approved Official Prompts Catalog*  
*Target Engine: PixAI (Moonbeam / Anime XL / Anything V5 / Animagine XL 3.1 / SDXL)*

---

## 1. Overview & Generation Directives

This document provides **8 unique, production-grade image generation prompts** specifically tailored for **PixAI** (and compatible anime diffusion models like Animagine XL, SDXL, and NovelAI). Each prompt corresponds to one of the 8 canonical STARFRONT pilots and translates their rich in-game lore, mechanical equipment, and character aesthetic into vivid, premium anime sci-fi illustrations.

### Key Visual Pillars
- **Aesthetic**: Premium modern Japanese anime RPG key art (reminiscent of *Honkai: Star Rail*, *Arknights*, *Genshin Impact*, and high-budget mecha anime).
- **Facial Fidelity**: Expressive anime eyes with luminous gradients, detailed irises, polished anime jawlines, clean and delicate line art, and refined cel shading.
- **Sci-Fi Equipment**: Heavy tactical exo-suits, sleek flightsuits with cybernetic accents, mechanical gauntlets, glowing LED conduits, and hard-surface armor plating directly referencing STARFRONT GEAR designs (Vanguard cyan `#06b6d4`, Falcon purple/teal `#a855f7`/`#14b8a6`, and Aegis amber `#f59e0b`).
- **Strict Anti-Slop Discipline**: Absolutely NO pixel art, NO 8-bit/16-bit retro sprites, NO voxel graphics, NO low-poly renders, NO chibi/super-deformed characters, and NO canvas/SVG programmatic mockups.

---

## 2. Universal Negative Prompts & Recommended PixAI Settings

### Recommended PixAI Settings
- **Recommended Models**: PixAI Moonbeam, Animagine XL v3.1, Realism/Anime Hybrid XL, or Counterfeit-V3.
- **Sampling Method**: DPM++ 2M Karras or Euler a (28–35 steps).
- **CFG Scale**: 7.0 – 8.5.
- **Resolution**:
  - **Portrait**: `1024 × 1024` (1:1 Square)
  - **Full-Body**: `896 × 1536` or `900 × 1600` (9:16 Vertical)
- **Clip Skip**: 2.

### Master Negative Prompt (Apply to All Characters)
```text
(worst quality, low quality, normal quality, lowres:1.4), (pixel art, retro pixel, 8-bit, 16-bit, sprite, pixelated, dithering:1.6), (low poly, blocky, voxel, 3d game render:1.3), (chibi, deformed, bad anatomy, bad hands, missing fingers, extra fingers, mutated hands:1.4), (poorly drawn face, bad eyes, crossed eyes:1.3), (blurry, fuzzy, jpeg artifacts, compression artifacts:1.3), watermark, signature, artist name, username, text, logo, border, frame, monochrome, sketch, draft, amateur drawing
```

---

## 3. The 8 Tailored Pilot Prompts

---

### Pilot 1: Marcus Thorne — WAR DOG
*Frontline Commander & Heavy Assault Specialist*  
- **Gender & Age**: Male, 30 years old  
- **Associated GEAR**: Vanguard Mecha (`#06b6d4` Cyan Plasma)  
- **Visual Identity**: Battle-hardened veteran commander, muscular athletic build, short textured dark brown hair, stern determined amber-brown eyes, faint tactical combat scar across cheek. Heavy military exosuit with reinforced chestplate, cyan glowing power conduits, and tactical assault carbine.

#### 1A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1boy, marcus thorne, 30 years old handsome rugged veteran commander, short dark brown military textured hair, intense determined amber eyes, sharp defined jawline, light tactical battle scar on cheek, confident stern expression, upper body portrait, heavy futuristic sci-fi military exosuit collar, matte charcoal carbon-fiber armor plates with glowing cyan LED conduits (#06b6d4), brushed steel neck gorget, holographic tactical comm earpiece, rim lighting, dramatic studio sci-fi hangar background, intricate mechanical textures, sharp clean digital line art, refined anime cel shading, cinematic lighting
```

#### 1B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1boy, marcus thorne, 30 years old frontline commander, standing in combat-ready posture, powerful muscular athletic build, short dark brown textured hair, intense amber eyes, faint cheek scar, wearing full heavy vanguard tactical exosuit, matte dark titanium armor plating with glowing cyan energy lines, reinforced hydraulic knee and elbow servos, heavy tactical combat boots, holding a futuristic sci-fi heavy assault rifle with glowing cyan energy magazine, utility belts and ammunition canisters, cinematic rim lighting in cyan and deep blue, military starship hangar deck background, clean anime linework, volumetric atmospheric haze, masterpiece illustration
```

---

### Pilot 2: Valentine Vance — AEGIS ANGEL
*Rescue Officer & Nano-Shield Barrier Prodigy*  
- **Gender & Age**: Female, 22 years old  
- **Associated GEAR**: Aegis Mecha (`#10b981` Emerald / `#f59e0b` Amber Gold)  
- **Visual Identity**: Gorgeous academy valedictorian rescue prodigy, long golden-blonde flowing hair with soft bangs, gentle yet resolute emerald-green anime eyes. Elegant form-fitting military pilot uniform with high-tech pleated mini-skirt, thigh-high aerodynamic thruster boots, emerald nano-weave conductors, and floating crystalline holo-shield projector.

#### 2A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1girl, valentine vance, 22 years old beautiful anime heroine, long flowing golden blonde hair with silky strands and soft side bangs, large luminous emerald green eyes with sparkling gradient highlights, gentle confident and compassionate expression, flawless anime face, soft blush, upper body, elegant high-tech white and gold pilot collar with emerald green glowing nano-fiber circuitry (#10b981), glossy white composite shoulder armor, floating holographic hexagonal shield interface near shoulder, crystalline energy shimmer, soft rim lighting, clean delicate digital line art, sophisticated anime cel shading, bright futuristic starbase interior
```

#### 2B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1girl, valentine vance, 22 years old rescue academy prodigy, graceful and heroic standing pose, slender and athletic figure, long golden blonde hair fluttering in zero-gravity breeze, bright emerald green eyes, wearing elegant futuristic pilot uniform with tailored white military tunic, high-tech nano-weave pleated skirt, sleek white-and-gold gauntlets, thigh-high armored flight boots with glowing emerald thruster nozzles, deploying a floating translucent green holographic hexagonal barrier shield in front of her hand, ambient glowing emerald particles, immaculate anime aesthetic, cinematic lighting, futuristic orbital medical bay background
```

---

### Pilot 3: Alviss Drake — GHOSTFIRE
*Supersonic Interceptor Ace & 0.07s Reflexes Pilot*  
- **Gender & Age**: Male, 26 years old  
- **Associated GEAR**: Falcon Interceptor (`#a855f7` Deep Violet / `#c084fc` Nebula Purple)  
- **Visual Identity**: Charismatic, sharp-witted supersonic ace pilot, styled jet-black spiky hair with violet streaks, sharp piercing amber-gold eyes, confident smirk. High-G pressure flightsuit with sleek violet composite winglets, aerodynamic lightweight alloy pauldrons, glowing purple afterburner conduits, and quick-draw sidearm holster.

#### 3A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1boy, alviss drake, 26 years old handsome charismatic ace pilot, styled jet-black hair with vibrant violet highlights, piercing sharp amber-gold eyes, cocky confident smirk, refined angular anime facial structure, upper body portrait, aerodynamic high-G pilot flightsuit collar with matte black and purple carbon composites, glowing vibrant violet energy conduit lines (#a855f7), transparent holographic HUD eyepiece over left brow displaying Mach telemetry, dynamic rim lighting, speed blur particle trails, clean razor-sharp anime line art, high-end cel shading, cockpit canopy background with starfield
```

#### 3B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1boy, alviss drake, 26 years old supersonic pilot ace, standing in dynamic relaxed cocky stance with one hand on hip, lean athletic build, styled black hair with violet fringe, piercing amber eyes, wearing high-altitude supersonic combat flightsuit in matte obsidian black with glossy purple accents and violet LED lines, lightweight articulated joint armor, aerodynamic thruster fins on calves, streamlined pilot boots, glowing afterburner energy aura surrounding feet, void falcon phantom trails, deep space nebula background with purple stellar dust, clean anime linework, professional game concept art
```

---

### Pilot 4: Eric Brandt — BUNKER BREAKER
*Heavy Siege Gunner & Armor-Piercing Demolition Master*  
- **Gender & Age**: Male, 28 years old  
- **Associated GEAR**: Vanguard Heavy Siege (`#ef4444` Crimson / `#06b6d4` Cyan)  
- **Visual Identity**: Steadfast, gritty heavy artillery engineer, unruly dark hair with undercut, focused crimson-brown eyes, tactical targeting ocular implant or monocle. Rugged crimson-and-black ballistic flightsuit, heavy reinforced hydraulic siege arm on right shoulder, heat-sink vents with orange-red thermal glow, and anti-materiel Gauss sidearm.

#### 4A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1boy, eric brandt, 28 years old rugged focused heavy demolition pilot, short dark messy hair with undercut, sharp calculating reddish-brown eyes, mechanical targeting monocle over left eye with glowing red holographic reticle, determined grim expression, upper body portrait, heavy thermal-resistant flightsuit in crimson red and industrial charcoal black (#ef4444), reinforced titanium neck collar with active radiator exhaust vents, subtle orange heat glow from cooling channels, metallic sheen, volumetric rim lighting, industrial blast-door bunker background, crisp digital line art, bold anime cel shading
```

#### 4B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1boy, eric brandt, 28 years old siege gunner ace, wide confident combat stance, tall and sturdy athletic build, dark messy hair, wearing heavy-duty crimson and black anti-blast combat suit, reinforced hydraulic right arm brace with Gauss cannon recoil dampers, heavy magnetic holster carrying an oversized plasma breach carbine, armored knee guards and heavy magnetic anchoring boots, glowing heat dispersion vents on back, sparks and hot thermal vapor rising, asteroid fortress hangar background, dramatic high-contrast sci-fi lighting, masterpiece anime illustration
```

---

### Pilot 5: Lyra Song — VALKYRIE
*Supersonic Plasma Duelist & High-Mobility Blade Master*  
- **Gender & Age**: Female, 24 years old  
- **Associated GEAR**: Falcon Striker (`#c084fc` Lavender Purple / `#38bdf8` Sky Cyan)  
- **Visual Identity**: Vivacious and stylish space arena duelist, long twin-tail platinum-silver hair with lavender gradient tips, energetic luminous violet eyes with starry highlights, confident playful smile. High-mobility aerodynamic flight uniform with sporty flared mini-skirt, dual hip holsters for high-frequency plasma daggers, and glowing neon purple wing-thrusters.

#### 5A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1girl, lyra song, 24 years old gorgeous anime duelist, twin-tails hairstyle with long flowing platinum-silver hair and pastel lavender gradient tips, large sparkling violet-purple eyes with intricate star highlights, playful confident smile, delicate anime facial features, upper body portrait, sleek aerodynamic pilot collar in pearlescent white and lilac purple (#c084fc), glowing cyan-blue nano-circuits, lightweight composite pauldron, holographic dual-lens visor tilted on hair, glowing plasma sparks drifting in air, soft glowing rim light, clean refined anime line art, smooth digital coloring, anime battle arena background
```

#### 5B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1girl, lyra song, 24 years old plasma blade duelist, dynamic acrobatic airborne or landing pose, lithe and agile figure, flowing platinum-lavender twin-tails whipping through the air, sparkling violet eyes, wearing futuristic high-mobility duelist outfit, sleeveless white and purple pilot top, pleated aerodynamic mini-skirt with carbon lining, sleek thigh-high booster boots with glowing lavender ion thrusters, wielding twin high-frequency neon violet plasma energy blades with glowing light trails, holographic valkyrie wings made of plasma light behind back, neon-lit orbital colosseum background, masterpiece anime artwork
```

---

### Pilot 6: Kaelen Quinn — WRAITH / CIPHER
*Electronic Warfare Specialist & Quantum Infiltrator*  
- **Gender & Age**: Female, 25 years old  
- **Associated GEAR**: Falcon Stealth Variant (`#14b8a6` Teal / `#0f172a` Void Navy)  
- **Visual Identity**: Cool, enigmatic intelligence operative, asymmetrical bob hairstyle in deep midnight-teal, sharp analytical teal-emerald eyes, calm unreadable expression. Optical stealth nanosuit with matte obsidian hexagonal stealth plates, high-tech pleated techwear skirt, floating holographic cipher cubes and frequency wave decoders.

#### 6A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1girl, kaelen quinn, 25 years old cool mysterious cyber specialist, sleek asymmetrical bob haircut in dark midnight-teal hair with sharp angled fringe, intense analytical emerald-teal eyes with glowing digital ring in pupil, cool and calm expression, pale flawless skin, upper body portrait, advanced electronic warfare stealth suit in matte dark navy and carbon gray, glowing luminescent teal data channels (#14b8a6), sleek high-collar jacket, translucent floating holographic holographic code streams and quantum cipher interface in foreground, cyan-teal backlight, pristine anime linework, smooth cel shading, dark stealth stealth ship bridge background
```

#### 6B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1girl, kaelen quinn, 25 years old quantum infiltrator, poised stealth standing pose, slender graceful silhouette, dark midnight-teal asymmetrical bob hair, glowing teal eyes, wearing specialized active-camouflage techwear suit, dark navy matte fabric with iridescent hexagonal stealth scales, high-tech pleated cyber skirt, lightweight silent sprint boots with teal micro-thrusters, right hand manipulating a floating 3D holographic quantum cryptographic cube, shimmering optical distortion cloaking effect around left arm, deep space surveillance array background, moody cinematic sci-fi lighting
```

---

### Pilot 7: Selena Vega — SOLARIS
*Fleet Flagship Commander & High-Energy Solar Photon Officer*  
- **Gender & Age**: Female, 27 years old  
- **Associated GEAR**: Vanguard Solar Variant (`#ea580c` Solar Orange / `#facc15` Radiant Gold)  
- **Visual Identity**: Regal and imposing fleet artillery commander, voluminous wavy crimson-scarlet hair flowing down back, commanding fiery amber-gold eyes, aristocratic and dignified countenance. Royal military ceremonial officer coat draped over high-tech gold-trimmed pilot dress, solar photon focus gauntlets, and radiant corona energy halo.

#### 7A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1girl, selena vega, 27 years old regal stunning anime officer, luxurious long wavy crimson-scarlet red hair, commanding fiery amber-gold eyes with golden flecks, dignified confident aristocratic expression, perfectly contoured anime face, upper body portrait, royal naval officer flight uniform in deep crimson with polished gold filigree embroidery and solar insignias (#ea580c, #facc15), high standing collar, golden braided aiguillette on shoulder, radiant warm rim lighting casting fiery corona highlights on hair, warm lens flare, sharp digital line art, rich multi-tone anime cel shading, imperial star dreadnought bridge background
```

#### 7B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1girl, selena vega, 27 years old solar beam commander, commanding aristocratic stance with military baton or beam focal saber held elegantly, tall curvaceous and majestic figure, voluminous flowing red hair, fiery amber eyes, wearing majestic high-ranking officer flight uniform with gold-trimmed flared military coat, white and gold combat corset, pleated ceremonial skirt, polished white and gold high-heeled armored boots, radiant golden solar flare corona halo shimmering behind her shoulders, burning orange photon energy sparks, solar observation station viewing window background with blazing sun, masterpiece quality
```

---

### Pilot 8: Victor Sterling — BASTION / TITAN GAUSS
*Veteran Vanguard Guardian & Hydraulic Bulwark Shieldmaster*  
- **Gender & Age**: Male, 34 years old  
- **Associated GEAR**: Aegis Heavy Fortress (`#d97706` Amber / `#78716c` Titan Bronze)  
- **Visual Identity**: Immovable veteran protector, broad muscular frame, short cropped grizzled slate-gray hair with silver temples, calm stoic hazel eyes, heavy cybernetic reinforcement on neck and shoulder. Titan hydraulic exoskeleton armor, immense portable fold-out tower bulwark shield with amber energy emitters, and heavy shock-absorbing magnetic anchor boots.

#### 8A. Portrait Prompt (1:1 Ratio — Avatar / HUD Comms)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, 1boy, victor sterling, 34 years old stoic veteran guardian, short buzzcut slate-gray hair with silvering temples, calm steadfast hazel eyes with mature crow's feet, square resolute jawline, expression of unshakeable resolve, upper body portrait, ultra-heavy industrial hydraulic exoskeleton collar in dark gunmetal and bronze-amber (#d97706), heavy carbon neck gorget with pneumatic piston joints, glowing warm amber power conduits, scratched heavy armor battle-scars, dramatic hard-edge key lighting, industrial hangar gantry background, clean precise anime linework, mature anime veteran character design
```

#### 8B. Full-Body Prompt (9:16 Ratio — Dossier / Hangar Inspection)
```text
masterpiece, best quality, ultra-detailed, highres, anime concept art, official anime game key art, full body, 1boy, victor sterling, 34 years old bastion guardian, unyielding defensive stance with legs planted wide, massive muscular powerhouse physique, short grizzled hair, resolute gaze, wearing full-body industrial titan hydraulic exosuit, heavy layered steel and tungsten armor plates, left arm bearing a massive deployed mechanical tower bulwark shield with glowing amber barrier energy field (#d97706), heavy magnetic shock-absorbing fortress boots anchored to deck plating, steam releasing from hydraulic pressure valves, planetary defense perimeter background under orbital bombardment, dramatic cinematic anime concept art
```

---

## 4. Prompt Engineering Reference Table

| Pilot | Callsign | Gender / Age | Key Signature Color | Primary Weapon / Mech Motif | PixAI Key Trigger Tags |
|---|---|---|---|---|---|
| **Marcus Thorne** | `WAR DOG` | Male, 30 | `#06b6d4` Cyan | Vanguard Assault Rifle, Titan Exosuit | `veteran commander, cyan led conduits, heavy exosuit, assault rifle` |
| **Valentine Vance** | `AEGIS ANGEL` | Female, 22 | `#10b981` Emerald / `#f59e0b` Gold | Aegis Hexagonal Nano-Barrier, Rescue Medic | `blonde hair, emerald eyes, pleated skirt, holographic shield barrier` |
| **Alviss Drake** | `GHOSTFIRE` | Male, 26 | `#a855f7` Deep Violet | Falcon Supersonic Winglets, 0.07s Reflexes | `black hair violet highlights, amber eyes, smirk, high-g flightsuit, speed trails` |
| **Eric Brandt** | `BUNKER BREAKER` | Male, 28 | `#ef4444` Crimson | Gauss Siege Arm, Thermal Armor-Piercer | `targeting monocle, crimson flightsuit, hydraulic arm brace, heavy artillery` |
| **Lyra Song** | `VALKYRIE` | Female, 24 | `#c084fc` Lavender | Twin Plasma Blades, Nebula Afterburners | `platinum twin-tails, violet eyes, mini-skirt, dual plasma daggers, valkyrie wings` |
| **Kaelen Quinn** | `WRAITH / CIPHER` | Female, 25 | `#14b8a6` Teal / `#0f172a` Navy | Quantum Jammer, Hexagonal Cloaking Nanosuit | `asymmetrical teal bob, cipher hologram cube, optical stealth techwear` |
| **Selena Vega** | `SOLARIS` | Female, 27 | `#ea580c` Solar Orange / `#facc15` Gold | Solar Photon Cannon, Flagship Admiral | `wavy crimson hair, amber eyes, ceremonial officer coat, solar corona halo` |
| **Victor Sterling** | `BASTION` | Male, 34 | `#d97706` Amber Bronze | Titan Hydraulic Bulwark Shield, Fortress Defense | `grizzled buzzcut, stoic guardian, massive tower shield, hydraulic exosuit` |

---

## 5. Output Verification & Ingestion Checklist

When rendering prompts in PixAI or generating assets for the STARFRONT game build:

1. **Verify Asset Dimensions**:
   - Portrait assets must be cropped or rendered at **1:1** (`1024 × 1024 px`).
   - Full-body assets must be cropped or rendered at **9:16** (`900 × 1600 px` or `896 × 1536 px`).
2. **Naming & Placement**:
   - Save portraits as: `/public/images/{pilotId}-portrait.png`
   - Save full-body as: `/public/images/{pilotId}-fullbody.png`
3. **Inspect in STARFRONT UI**:
   - Launch the **Pilot Art Gallery** (`components/game/pilot-gallery.tsx`) in the game client.
   - Use the **Inspector Mode** and **Toggle Portrait/Full-body** buttons to inspect line quality, facial rendering, and GEAR synergy aura matching.
