// Imports

"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../app/page.module.css";
import ErrorPopup from "./errorPopup";

// Exports

export default function DeleteMyData() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);

    const handleDelete = async () => {
        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetch('/api/users/me/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to delete account');
                setLoading(false);
                setShowConfirm(false);
                return;
            }

            const result = await response.json();

            if (result.status) {
                await signOut({ redirect: false });
                router.push('/login');
                router.refresh();
            } else {
                setErrorMessage(result.message || 'Failed to delete account');
                setLoading(false);
                setShowConfirm(false);
            }
        } catch (error: unknown) {
            setErrorMessage('An error occurred while deleting your account. Please try again.');
            setLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Delete My Data</h1>
                <p className={`${styles['text-left']}`}>
                    {showConfirm 
                        ? 'This action is irreversible. All your data will be permanently deleted. Are you absolutely sure?'
                        : 'Are you sure you want to delete your data? This action is irreversible.'
                    }
                </p>
                <div className={`${styles['row-container']} ${styles['gap-10']} ${styles['width-100']} ${styles['content-center']} ${styles['align-center']}`}>
                    {showConfirm && (
                        <button 
                            className={`${styles['button-structure']} ${styles['secondary-button']} ${styles['clickable']}`}
                            onClick={() => {
                                setShowConfirm(false);
                                setErrorMessage(null);
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        className={`${styles['button-structure']} ${styles['primary-button']} ${styles['clickable']}`}
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : showConfirm ? 'Confirm Delete' : 'Delete'}
                    </button>
                </div>
            </div>
            {errorMessage && (
                <ErrorPopup 
                    message={errorMessage} 
                    onClose={() => setErrorMessage(null)} 
                />
            )}
        </>
    )
}