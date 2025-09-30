import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, Lock, Calculator, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, signIn } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      // Error handling is done in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-elevation-3">
              <Calculator className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welkom bij AlloonApp
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
            Log in om je loonadministratie te beheren
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-3 p-8 border border-gray-200 dark:border-gray-700 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="E-mailadres"
              type="email"
              startIcon={<Mail className="h-5 w-5" />}
              {...register('email', { 
                required: 'E-mailadres is verplicht',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ongeldig e-mailadres'
                }
              })}
              error={errors.email?.message}
              placeholder="naam@bedrijf.nl"
            />

            <Input
              label="Wachtwoord"
              type={showPassword ? 'text' : 'password'}
              startIcon={<Lock className="h-5 w-5" />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              {...register('password', { 
                required: 'Wachtwoord is verplicht',
                minLength: {
                  value: 6,
                  message: 'Wachtwoord moet minimaal 6 karakters zijn'
                }
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <Link
                to="/reset-password"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Inloggen
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nog geen account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                Registreer hier
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;