# 🎨 GenZ Lens Style Audit Report

**Date:** 2025-10-25  
**Theme:** GenZ Orange/Yellow on Deep Purple-Magenta Background

---

## 📁 **File Structure Overview**

### **Core Style Files**
```
app/
├── globals.css ...................... Main theme definitions & animations
└── (tabs)/
    ├── circle/page.tsx .............. Circle of Trust page cards
    ├── contacts/page.tsx ............ Contacts page cards
    └── signals/page.tsx ............. Signals feed page cards

components/
├── StoicGuideModal.tsx .............. Circle page "Who should I add?" modal
├── PeerRecommendationModal.tsx ...... Contacts "Send Signal" modal
└── AddContactDialog.tsx ............. QR Exchange modal

tailwind.config.js ................... Color palette definitions
```

---

## 🎨 **Color Palette (Tailwind Config)**

### **Background Colors**
| Color | Hex | Usage |
|-------|-----|-------|
| `panel` | `#111827` | Main card backgrounds (at 90/80 opacity) |
| `panel2` | `#0F172A` | Alternative panel color |
| `ink` | `#0B0F14` | Deepest black |

### **Primary GenZ Colors**
| Color | Value | Usage |
|-------|-------|-------|
| Orange primary | `#FF6B35` | Borders, text accents, primary CTA |
| Yellow accent | `yellow-400/500` | Buttons, secondary accents |
| White | Various opacity | Text, subtle borders |

### **Page Background (globals.css)**
```css
/* GenZ theme background gradient */
--background: #1a0a1f (deep purple-magenta base)

/* Applied as: */
bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]
```

---

## 🃏 **Card Style System**

### **Standard Card Pattern (All Pages)**
```tsx
className="
  sheen-sweep                      // ← Brushed aluminum animation
  overflow-hidden                  // ← Required for sheen effect
  bg-gradient-to-br 
  from-panel/90 to-panel/80       // ← Semi-opaque solid background
  border-2 border-[#FF6B35]/20    // ← Orange border (circle) or border-orange-500/40 (contacts)
  shadow-[0_0_30px_rgba(...)]     // ← Glowing shadow
  relative 
  before:absolute before:inset-0 
  before:rounded-lg before:p-[1px]
  before:bg-gradient-to-r 
  before:from-[#FF6B35]/20 
  before:via-transparent 
  before:to-[#FF6B35]/20
  before:-z-10 
  before:animate-pulse             // ← Pulsating border gradient
"
```

---

## 🎭 **Animation Effects (globals.css)**

### **1. Brushed Aluminum Sheen**
**Class:** `sheen-sweep`  
**Location:** `app/globals.css` lines 785-803

```css
.sheen-sweep {
  position: relative;
  overflow: hidden;
}
.sheen-sweep::after {
  content: "";
  position: absolute;
  top: -20%;
  left: -120%;
  width: 120%;
  height: 200%;
  background: linear-gradient(120deg, 
    rgba(255,255,255,0) 35%, 
    rgba(255,255,255,0.10) 50%, 
    rgba(255,255,255,0) 65%);
  filter: blur(0.5px);
  transform: translateX(-120%) rotate(12deg);
  animation: sheen 4.5s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
}

@keyframes sheen {
  0%   { transform: translateX(-120%) rotate(12deg); opacity: 0; }
  10%  { opacity: 0.25; }
  50%  { transform: translateX(120%) rotate(12deg); opacity: 0.25; }
  60%  { opacity: 0; }
  100% { transform: translateX(120%) rotate(12deg); opacity: 0; }
}
```

**Effect:** Creates diagonal light sweep every 4.5 seconds simulating brushed metal

### **2. Pulsating Border**
**Class:** `before:animate-pulse`  
**Built-in:** Tailwind CSS animation  
**Applied to:** `::before` pseudo-element with gradient border

**Effect:** Border opacity pulses between 75% and 100%

---

## 📄 **Page-by-Page Breakdown**

### **🔵 Circle Page** (`app/(tabs)/circle/page.tsx`)

#### Main Cards (2)
1. **Inner Circle Campfire** (lines 214-268)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-[#FF6B35]/20`
   - Has: `sheen-sweep`, `overflow-hidden`
   - Contains: LED ring visualization, stats, CTA button

2. **Circle Members List** (lines 270-377)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-[#FF6B35]/20`
   - Has: `sheen-sweep`, `overflow-hidden`
   - Contains: Member cards, empty slot cards

#### Special Component
- Uses `<Card>` component from `@/components/ui/card`
- **Note:** Card component might have default styles that could interfere

---

### **👥 Contacts Page** (`app/(tabs)/contacts/page.tsx`)

#### Main Cards (3)
1. **QR Contact Exchange** (lines 100-130)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-orange-500/40`
   - Has: `sheen-sweep`, `overflow-hidden`

2. **Send Recognition Signal** (lines 132-154)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-[#FF6B35]/40`
   - Has: `sheen-sweep`, `overflow-hidden`

3. **All Contacts List** (lines 156-236)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-white/20`
   - Has: `sheen-sweep`, `overflow-hidden`

#### All use plain `<div>` elements ✅

---

### **📡 Signals Page** (`app/(tabs)/signals/page.tsx`)

#### Main Card (1)
1. **Mobile Tabs** (lines 262-290)
   - Background: `from-panel/90 to-panel/80`
   - Border: `border-white/20`
   - Has: `sheen-sweep`, `overflow-hidden`
   - Contains: Feed/Tokens tab switcher

#### Uses plain `<div>` element ✅

---

## 🎭 **Modal Styling**

### **1. StoicGuideModal** (`components/StoicGuideModal.tsx`)
**Styled:** ✅ GenZ theme applied (lines 36-44)
```tsx
bg-gradient-to-br from-[#1a0a1f]/95 to-[#2a1030]/90
border-2 border-[#FF6B35]/40
shadow-[0_0_40px_rgba(255,107,53,0.3),...]
```

### **2. PeerRecommendationModal** (`components/PeerRecommendationModal.tsx`)
**Styled:** ✅ GenZ theme applied (line 300)
```tsx
bg-gradient-to-br from-[#1a0a1f]/95 to-[#2a1030]/90
border-2 border-[#FF6B35]/40
```

### **3. AddContactDialog** (`components/AddContactDialog.tsx`)
**Status:** Should check if GenZ colors applied

---

## ⚠️ **Potential Issues & Inconsistencies**

### **1. Circle Page Uses `<Card>` Component**
- **Risk:** shadcn/ui Card might have default styles overriding our custom styles
- **Fix:** Consider replacing with plain `<div>` like contacts/signals pages

### **2. Sheen Effect Visibility**
- **Requirement:** Needs `overflow-hidden` on parent element
- **Status:** ✅ Added to all cards

### **3. Border Opacity Variations**
| Page | Border Value |
|------|--------------|
| Circle | `border-[#FF6B35]/20` |
| Contacts CTA 1 | `border-orange-500/40` |
| Contacts CTA 2 | `border-[#FF6B35]/40` |
| All contacts list | `border-white/20` |

**Note:** Mixed opacity values - consider standardizing

---

## 🔧 **Quick Reference: Copy-Paste Card Pattern**

```tsx
<div className="
  sheen-sweep
  overflow-hidden
  bg-gradient-to-br from-panel/90 to-panel/80
  border-2 border-[#FF6B35]/40
  rounded-lg p-4
  shadow-[0_0_30px_rgba(255,107,53,0.2),0_0_60px_rgba(255,107,53,0.1)]
  hover:shadow-[0_0_40px_rgba(255,107,53,0.3),0_0_80px_rgba(255,107,53,0.15)]
  backdrop-blur-sm
  relative
  before:absolute before:inset-0 before:rounded-lg before:p-[1px]
  before:bg-gradient-to-r
  before:from-[#FF6B35]/30 before:via-transparent before:to-[#FF6B35]/30
  before:-z-10 before:animate-pulse
  transition-all duration-300
  hover:scale-[1.02]
  cursor-pointer
">
  {/* Card content */}
</div>
```

---

## 📊 **Theme Consistency Score**

| Aspect | Status | Notes |
|--------|--------|-------|
| Background gradient | ✅ Consistent | All pages use purple-magenta |
| Card opacity | ✅ Consistent | All cards use 90/80 |
| Sheen animation | ✅ Applied | All main cards have it |
| Border pulse | ✅ Applied | All cards have before:animate-pulse |
| Orange/Yellow colors | ⚠️ Mostly | Some variations in opacity |
| Component type | ⚠️ Mixed | Circle uses Card, others use div |

---

## 🎯 **Recommended Next Steps**

1. **Standardize border opacity** - Choose one value (suggest `/40`)
2. **Replace Circle `<Card>` with `<div>`** - For consistency
3. **Audit AddContactDialog** - Ensure GenZ colors applied
4. **Create reusable Card component** - Reduce duplication
5. **Document hover states** - Some cards have hover effects, some don't

---

## 📝 **Color Reference Chart**

```
GenZ Theme Colors:
├─ Background: #1a0a1f → #2a1030 (purple-magenta gradient)
├─ Cards: #111827 at 90/80 opacity (semi-solid)
├─ Primary: #FF6B35 (orange) - borders, accents
├─ Secondary: yellow-400/500 - buttons
└─ Text: white at various opacities

Border Animations:
├─ Pulse: 2s ease-in-out (opacity 75% → 100%)
└─ Sheen: 4.5s ease-in-out (diagonal sweep)
```
