"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Shield, QrCode, Circle, Award } from "lucide-react"
import type { SignalMetadata } from "@/lib/types/SignalTypes"
import { HederaClient, type HederaNFT } from "@/packages/hedera/HederaClient"
import trustMeshAPI from "@/services/TrustMeshAPI"

export default function TrustMeshApp() {
  const [activeTab, setActiveTab] = useState("contacts")

  const mockSignals: SignalMetadata[] = [
    {
      name: "Study Group Catalyst",
      type: "signal",
      category: "academic",
      issuer: "Campus",
      recipient: "user123",
      timestamp: "2024-01-15T10:30:00Z",
      status: "active",
      description: "For forming study groups",
    },
    {
      name: "Bug Smasher",
      type: "signal",
      category: "peer-to-peer",
      issuer: "Dev Team",
      recipient: "user123",
      timestamp: "2024-02-20T14:45:00Z",
      status: "active",
      description: "For debugging excellence",
    },
    {
      name: "Community Harmonizer",
      type: "signal",
      category: "institutional",
      issuer: "Student Council",
      recipient: "user123",
      timestamp: "2024-03-10T09:15:00Z",
      status: "active",
      description: "For building community",
    },
    {
      name: "Silent Builder",
      type: "signal",
      category: "peer-to-peer",
      issuer: "Project Team",
      recipient: "user123",
      timestamp: "2024-03-15T16:20:00Z",
      status: "active",
      description: "For consistent contributions",
    },
    {
      name: "Trust Architect",
      type: "signal",
      category: "institutional",
      issuer: "Organization",
      recipient: "user123",
      timestamp: "2024-03-20T11:30:00Z",
      status: "active",
      description: "For building trust networks",
    },
  ]

  const mockConnections = [
    { id: 1, name: "Sarah Kim", avatar: "SK", mutualCount: 3, trustScore: 8.5, status: "circle", timeAgo: "2m ago" },
    { id: 2, name: "Mike Rivera", avatar: "MR", mutualCount: 1, trustScore: 6.2, status: "circle", timeAgo: "1h ago" },
    { id: 3, name: "Priya Patel", avatar: "PP", mutualCount: 5, trustScore: 9.1, status: "circle", timeAgo: "3h ago" },
    { id: 4, name: "David Wright", avatar: "DW", mutualCount: 2, trustScore: 7.8, status: "circle", timeAgo: "1d ago" },
    { id: 5, name: "Emma Foster", avatar: "EF", mutualCount: 0, trustScore: 0, status: "pending", timeAgo: "2d ago" },
    {
      id: 6,
      name: "Carlos Mendez",
      avatar: "CM",
      mutualCount: 1,
      trustScore: 5.5,
      status: "pending",
      timeAgo: "3d ago",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">TrustMesh</h1>
              </div>
            </div>
            <div className="text-sm text-slate-500">4/9 members • 6 of 9 trust tokens allocated</div>
          </div>

          <nav className="flex bg-slate-100 rounded-lg p-1">
            {[
            { id: "contacts", label: "Contacts", icon: Users },
            { id: "circle", label: "Circle", icon: Circle },
            { id: "signals", label: "Signals", icon: Award },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === id ? "bg-green-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {activeTab === "contacts" && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-lime-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Trust Network</h2>
                    <p className="text-sm text-green-600">HCS Profile & Token Management</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">4</div>
                    <div className="text-xs text-slate-500">of 9 circle</div>
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Connect Now
                </Button>
              </CardContent>
            </Card>


            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Connections</h3>
              </div>

              <div className="space-y-3">
                {mockConnections.map((connection) => (
                  <Card key={connection.id} className="border-slate-200 hover:border-green-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 relative">
                          <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                            {connection.avatar}
                          </AvatarFallback>
                          {connection.status === "circle" && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{connection.name}</h3>
                            {connection.status === "circle" && (
                              <Badge className="bg-green-100 text-green-700 text-xs">Circle</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500">
                              {connection.mutualCount} mutual • {connection.timeAgo}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {connection.status === "pending" && (
                            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "circle" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Circle</h2>

              {/* Simple 9-dot circular layout */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                {Array.from({ length: 9 }, (_, i) => {
                  const angle = (i * 360) / 9 - 90 // Start from top
                  const radian = (angle * Math.PI) / 180
                  const x = Math.cos(radian) * 80 + 96 // 96 is center (192/2)
                  const y = Math.sin(radian) * 80 + 96

                  let status = "available"
                  if (i < 4) status = "active"
                  else if (i < 6) status = "pending"

                  return (
                    <div
                      key={i}
                      className={`absolute w-4 h-4 rounded-full transform -translate-x-2 -translate-y-2 ${
                        status === "active" ? "bg-green-500" : status === "pending" ? "bg-yellow-500" : "bg-slate-300"
                      }`}
                      style={{ left: x, top: y }}
                    />
                  )
                })}

                {/* Center shield */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-xs text-slate-500 mb-6">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Active (4)
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Pending (2)
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  Available (3)
                </div>
              </div>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-yellow-500">⚡</span>
                  Open Invitations
                </h3>
                <div className="space-y-3">
                  {mockConnections
                    .filter((c) => c.status === "pending")
                    .slice(0, 2)
                    .map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                            {connection.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{connection.name}</p>
                          <p className="text-xs text-slate-500">Sent you a trust token</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs bg-transparent">
                            Decline
                          </Button>
                          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Circle Members (4)
                </h3>
                <div className="space-y-3">
                  {mockConnections
                    .filter((c) => c.status === "circle")
                    .slice(0, 4)
                    .map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {connection.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{connection.name}</p>
                          <p className="text-xs text-slate-500">Trust Level 2</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs">Circle</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Trust Signals</h2>
                <p className="text-sm text-slate-500">Authentic reputation markers</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mockSignals.map((signal, index) => (
                  <Card key={index} className="border-slate-200 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold bg-green-600">
                          {signal.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <h3 className="font-semibold text-sm text-slate-900 mb-1">{signal.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{signal.issuer}</p>
                        <Badge className="text-xs bg-green-100 text-green-700">
                          Verified
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-3 text-xs bg-transparent">
                        Verify
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-2 border-dashed border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-600 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white text-xl">+</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Issue Trust Signal</h3>
                <p className="text-sm text-slate-500 mb-4">Institutional signals for verified achievements</p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">Create Signal</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
