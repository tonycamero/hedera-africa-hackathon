'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginWithMagicEmail } from '@/lib/services/MagicWalletService';
import { getValidMagicToken } from '@/lib/auth/getValidMagicToken';
import { useRouter } from 'next/navigation';

export function MagicLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginWithMagicEmail(email);
      console.log('[MagicLogin] User logged in:', user);
      
      // [HCS-22] Non-blocking identity ASSERT - Phase 4 T1
      // SECURITY: Server derives canonical DID from Magic token, no PII sent
      if (user?.magicDID) {
        console.log('[HCS22 ASSERT] Logging identity assertion for:', user.magicDID);
        
        // Get fresh JWT (guaranteed valid)
        getValidMagicToken().then(token => {
          console.log('[HCS22 ASSERT] JWT (fresh):', token.substring(0, 50) + '...');
          
          // Fire and forget - don't await (non-blocking)
          fetch('/api/hcs22/resolve?mode=ASSERT', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }).then(res => {
            console.log('[HCS22 ASSERT] Response status:', res.status);
            return res.json();
          }).then(data => {
            console.log('[HCS22 ASSERT] Result:', data);
          }).catch(err => {
            console.warn('[HCS22 ASSERT] Failed (non-blocking):', err.message);
          });
        }).catch(err => {
          console.warn('[HCS22 ASSERT] Could not get valid token:', err.message);
        });
      }
      
      // Check if user has existing profile
      try {
        const token = await getValidMagicToken();
        const res = await fetch('/api/profile/status', { 
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.hasCompletedOnboarding) {
            // Existing user - go to contacts
            console.log('[MagicLogin] Returning user, routing to /contacts');
            router.push('/contacts');
            router.refresh();
            return;
          }
        }
      } catch (err) {
        console.log('[MagicLogin] Profile check failed, routing to onboarding');
      }
      
      // New user - go to onboarding
      console.log('[MagicLogin] New user, routing to /onboard');
      router.push('/onboard');
      router.refresh();
    } catch (err: any) {
      console.error('[MagicLogin] Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-panel border-orange-500/20 shadow-[0_0_24px_rgba(251,146,60,0.15)]">
      <CardHeader>
        <CardTitle className="text-genz-text">Welcome to TrustMesh</CardTitle>
        <CardDescription className="text-genz-text-dim">
          Sign in with your email to get started with 135 free recognition mints
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-panel2 border-white/10 text-white placeholder:text-genz-text-dim"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Magic'}
          </Button>

          <p className="text-xs text-genz-text-dim text-center">
            We'll send you an email with a magic link to sign in.
            <br />
            No password required.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
