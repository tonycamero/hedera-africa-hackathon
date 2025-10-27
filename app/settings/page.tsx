'use client'

import { GenZCard, GenZHeading, GenZText } from '@/components/ui/genz-design-system'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-4">
          <GenZHeading level={2}>Settings</GenZHeading>
        </div>

        <GenZCard variant="glass" className="p-5">
          <GenZHeading level={4}>Preferences</GenZHeading>
          <GenZText dim className="text-sm mt-2">
            Settings and preferences will be available here soon.
          </GenZText>
        </GenZCard>

        <GenZCard variant="glass" className="p-5">
          <GenZHeading level={4}>Notifications</GenZHeading>
          <GenZText dim className="text-sm mt-2">
            Manage notification preferences.
          </GenZText>
        </GenZCard>

        <GenZCard variant="glass" className="p-5">
          <GenZHeading level={4}>Privacy</GenZHeading>
          <GenZText dim className="text-sm mt-2">
            Privacy and security settings.
          </GenZText>
        </GenZCard>
      </div>
    </div>
  )
}
