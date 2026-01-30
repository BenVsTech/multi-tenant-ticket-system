// Imports

'use client';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sections, FormDataTypes } from "@/types/component";
import styles from "./page.module.css";
import Settings from "@/components/settings";
import RenderSection from "@/components/renderSection";
import AccountSelect from "@/components/accountSelect";
import Form from "@/components/form";
import { accountForm } from "@/utils/form/account";
import ErrorPopup from "@/components/errorPopup";

// Exports

export default function Home() {

  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<sections>({management: false, admin: false, system: false});
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated" || session?.user?.mustChangePassword) {
      router.push("/login");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && selectedAccount) {
      const accountPermissions = session.user.roles.find((role) => role.accountId.toString() === selectedAccount)?.permissions;
      if (accountPermissions) {
        setPermissions(accountPermissions);
      }
    } else {
      setPermissions([]);
      setSelectedContent(null);
    }
  }, [selectedAccount, session]);


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

  const createAccount = async (data: FormDataTypes) => {
    try{

      const response = await fetch(`/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if(!response.ok) {
        setErrorMessage('Failed to create user account');
        return;
      }

      const responseData = await response.json();

      if(!responseData.status || !responseData.data) {
        setErrorMessage(responseData.message || 'Failed to create account');
        return;
      }

      await update();
      setSelectedAccount(null);

    } catch(error: unknown) {
      setErrorMessage('Error creating account. Please try again.');
    }
  }

  if(selectedAccount === "new") {
    return (
      <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['secondary-background']} ${styles['scrollable']}`}>
        <div className={`${styles['max-width-400']} ${styles['pd-all-round']} ${styles['primary-background']}`}>
          <Form 
            setup={{ 
              api: null, 
              content: accountForm 
            }} 
            onClose={() => setSelectedAccount(null)} 
            onSubmit={(data) => createAccount(data)}
          />
        </div>
      </div>
    )
  }

  const handleMenuClick = (content: string | null) => {
    setSelectedContent(content);
    setMobileMenuOpen(false);
  };

  const handleSectionToggle = (section: keyof sections) => {
    setOpenSections({ ...openSections, [section]: !openSections[section] });
  };

  return (
    <div className={`${styles['width-100']} ${styles['height-fill']} ${styles['row-container']} ${styles['content-start']} ${styles['align-stretch']}`}>

      {showSettings && (
        <Settings setup={{ onClose: () => setShowSettings(false) }} />
      )}

      {errorMessage && (
        <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {mobileMenuOpen && (
        <div 
          className={styles['mobile-menu-overlay']}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <ul className={`${styles['width-200']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['primary-background']} ${styles['text-center']} ${styles['scrollable']} ${styles['sidebar-nav']} ${mobileMenuOpen ? styles['open'] : ''}`}>

        <li className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['pd-all-round']}`}><img src="assets/brand.webp" alt="Logo" className={`${styles['icon-structure']}`} /></li>
        <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'home' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); handleMenuClick('home'); }}>Home</li>
        <li className={`${styles['pd-all-round']} ${permissions.includes('ticket.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'my-tickets' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('ticket.view') && handleMenuClick('my-tickets'); }}>My Tickets</li>
        <li className={`${styles['pd-all-round']} ${permissions.includes('performance.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'performance' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('performance.view') && handleMenuClick('performance'); }}>Performance</li>

        <li className={`${styles['pd-all-round']} ${permissions.includes('team.view') || permissions.includes('ticket.view') || permissions.includes('comment.view') ? styles['clickable'] : styles['un-clickable']}`} onClick={(e) => { e.stopPropagation(); (permissions.includes('team.view') || permissions.includes('ticket.view') || permissions.includes('comment.view')) && handleSectionToggle('management'); }}>Management</li>

        {openSections.management && (
          <ul className={`${styles['width-100']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['tertiary-background']}`}>
            <li className={`${styles['pd-all-round']} ${permissions.includes('team.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'teams' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('team.view') && handleMenuClick('teams'); }}>Teams</li>
            <li className={`${styles['pd-all-round']} ${permissions.includes('ticket.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'tickets' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('ticket.view') && handleMenuClick('tickets'); }}>Tickets</li>
            <li className={`${styles['pd-all-round']} ${permissions.includes('comment.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'comments' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('comment.view') && handleMenuClick('comments'); }}>Comments</li>
          </ul>
        )}

        <li className={`${styles['pd-all-round']} ${permissions.includes('user.view') ? styles['clickable'] : styles['un-clickable']}`} onClick={(e) => { e.stopPropagation(); permissions.includes('user.view') && handleSectionToggle('admin'); }}>Admin</li>

        {openSections.admin && (
          <ul className={`${styles['width-100']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['tertiary-background']}`}>
            <li className={`${styles['pd-all-round']} ${permissions.includes('user.view') ? styles['clickable'] : styles['un-clickable']} ${selectedContent === 'user-management' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); permissions.includes('user.view') && handleMenuClick('user-management'); }}>User Management</li>
          </ul>
        )}

        <li className={`${styles['pd-all-round']} ${styles['clickable']}`} onClick={(e) => { e.stopPropagation(); handleSectionToggle('system'); }}>System</li>

        {openSections.system && (
          <ul className={`${styles['width-100']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-stretch']} ${styles['tertiary-background']}`}>
            <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'updated-password' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); handleMenuClick('updated-password'); }}>Updated Password</li>
            <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'manage-accounts' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); handleMenuClick('manage-accounts'); }}>Manage Accounts</li>
            <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'report-problem' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); handleMenuClick('report-problem'); }}>Report a Problem</li>
            <li className={`${styles['pd-all-round']} ${styles['clickable']} ${selectedContent === 'delete-my-data' ? styles['selected'] : ''}`} onClick={(e) => { e.stopPropagation(); handleMenuClick('delete-my-data'); }}>Delete My Data</li>
          </ul>
        )}

      </ul>

      <div className={`${styles['width-100']} ${styles['flex-1']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['secondary-background']}`}>
        <div className={`${styles['width-100']} ${styles['pd-all-round']} ${styles['row-container']} ${styles['content-space-between']} ${styles['align-center']} ${styles['primary-background']}`}>
          <div className={`${styles['width-100']} ${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
            <button 
              className={`${styles['mobile-menu-button']} ${styles['clickable']}`}
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-label="Toggle menu"
              type="button"
            >
              ☰
            </button>
            <AccountSelect setup={{ onAccountChange: (account: string) => setSelectedAccount(account), accounts: session.user.roles.map((role) => ({ name: role.accountName, id: role.accountId.toString() })) }} />
          </div>
          <img 
            src="assets/settings.png" 
            alt="Settings" 
            className={`${styles['icon-structure']} ${styles['margin-left']} ${styles['clickable']}`} 
            onClick={() => setShowSettings(true)} 
          />
        </div>
        <div className={`${styles['width-100']} ${styles['flex-1']} ${styles['pd-all-round']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['scrollable']}`}>
          <RenderSection 
            setup={{ 
              accountId: Number(selectedAccount), 
              permissions: permissions, 
              reference: selectedContent || 'home' 
            }} />
        </div>
      </div>
    </div>
  );
}
