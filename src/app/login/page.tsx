// Imports

'use client';
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import Form from "@/components/form";
import { FormDataTypes } from "@/types/component";
import { newUserForm } from "@/utils/form/newUser";

// Exports

export default function LoginPage() {

  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.mustChangePassword) {
        setShowChangePassword(true);
      } else {
        setShowChangePassword(false);
      }
    }
  }, [status, session]);

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user?.mustChangePassword) {
          setShowChangePassword(true);
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: FormDataTypes) => {
    try{

      const response = await fetch(`/api/user-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if(!response.ok) {
        console.error('Failed to create user account');
        return;
      }

      const responseData = await response.json();

      if(!responseData.status || !responseData.data) {
        console.error('Failed to create user account:', responseData.message);
        return;
      }
      
    } catch(err) {
      console.error(err);
    } finally {
      setShowSignUp(false);
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#c33';
    if (passwordStrength <= 2) return '#f90';
    if (passwordStrength <= 3) return '#fa0';
    return '#3c3';
  };

  const getPasswordStrengthText = () => {
    if (newPassword.length === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/user-accounts/${session?.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        setError(data.message || 'Failed to change password');
        return;
      }
      
      await update();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (sessionData?.user?.mustChangePassword) {
        setError('Session update failed. Please refresh the page.');
        return;
      }
      
      setShowChangePassword(false);
      router.push("/");
      router.refresh();

    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if(showSignUp) {
    return (
      <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['secondary-background']}`}>
        <div className={`${styles['max-width-400']} ${styles['pd-all-round']} ${styles['primary-background']}`}>
          <Form
            setup={{
              api: null,
              content: newUserForm,
            }}
            onClose={() => setShowSignUp(false)}
            onSubmit={(data: FormDataTypes) => handleSignUp(data)}
          />
        </div>
      </div>
    )
  }

  if(showChangePassword) {
    return (
      <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['secondary-background']}`}>
        <form
          onSubmit={handlePasswordChange}
          className={`${styles['column-container']} ${styles['pd-all-round']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-20']} ${styles['primary-background']} ${styles['max-width-400']}`}
        >
          <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['margin-bottom']}`}>
            <h1 className={styles['title-text']}>Change Your Password</h1>
          </div>

          <p className={styles['description-text']} style={{ textAlign: 'center', fontSize: '14px' }}>
            For security reasons, you must change your password before continuing.
          </p>

          <div className={`${styles['margin-bottom']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-5']}`}>
            <label htmlFor="currentPassword" className={styles['label']}>
              Current Password
            </label>
            <div className={`${styles['row-container']} ${styles['align-center']} ${styles['gap-10']}`}>
              <input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                className={`${styles['input-structure']} ${styles['width-100']} ${loading ? styles['disabled'] : ''}`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles['clickable']}
                style={{ background: 'none', border: 'none', padding: '5px', fontSize: '14px', color: '#666' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className={`${styles['margin-bottom']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-5']}`}>
            <label htmlFor="newPassword" className={styles['label']}>
              New Password
            </label>
            <div className={`${styles['row-container']} ${styles['align-center']} ${styles['gap-10']}`}>
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className={`${styles['input-structure']} ${styles['width-100']} ${loading ? styles['disabled'] : ''}`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={styles['clickable']}
                style={{ background: 'none', border: 'none', padding: '5px', fontSize: '14px', color: '#666' }}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className={styles['column-container']} style={{ gap: '5px', marginTop: '5px' }}>
                <div style={{ height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor(),
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: getPasswordStrengthColor(), fontWeight: '600' }}>
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
          </div>

          <div className={`${styles['margin-bottom']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-5']}`}>
            <label htmlFor="confirmPassword" className={styles['label']}>
              Confirm New Password
            </label>
            <div className={`${styles['row-container']} ${styles['align-center']} ${styles['gap-10']}`}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className={`${styles['input-structure']} ${styles['width-100']} ${loading ? styles['disabled'] : ''} ${confirmPassword && newPassword !== confirmPassword ? styles['error-message'] : ''}`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles['clickable']}
                style={{ background: 'none', border: 'none', padding: '5px', fontSize: '14px', color: '#666' }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <span style={{ fontSize: '12px', color: '#c33' }}>
                Passwords do not match
              </span>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
              <span style={{ fontSize: '12px', color: '#3c3' }}>
                ✓ Passwords match
              </span>
            )}
          </div>

          {error && (
            <div className={`${styles['error-message']} ${styles['margin-bottom']}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            className={`${styles['button-structure']} ${styles['primary-button']} ${loading || newPassword.length < 8 || newPassword !== confirmPassword ? styles['un-clickable'] : styles['clickable']}`}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['secondary-background']}`}>
      <form
        onSubmit={handleSubmit}
        className={`${styles['column-container']} ${styles['pd-all-round']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-20']} ${styles['primary-background']}`}
      >
        <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['margin-bottom']}`}>
          <h1 className={styles['title-text']}>Login</h1>
        </div>

        <div className={`${styles['margin-bottom']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']}`}>
          <label htmlFor="email" className={styles['label']}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className={`${styles['input-structure']} ${loading ? styles['disabled'] : ''}`}
            placeholder="Enter your email"
          />
        </div>

        <div className={`${styles['margin-bottom']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']}`}>
          <label htmlFor="password" className={styles['label']}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className={`${styles['input-structure']} ${loading ? styles['disabled'] : ''}`}
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className={`${styles['error-message']} ${styles['margin-bottom']}`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${styles['button-structure']} ${styles['primary-button']} ${loading ? styles['un-clickable'] : styles['clickable']}`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']}`}>
          <p className={styles['description-text']}>Don't have an account? <span className={`${styles['clickable']} ${styles['clickable-text']}`}onClick={() => setShowSignUp(true)}>Sign up</span></p>
        </div>

      </form>
    </div>
  );
}
