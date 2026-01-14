import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        await register(formData.email, formData.password, formData.name);
        toast.success('Account created successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">PayoutHub</h1>
              <p className="text-sm text-slate-500">Insurance Payout Management</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading font-bold text-3xl tracking-tight text-slate-900">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500">
              {isLogin 
                ? 'Enter your credentials to access your dashboard' 
                : 'Get started with your payout management system'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  data-testid="register-name-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Background Image */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1765046255517-412341954c4c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMGRhdGElMjBmbG93JTIwbWluaW1hbGlzdHxlbnwwfHx8fDE3Njg0MTQ3NzN8MA&ixlib=rb-4.1.0&q=85)'
        }}
      >
        <div className="h-full w-full bg-slate-900/40 flex items-end p-12">
          <div className="text-white max-w-lg">
            <h3 className="font-heading font-bold text-2xl mb-3">Streamline Your Payout Process</h3>
            <p className="text-slate-200 text-sm leading-relaxed">
              Process carrier reports, map custom fields, detect conflicts automatically, 
              and manage agent payouts all in one powerful platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
