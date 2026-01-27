// Imports

'use client';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "../app/page.module.css";
import { ChangePasswordFormProps } from "@/types/component";

export default function ChangePasswordForm({ setup }: ChangePasswordFormProps) {

    const { data: session, update } = useSession();
    const requireCurrentPassword = setup.requireCurrentPassword ?? true;
    const title = setup.title ?? "Change Your Password";
    const description = setup.description ?? "For security reasons, you must change your password before continuing.";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let strength = 0;
        if (newPassword.length >= 8) strength++;
        if (newPassword.length >= 12) strength++;
        if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
        if (/[0-9]/.test(newPassword)) strength++;
        if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;
        setPasswordStrength(strength);
    }, [newPassword]);

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

        if (requireCurrentPassword && !currentPassword) {
        setError("Current password is required");
        return;
        }

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
        const targetUserId = setup.userId || session?.user?.id;
        
        if (!targetUserId) {
            setError("User ID is required");
            return;
        }

        const response = await fetch(`/api/user-accounts/${targetUserId}`, {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            currentPassword: requireCurrentPassword ? currentPassword : '',
            newPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            const errorMessage = data.message || 'Failed to change password';
            setError(errorMessage);
            if (setup.onError) {
            setup.onError(errorMessage);
            }
            return;
        }
        
        if (update) {
            await update();
        }
        
        if (setup.onSuccess) {
            try {
            await setup.onSuccess();
            } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred after password change';
            setError(errorMessage);
            if (setup.onError) {
                setup.onError(errorMessage);
            }
            return;
            }
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");

        } catch (err) {
        const errorMessage = "An error occurred. Please try again.";
        setError(errorMessage);
        if (setup.onError) {
            setup.onError(errorMessage);
        }
        } finally {
        setLoading(false);
        }
    };

  return (
    <form
      onSubmit={handlePasswordChange}
      className={`${styles['column-container']} ${styles['pd-all-round']} ${styles['content-start']} ${styles['align-stretch']} ${styles['gap-20']} ${styles['primary-background']} ${styles['max-width-400']} ${setup.className || ''}`}
    >
      <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['margin-bottom']}`}>
        <h1 className={styles['title-text']}>{title}</h1>
      </div>

      <p className={styles['description-text']} style={{ textAlign: 'center', fontSize: '14px' }}>
        {description}
      </p>

      {requireCurrentPassword && (
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
              required={requireCurrentPassword}
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
      )}

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
        disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword || (requireCurrentPassword && !currentPassword)}
        className={`${styles['button-structure']} ${styles['primary-button']} ${loading || newPassword.length < 8 || newPassword !== confirmPassword || (requireCurrentPassword && !currentPassword) ? styles['un-clickable'] : styles['clickable']}`}
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
}

