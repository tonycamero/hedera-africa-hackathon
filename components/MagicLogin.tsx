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
    <Card className="w-full max-w-md mx-auto bg-panel border-white/10">
      <CardHeader>
        <CardTitle className="text-genz-text">Welcome to TrustMesh</CardTitle>
        <CardDescription className="text-genz-text-dim">
          Sign in with your email to get started with 27 free recognition mints
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
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
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
