// Imports

'use client';
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import Form from "@/components/form";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { FormDataTypes } from "@/types/component";
import { newUserForm } from "@/utils/form/newUser";

// Exports

export default function LoginPage() {

  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.mustChangePassword) {
        setShowChangePassword(true);
      } else {
        setShowChangePassword(false);
      }
    }
  }, [status, session]);


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

  const handlePasswordChangeSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const sessionResponse = await fetch('/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    if (sessionData?.user?.mustChangePassword) {
      throw new Error('Session update failed. Please refresh the page.');
    }
    
    setShowChangePassword(false);
    router.push("/");
    router.refresh();
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
        <ChangePasswordForm
          setup={{
            onSuccess: handlePasswordChangeSuccess,
            onError: (errorMessage: string) => setError(errorMessage),
          }}
        />
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
