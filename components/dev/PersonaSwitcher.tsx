'use client'

import { useState } from 'react'

const options = [
  { value: 'professional', label: 'Professional' },
  { value: 'genz', label: 'GenZ' },
  { value: 'civic', label: 'Civic' },
]

export default function PersonaSwitcher() {
  const [value, setValue] = useState<string>('')

  const set = (p: string) => {
    document.cookie = `tm_persona=${p}; path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    window.location.reload()
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm opacity-70">Persona:</span>
      <select
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          set(e.target.value)
        }}
        className="border rounded px-2 py-1 text-sm bg-background"
      >
        <option value="" disabled>
          Switch…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
