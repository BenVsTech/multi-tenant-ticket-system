// Imports

import React, { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import { RenderSectionProps } from "@/types/component";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import Form from "@/components/form";
import DataManagement from "@/components/dataManagement";
import DeleteMyData from "./deleteMyData";
import ErrorPopup from "./errorPopup";
import Comment from "@/components/comment";
import OverallPerformance from "./overallPerformance";
import TeamPerformance from "./teamPerformance";
import { reportProblemForm } from "@/utils/form/reportProblem";
import { accountForm } from "@/utils/form/account";
import { userForm } from "@/utils/form/user";
import { teamForm } from "@/utils/form/team";
import { ticketForm } from "@/utils/form/ticket";
import { ReportProblemFormData } from "@/types/component";

// Functions

function notAuthorized() {
    return (
        <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-10']}`}>
            <h1 className={`${styles['title-text']} ${styles['text-left']}`}>You are not authorized to access this section</h1>
            <p className={`${styles['text-left']}`}>Please select an account from the dropdown menu above.</p>
        </div>
    )
}

// Exports

export default function RenderSection({ setup }: RenderSectionProps) {

    const [content, setContent] = useState<React.ReactNode>(null);
    const [reference, setReference] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            case "overall-performance":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(<OverallPerformance setup={{ accountId: setup.accountId }} />);
                break;
            case "team-performance":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(<TeamPerformance setup={{ accountId: setup.accountId }} />);
                break;
            case "teams":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(
                    <DataManagement 
                        setup={{ 
                            accountId: setup.accountId,
                            title: 'Manage Teams', 
                            description: 'This is the manage teams section where you can view the teams and their details', 
                            createText: 'Create Team', 
                            deleteStatus: true, 
                            form: teamForm, 
                            headers: ['ID', 'Name', 'Description', 'Last Updated', 'Created On'], 
                            api: '/api/teams',
                            accessStatus: true,
                            access: {
                                view: setup.permissions.includes('team.view'),
                                create: setup.permissions.includes('team.create'),
                                update: setup.permissions.includes('team.update'),
                                delete: setup.permissions.includes('team.delete')
                            }
                        }} 
                    />
                );
                break;
            case "tickets":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(
                    <DataManagement 
                        setup={{ 
                            accountId: setup.accountId,
                            title: 'Manage Tickets', 
                            description: 'This is the manage tickets section where you can view the tickets and their details', 
                            createText: 'Create Ticket', 
                            deleteStatus: true, 
                            form: ticketForm, 
                            headers: ['ID', 'Title', 'Description', 'Status', 'Created By', 'Assigned To', 'Last Updated', 'Created On'], 
                            api: '/api/tickets',
                            accessStatus: true,
                            access: {
                                view: setup.permissions.includes('ticket.view'),
                                create: setup.permissions.includes('ticket.create'),
                                update: setup.permissions.includes('ticket.update'),
                                delete: setup.permissions.includes('ticket.delete')
                            }
                        }} 
                    />
                );
                break;
            case "comments":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(<Comment setup={{ accountId: setup.accountId }} />);
                break;
            case "user-management":
                if(!setup.accountId) {
                    setContent(notAuthorized());
                    break;
                }

                setContent(
                    <DataManagement 
                        setup={{ 
                            accountId: setup.accountId,
                            title: 'Manage Users', 
                            description: 'This is the manage users section where you can view the users and their details', 
                            createText: 'Create User', 
                            deleteStatus: true, 
                            form: userForm, 
                            headers: ['ID', 'Name', 'Email', 'Role', 'Last Updated', 'Created On'], 
                            api: '/api/users',
                            accessStatus: true,
                            access: {
                                view: setup.permissions.includes('user.view'),
                                create: setup.permissions.includes('user.create'),
                                update: setup.permissions.includes('user.update'),
                                delete: setup.permissions.includes('user.delete')
                            }
                        }} 
                    />
                );
                break;
            case "updated-password":
                setContent(
                    <div className={`${styles['width-100']} ${styles['height-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-center']} ${styles['gap-10']}`}>
                        <ChangePasswordForm 
                            setup={{ 
                                userId: setup.accountId || undefined, 
                                onSuccess: () => { setReference('updated-password'); setSuccess(true); }, 
                                onError: (error: string) => { setErrorMessage(error); } 
                            }} 
                        />
                    </div>
                );
                break;
            case "manage-accounts":
                setContent(
                    <DataManagement 
                        setup={{ 
                            accountId: null,
                            title: 'Manage Accounts', 
                            description: 'This is the manage accounts section where you can view the accounts you own', 
                            createText: 'Create Account', 
                            deleteStatus: true, 
                            form: accountForm, 
                            headers: ['ID', 'Name', 'Description', 'Last Updated', 'Created On'], 
                            api: '/api/accounts',
                            accessStatus: false,
                            access: null
                        }} 
                    />
                );
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
            case "delete-my-data":
                setContent(<DeleteMyData />);
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

    const handleReportProblem = async (data: ReportProblemFormData) => {
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
                setErrorMessage(errorData.message || 'Failed to report problem');
                return;
            }

            const responseData = await response.json();

            if(!responseData.status) {
                setErrorMessage(responseData.message || 'Email failed to send');
                return;
            }

            setReference('report-problem');
            setSuccess(true);

        } catch(error: unknown) {
            setErrorMessage('Failed to report problem');
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

    return (
        <>
            {errorMessage && (
                <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
            {content}
        </>
    );
}

