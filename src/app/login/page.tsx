'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import styles from './login.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('praveen@synco.app');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  const handleQuickDemoSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        email: 'praveen@synco.app',
        password: 'password123',
        redirect: false,
        callbackUrl,
      });

      if (!res?.error) {
        router.push(callbackUrl);
      } else {
        setErrorMessage('Demo authentication failed. Please try again.');
      }
    } catch {
      setErrorMessage('Could not sign in with demo credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.splitPage}>
      {/* Left Column: Logo & Text */}
      <section className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <div className={styles.logoBadge}>
            <img src="/logo.png" alt="SYNCO" />
          </div>
          <div className={styles.brandTextGroup}>
            <span className={styles.brandText}>
              <span className={styles.brandHighlight}>SYN</span>
              <span className={styles.brandChrome}>CO</span>
            </span>
            <span className={styles.brandTagline}>
              TASK <span className={styles.taglineSep}>|</span> CALENDAR <span className={styles.taglineSep}>|</span> SYNC
            </span>
          </div>
        </div>

        <div className={styles.leftContent}>
          <h1 className={styles.heroHeading}>
            Manage, delegate, and sync{' '}
            <span className={styles.heroHeadingHighlight}>all in one place.</span>
          </h1>

          <p className={styles.heroDescription}>
            Unify your team projects, smart calendar schedules, and persistent notes with
            instant bi-directional Google Calendar synchronization.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Calendar size={14} />
              </div>
              <span>Live 2-way Google Calendar synchronization</span>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Layers size={14} />
              </div>
              <span>Multi-assignee task boards with automatic color coding</span>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <CheckCircle2 size={14} />
              </div>
              <span>Clean, responsive interface with instant meeting links</span>
            </div>
          </div>
        </div>

        <div className={styles.leftFooter}>
          <span className={styles.leftFooterMark}>AN UP THREE PLATFORM</span>
          <span>DESIGN | BUILD | MANAGE</span>
        </div>
      </section>

      {/* Right Column: Minimal Login Credentials Form */}
      <section className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSubtitle}>
              Welcome back! Enter your credentials to access your workspace.
            </p>
          </div>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

          <form className={styles.credentialsForm} onSubmit={handleCredentialsSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                Email address
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  className={styles.textInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.textInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  className={styles.rememberCheckbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className={styles.forgotPasswordLink} tabIndex={0} role="button">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span>or continue with</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleSignIn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className={styles.demoButton}
              onClick={handleQuickDemoSignIn}
              disabled={isLoading}
            >
              <Sparkles size={16} />
              <span>Quick Demo Sign In (Praveen Kumar)</span>
            </button>
          </div>

          <p className={styles.termsNote}>
            By signing in, you agree to SYNCO&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
