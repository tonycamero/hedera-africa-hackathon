"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  UserPlus,
  Smartphone,
  Mail,
  Phone,
  Upload,
  Send,
  CheckCircle,
  Users,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface AddContactModalProps {
  children: React.ReactNode
}

export function AddContactModal({ children }: AddContactModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('phone')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [importing, setImporting] = useState(false)
  const [sending, setSending] = useState(false)

  console.log('[AddContactModal] Render state:', { open, activeTab })

  const handleImportContacts = async () => {
    setImporting(true)
    
    // Simulate contact import process
    toast.success('📱 Accessing your contacts...', {
      description: 'This may take a moment',
      duration: 2000,
    })
    
    setTimeout(() => {
      setImporting(false)
      toast.success('✨ Found 12 potential professional contacts!', {
        description: 'Select contacts to send invitations',
        duration: 3000,
      })
      // In real app, would show contact selection interface
    }, 2000)
  }

  const handleSendInvite = async (method: 'email' | 'phone') => {
    const contact = method === 'email' ? email : phoneNumber
    if (!contact) {
      toast.error(`Please enter a valid ${method}`)
      return
    }

    setSending(true)
    
    toast.success(`📤 Sending invite to ${contact}...`, {
      description: 'Professional invitation on its way!',
      duration: 2000,
    })
    
    setTimeout(() => {
      setSending(false)
      toast.success(`🎉 Invitation sent successfully!`, {
        description: `${name || contact} will receive your TrustMesh invite`,
        duration: 3000,
      })
      
      // Reset form
      setEmail('')
      setPhoneNumber('')
      setName('')
      setRole('')
      setOpen(false)
    }, 1500)
  }

  const mockContacts = [
    { name: 'Sarah Johnson', email: 'sarah@techcorp.com', role: 'Product Manager' },
    { name: 'Michael Chen', email: 'mchen@startup.io', role: 'Software Engineer' },
    { name: 'Emily Rodriguez', phone: '+1 (555) 123-4567', role: 'Marketing Director' },
    { name: 'David Kim', email: 'david@consulting.com', role: 'Strategy Consultant' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-auto modal-magenta-base sheen-sweep modal-magenta-border">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00F6FF]" />
            Add Professional Contact
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm">
            Connect with colleagues and grow your professional network
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
            <TabsTrigger 
              value="phone" 
              className="data-[state=active]:bg-[#00F6FF]/20 data-[state=active]:text-[#00F6FF] text-white/70"
            >
              <Smartphone className="w-4 h-4 mr-1" />
              Phone Contacts
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="data-[state=active]:bg-[#00F6FF]/20 data-[state=active]:text-[#00F6FF] text-white/70"
            >
              <Mail className="w-4 h-4 mr-1" />
              Add Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="space-y-4 mt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00F6FF]/20 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-[#00F6FF]" />
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Import from Phone</h3>
                <p className="text-sm text-white/60 mb-4">
                  We'll scan your contacts to find potential professional connections
                </p>
              </div>

              <Button 
                onClick={handleImportContacts}
                disabled={importing}
                className="w-full bg-gradient-to-r from-[#00F6FF]/80 to-purple-500/80 hover:from-[#00F6FF] hover:to-purple-500 text-white font-medium py-3"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing Contacts...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Access Phone Contacts
                  </>
                )}
              </Button>

              <div className="text-xs text-white/50 bg-slate-800 rounded-lg p-3 border border-white/10">
                🔒 Your contacts are processed securely and never stored on our servers
              </div>
            </div>

            {/* Mock contact preview after import */}
            {importing && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-white/80">Found Contacts</h4>
                {mockContacts.slice(0, 2).map((contact, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00F6FF]/20 flex items-center justify-center">
                        <Users className="w-3 h-3 text-[#00F6FF]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{contact.name}</div>
                        <div className="text-xs text-white/60">{contact.role}</div>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-white/80">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-white/80">
                    Role
                  </Label>
                  <Input
                    id="role"
                    placeholder="Job title"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-white/80 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                />
                <Button
                  onClick={() => handleSendInvite('email')}
                  disabled={!email || sending}
                  className="w-full mt-2 bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email Invite
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-white/40 text-sm">or</div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-white/80 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 bg-slate-800 border-white/20 text-white placeholder:text-white/40 focus:border-[#00F6FF] focus:ring-1 focus:ring-[#00F6FF]/20"
                />
                <Button
                  onClick={() => handleSendInvite('phone')}
                  disabled={!phoneNumber || sending}
                  className="w-full mt-2 bg-green-600/80 hover:bg-green-600 text-white"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send SMS Invite
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-white/50 text-center mt-4 p-3 bg-slate-800 rounded-lg border border-white/10">
          💡 Tip: Invited contacts will receive a secure link to join your professional network
        </div>
      </DialogContent>
    </Dialog>
  )
}