'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginWithMagicEmail } from '@/lib/services/MagicWalletService';
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
      
      // Redirect to onboarding for profile creation
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
