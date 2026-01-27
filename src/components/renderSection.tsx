// Imports

import React, { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import { RenderSectionProps } from "@/types/component";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import Form from "@/components/form";
import { reportProblemForm } from "@/utils/form/reportProblem";

// Exports

export default function RenderSection({ setup }: RenderSectionProps) {

    const [content, setContent] = useState<React.ReactNode>(null);
    const [reference, setReference] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {

        setSuccess(false);
        setReference('');
        
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
                setContent(
                    <Form 
                        setup={{ 
                            api: null, 
                            content: reportProblemForm 
                        }} 
                        onClose={() => {}} 
                        onSubmit={(data) => { handleReportProblem(data); }} 
                    />
                );
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

    const handleReportProblem = async (data: any) => {
        try{

            const requestBody = {
                issueType: data['problem-type'] || data.issueType,
                issueDescription: data.description || data.issueDescription
            };

            const response = await fetch('/api/report-issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if(!response.ok) {
                const errorData = await response.json();
                console.error('Failed to report problem:', errorData.message || 'Unknown error');
                return;
            }

            const responseData = await response.json();

            if(!responseData.status) {
                console.error('Email failed to send:', responseData.message);
                return;
            }

            setReference('report-problem');
            setSuccess(true);

        } catch(error: unknown) {
            console.error('Failed to report problem', error);
        }
    }

    if(success) {
        return (
            <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-10']}`}>
                {reference === 'updated-password' && (
                    <>
                        <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Password Changed Successfully</h1>
                        <p className={`${styles['text-left']}`}>Your password has been changed successfully. You can now login with your new password.</p>
                    </>
                )}
                {reference === 'report-problem' && (
                    <>
                        <h1 className={`${styles['title-text']} ${styles['text-left']}`}>Problem Reported Successfully</h1>
                        <p className={`${styles['text-left']}`}>Your problem has been reported successfully. We will review it and get back to you as soon as possible.</p>
                    </>
                )}
            </div>
        )
    }

    return <>{content}</>;
}

