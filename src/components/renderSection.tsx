// Imports

import React, { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import { RenderSectionProps } from "@/types/component";
import ChangePasswordForm from "@/components/ChangePasswordForm";

// Exports

export default function RenderSection({ setup }: RenderSectionProps) {

    const [content, setContent] = useState<React.ReactNode>(null);
    const [reference, setReference] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        switch (setup.reference) {
            case "home":
                setContent(
                    <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-10']}`}>
                        <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Welcome to the Ticket Management System</h1>
                        <p className={`${styles['text-left']}`}>In this system you can manage tickets, teams, users, and more.</p>
                    </div>
                );
                break;
            case "my-tickets":
                setContent(<div>This is the my tickets section where you can view your tickets</div>);
                break;
            case "performance":
                setContent(<div>This is the performance section where you can view the performance of teams and employeees</div>);
                break;
            case "teams":
                setContent(<div>This is the teams section where you can view the teams and their members</div>);
                break;
            case "tickets":
                setContent(<div>This is the tickets section where you can view the tickets and their details</div>);
                break;
            case "comments":
                setContent(<div>This is the comments section where you can view the comments and their details</div>);
                break;
            case "user-management":
                setContent(<div>This is the user management section where you can manage the users and their details</div>);
                break;
            case "updated-password":
                setContent(
                    <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['gap-10']}`}>
                        <ChangePasswordForm 
                            setup={{ 
                                userId: setup.accountId || undefined, 
                                onSuccess: () => { setReference('updated-password'); setSuccess(true); }, 
                                onError: (error: string) => { console.error(error); } 
                            }} 
                        />
                    </div>
                );
                break;
            case "manage-accounts":
                setContent(<div>This is the manage accounts section where you can view the accounts you own</div>);
                break;
            case "report-problem":
                setContent(<div>This is the report problem section where you can report a problem you are having with the system</div>);
                break;
            default:
                setContent(
                    <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-10']}`}>
                        <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Welcome to the Ticket Management System</h1>
                        <p className={`${styles['text-left']}`}>In this system you can manage tickets, teams, users, and more.</p>
                    </div>
                )
        }
    }, [setup.reference]);

    if(success) {
        return (
            <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-10']}`}>
                {reference === 'updated-password' && (
                    <>
                        <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Password Changed Successfully</h1>
                        <p className={`${styles['text-left']}`}>Your password has been changed successfully. You can now login with your new password.</p>
                    </>
                )}
            </div>
        )
    }

    return <>{content}</>;
}

