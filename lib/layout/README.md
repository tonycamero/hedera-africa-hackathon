# Layout Mode System

A semantic layout system that separates **user intent** from **authentication state**.

## Architecture

```
User Context (path, auth, params)
         ↓
   detectLayoutMode()
         ↓
    Layout Mode (app | viral | embed | kiosk)
         ↓
   Appropriate Shell Component
```

## Usage in Pages

### Option 1: Use hook in client component

```tsx
'use client'

import { useLayoutMode, useLayoutFeatures } from '@/lib/layout/useLayoutMode'

export default function CollectionsPage() {
  const { isAuthenticated } = useSession()
  const mode = useLayoutMode(isAuthenticated)
  const features = useLayoutFeatures(mode, isAuthenticated)
  
  return (
    <div>
      <h1>Collections</h1>
      
      {/* Show different content based on mode */}
      {features.showSignupCTA && (
        <button>Join TrustMesh</button>
      )}
      
      {features.allowActions && isAuthenticated && (
        <button>Send Signal</button>
      )}
    </div>
  )
}
```

### Option 2: Detect mode server-side

```tsx
import { detectLayoutMode } from '@/lib/layout/mode-detector'
import { cookies } from 'next/headers'

export default async function Page({ searchParams }) {
  const cookieStore = await cookies()
  const isAuthenticated = !!cookieStore.get('session')
  
  const mode = detectLayoutMode({
    pathname: '/collections',
    isAuthenticated,
    searchParams: new URLSearchParams(searchParams)
  })
  
  return (
    <div data-layout-mode={mode}>
      {/* Content */}
    </div>
  )
}
```

## Layout Modes

### `app` - Core App
- **When**: Authenticated user on core features
- **Chrome**: Full tab navigation, nav bar
- **Background**: Dark (`bg-ink`)
- **Examples**: `/signals`, `/contacts`, `/wallet`

### `viral` - Viral Landing Pages
- **When**: Any user on shareable pages
- **Chrome**: Minimal (back button only)
- **Background**: Purple/cyan gradient
- **Examples**: `/collections`, `/boost/[id]`
- **Note**: Shows same UI for auth/unauth, but adds actions for authenticated

### `embed` - Iframe Embeds
- **When**: `?embed=true` query param
- **Chrome**: None
- **Background**: Transparent
- **Examples**: Partner site embeds

### `kiosk` - Demo/Display Mode
- **When**: `?kiosk=true` query param
- **Chrome**: Large header, simplified
- **Background**: Purple/cyan gradient
- **Examples**: Hackathon demos, in-store displays

## Helper Functions

### `allowsAuthenticatedActions(mode)`
Check if mode supports authenticated user actions (Send, Collect, etc.)

### `showsNavigation(mode)`
Check if mode should show full app navigation

### `showsSignupCTA(mode, isAuthenticated)`
Check if mode should show signup/join CTAs

### `getModeBackground(mode)`
Get appropriate background class for mode

## Testing

```tsx
import { detectLayoutMode } from '@/lib/layout/mode-detector'

test('detects viral mode for /collections when not authenticated', () => {
  const mode = detectLayoutMode({
    pathname: '/collections',
    isAuthenticated: false
  })
  expect(mode).toBe('viral')
})

test('detects app mode for /signals when authenticated', () => {
  const mode = detectLayoutMode({
    pathname: '/signals',
    isAuthenticated: true
  })
  expect(mode).toBe('app')
})

test('detects embed mode from query param', () => {
  const params = new URLSearchParams('?embed=true')
  const mode = detectLayoutMode({
    pathname: '/collections',
    isAuthenticated: false,
    searchParams: params
  })
  expect(mode).toBe('embed')
})
```

## Migration from Auth-Based Switching

### Before (auth-based):
```tsx
{isAuthenticated ? (
  <AppUI>{children}</AppUI>
) : (
  <PublicUI>{children}</PublicUI>
)}
```

### After (mode-based):
```tsx
const mode = detectLayoutMode({ pathname, isAuthenticated })

const shells = {
  app: <AppShell>{children}</AppShell>,
  viral: <ViralShell>{children}</ViralShell>,
  embed: <EmbedShell>{children}</EmbedShell>,
  kiosk: <KioskShell>{children}</KioskShell>
}

return shells[mode]
```

## Benefits

1. **Semantic** - Mode names are self-documenting
2. **Testable** - Pure functions, easy to unit test
3. **Extensible** - Add new modes without refactoring
4. **Stable** - Mode only changes on path/param changes
5. **Contextual** - Can use multiple signals for decisions

## Future Enhancements

- Add `demo` mode for hackathon presentations
- Add `admin` mode for internal tools
- Add device detection (mobile/desktop specific modes)
- Add A/B test mode switching
