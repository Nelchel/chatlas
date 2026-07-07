# Release Notes – Chatlas v1.0.6

## Short version (for Google Play Console – 500 char max per language)

### en-US
🎯 New "Daily Challenge" widget directly on the map! Fixed a critical Android native crash with SVG rendering. Improved level badge styling with medal design and paper background theme across all screens. Happy cat hunting!

### fr-FR
🎯 Nouveau widget "Défi du jour" directement sur la carte ! Correction d'un crash natif critique Android lié au rendu SVG. Amélioration du style des badges de niveau avec design médaille et thème papier sur tous les écrans. Bonne chasse !

---

## Full version

### v1.0.6
- **Daily Challenge Widget**: new overlay on the map showing today's quest with progress bar and XP reward. Tap to navigate to full quests screen.
- **Fix**: resolved critical Android native crash (`No ViewManager defined for class RNSVGCircle`) caused by a corrupted `react-native-svg` module from `npm link`.
- **UI**: redesigned LevelBadge with medal style positioned above the map.
- **UI**: applied paper background theme to navigation bar and all screens.
- **Map**: fixed MapView overflow and improved territory stats display.

### Previous features (v1.0.0–v1.0.5)

#### Social
- **Likes & Comments**: like and comment on each cat observation.
- **Follow System**: follow other hunters, view followers/following.
- **Native Share**: share discoveries directly from the app.
- **Public Profiles**: view hunter stats, badges, and cats.

#### Gamification
- **XP & Levels**: earn XP per observation, level up.
- **Badges**: unlock achievement badges.
- **Streaks**: consecutive hunting days.
- **Quests**: daily, weekly, and one-time missions with XP rewards.
- **Leaderboard**: World / Country / Region / City filters + Observations / Cats / Badges / XP metrics.

#### Chatlas – Encyclopedia
- Visual grid: discovered cats or mysteries (❓).
- Progress bar toward 500 cats.
- Filters: All / Discovered / To Discover.

#### Map & Discovery
- **Heatmap**: observation density toggle.
- **Smart Markers**: city bubbles zoomed out, individual cats zoomed in.
- **Territory Stats**: city ranking (medals) and country stats.

#### Enhanced Cat Profiles
- **Sex**, **estimated age**, **behaviors** (friendly, aggressive, foodie, sleepy).
- **Photo gallery** with thumbnail selector.
- Timeline with likes and comments per observation.

---
*Ready for the Play Store – package: `com.chatlas.app`*
