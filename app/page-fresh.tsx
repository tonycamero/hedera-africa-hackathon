"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Simple interfaces for now
interface CreateProfileRequest {
  display_name: string
  visibility: 'public' | 'private'
}

export default function TrustMeshApp() {
  const [activeTab, setActiveTab] = useState("profiles")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [profileForm, setProfileForm] = useState<CreateProfileRequest>({
    display_name: '',
    visibility: 'public'
  })

  const handleCreateProfile = async () => {
    setLoading(true)
    try {
      // TODO: Connect to API
      setMessage("Profile creation coming soon...")
      console.log("Profile form:", profileForm)
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TrustMesh API Testing</h1>
          <p className="text-slate-600">Direct 1:1 mapping to backend endpoints</p>
          
          {message && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-700">
              {message}
            </div>
          )}
        </div>

        <nav className="flex bg-white rounded-lg p-1 mb-8 border">
          {[
            { id: "profiles", label: "Profiles" },
            { id: "trust-tokens", label: "Trust Tokens" },
            { id: "badges", label: "Badges" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === id ? "bg-green-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="grid gap-6">
          {activeTab === "profiles" && (
            <Card>
              <CardHeader>
                <CardTitle>POST /profiles - Create Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <Input
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm(prev => ({...prev, display_name: e.target.value}))}
                    placeholder="Enter display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Visibility</label>
                  <Select 
                    value={profileForm.visibility} 
                    onValueChange={(value: 'public' | 'private') => setProfileForm(prev => ({...prev, visibility: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateProfile} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Profile'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "trust-tokens" && (
            <Card>
              <CardHeader>
                <CardTitle>POST /trust-tokens - Give Trust Token</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Trust token form coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "badges" && (
            <Card>
              <CardHeader>
                <CardTitle>POST /badges - Create Badge</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Badge creation form coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}