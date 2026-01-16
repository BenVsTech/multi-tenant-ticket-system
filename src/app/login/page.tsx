// Imports

'use client';
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

// Exports

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      </form>
    </div>
  );
}
