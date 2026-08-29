# Project Brief & PRD: Maina the Bird

## 1. Project Overview
**Maina the Bird** is an ultra-luxury, ambient music streaming platform designed for a niche audience that values high-fidelity audio, immersive visual aesthetics, and a "boutique" digital experience. The platform name is inspired by the Myna bird, known for its vocal mimicry and intelligence, symbolizing the platform's focus on organic, high-quality soundscapes.

### Core Mission
To transform music listening from a passive activity into an atmospheric, visual journey through "Hyper-Glassmorphism" and reactive design.

---

## 2. Target Audience
- **Audiophiles**: Users seeking FLAC/320kbps quality and deep metadata.
- **Ambient/Lo-Fi Enthusiasts**: Listeners who use music for focus, relaxation, or atmosphere.
- **Design-Conscious Users**: Individuals who appreciate "Obsidian Dark" aesthetics and high-end digital craftsmanship.

---

## 3. Visual Identity & Design Systems
The project currently supports three distinct visual "Themes" managed via shared design systems:

### Theme A: Obsidian Ethereal (Dark Mode)
- **Primary Canvas**: `#0a0a0c` (Obsidian)
- **Styling**: Hyper-Glassmorphism, `backdrop-blur-2xl`, 1px border highlights (`border-white/10`).
- **Typography**: Geist / Inter (Modern Sans-Serif).
- **Vibe**: Tech-forward, immersive, cinematic.

### Theme B: Ethereal Avian (Light Mode)
- **Primary Canvas**: `#f7f9fd` (Cloud/Eggshell)
- **Styling**: Soft sunrise gradients, iridescent accents, "Cloud-Glass" components.
- **Typography**: Playfair Display (Serif) paired with clean sans-serif.
- **Vibe**: Sophisticated, airy, premium boutique.

---

## 4. Key Functional Components

### 4.1. Immersive Fullscreen Player
- **Visualizer**: WebGL/Canvas-based waveform reacting to audio frequencies.
- **Dynamic Backgrounds**: Animated SVG mesh gradients or GPU shaders driven by album art dominant colors.
- **Synced Lyrics**: "Apple Music" style karaoke scrolling with focus/blur transitions.
- **Vinyl Aesthetic**: High-res artwork with a sliding vinyl record animation.

### 4.2. Persistent Mini-Player (Bottom Dock)
- **Layout**: Floating frosted glass pill.
- **Controls**: Play/Pause with pulsing glow, micro-seekbar, and "Maximize" toggle.
- **Visuals**: Miniature live frequency bars (CSS animation).

### 4.3. Discovery & Migrations Dashboard
- **Search**: Minimalist input with pill-based mood filters (e.g., "Dawn Chorus," "Feather Drift").
- **Grid Layout**: Frosted card tiles with hover-zoom effects and "Quick Play" overlays.

---

## 5. Technical Requirements
- **Framework**: Tailwind CSS for styling and layout.
- **Motion**: CSS Keyframes and Framer Motion for magnetic hover effects and ambient drift.
- **Graphics**: WebGL (GLSL Shaders) for high-performance background animations.
- **Audio Fidelity**: Metadata indicators for FLAC/320kbps streams.

---

## 6. Future Roadmap
- **Community "Nests"**: Shared listening rooms with synced visualizers.
- **Birdsong Integration**: Procedural ambient tracks mixed with user-selected music.
- **Mobile Experience**: Adaptation of the floating dock and immersive player for iOS/Android portrait orientations.
