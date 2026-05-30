import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
    const token = localStorage.getItem('token');
    if (token) navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="p-8 w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to continue to ChatApp</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              name="email"
              autoComplete="email"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Signing...' : 'Sign in'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/register')}>Register</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
