// Imports

'use client';
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

// Exports

export default function Home() {

  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<React.ReactNode>(<div>Home</div>);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']}`}>
        <div>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['row-container']} ${styles['content-start']} ${styles['align-stretch']}`}>
      <ul className={`${styles['width-200']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['primary-background']} ${styles['text-center']}`}>
        <li className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['pd-all-round']}`}>
          <img src="assets/brand.webp" alt="Logo" className={`${styles['icon-structure']}`} />
        </li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'home' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('home')}>Home</li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'my-tickets' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('my-tickets')}>My Tickets</li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'performance' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('performance')}>Performance</li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'management' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('management')}>Management</li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'admin' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('admin')}>Admin</li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'settings' ? styles['selected'] : ''}`} onClick={() => setSelectedContent('settings')}>Settings</li>
      </ul>
      <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['secondary-background']}`}>
        <div className={`${styles['width-100']} ${styles['pd-all-round']} ${styles['row-container']} ${styles['content-space-between']} ${styles['align-center']} ${styles['primary-background']}`}>
          <select 
            className={`${styles['input-structure']}`} 
            name="accounts" 
            id="accounts"
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">Select Account</option>
            {session.user.roles.map((role) => (
              <option key={role.accountId} value={role.accountId.toString()}>
                {role.accountName} ({role.role})
              </option>
            ))}
          </select>
          <img src="assets/settings.png" alt="Settings" className={`${styles['icon-structure']} ${styles['margin-left']} ${styles['clickable']}`} />
        </div>
        <div className={`${styles['width-100']} ${styles['height-100']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']}`}>
          {content}
        </div>
      </div>
    </div>
  );
}
