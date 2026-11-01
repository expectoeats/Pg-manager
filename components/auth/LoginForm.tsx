'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        setIsRedirecting(true);
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  const isBusy = isSubmitting || isRedirecting;

  return (
    <Card className="rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border-0 p-8">
      <CardHeader>
        <CardTitle className="text-[22px] font-semibold text-[#1C1C1E]">Welcome back</CardTitle>
        <CardDescription className="text-sm text-[#8E8E93]">Enter your credentials to access the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@pg.com"
              disabled={isBusy}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[#FF3B30] text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isBusy}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[#FF3B30] text-sm">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full h-[44px] rounded-xl font-semibold"
            isLoading={isBusy}
            loadingText={isRedirecting ? 'Opening Dashboard...' : 'Signing in...'}
          >
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
