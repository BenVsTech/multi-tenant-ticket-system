// Imports

"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../app/page.module.css";
import { DataManagementProps, FormDataTypes } from "@/types/component";
import Form from "@/components/form";
import Table, { NO_OP } from "@/components/table";
import ErrorPopup from "./errorPopup";

// Exports

export default function DataManagement({ setup }: DataManagementProps) {

    const { update } = useSession();
    const [showForm, setShowForm] = useState<boolean>(false);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [data, setData] = useState<string[][]>([]);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {

        const isAccountsApi = setup.api === '/api/accounts';

        if(setup.accessStatus && setup.access && !setup.access.view) {
            setDataLoaded(true);
            setData([]);
            return;
        }

        if(!setup.api || (!isAccountsApi && !setup.accountId)) {
            setDataLoaded(true);
            return;
        }

        try{
            setDataLoaded(false);
            const url = new URL(setup.api, window.location.origin);
            if(!isAccountsApi && setup.accountId) {
                url.searchParams.set('accountId', setup.accountId.toString());
            }
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(!response.ok) {
                setErrorMessage('Failed to fetch data');
                setDataLoaded(true);
                return;
            }

            const returnData = await response.json();

            if(returnData.status && returnData.data) {
                setData(returnData.data);
            } else {
                setErrorMessage(returnData.message || 'Failed to fetch data');
            }

        } catch(error: unknown) {
            setErrorMessage('Failed to fetch data');
        } finally {
            setDataLoaded(true);
        }
    }, [setup.api, setup.accountId, setup.accessStatus, setup.access]);

    useEffect(() => {
        fetchData();
    }, [fetchData])

    const handleSubmit = async (formData: FormDataTypes) => {

        const isAccountsApi = setup.api === '/api/accounts';
        const isUpdate = selectedRow !== null;

        if(!isUpdate && setup.accessStatus && setup.access && !setup.access.create) {
            setErrorMessage('You do not have permission to create items');
            return;
        }

        if(isUpdate && setup.accessStatus && setup.access && !setup.access.update) {
            setErrorMessage('You do not have permission to update items');
            return;
        }

        if(!isAccountsApi && !setup.accountId) {
            setErrorMessage('Account ID is required');
            return;
        }

        try {
            let url = isUpdate ? `${setup.api}/${selectedRow}` : setup.api;
            
            if(isUpdate && !isAccountsApi && setup.accountId) {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('accountId', setup.accountId.toString());
                url = urlObj.toString();
            }
            
            const method = isUpdate ? 'PUT' : 'POST';

            const requestBody = isUpdate || isAccountsApi ? formData : { ...formData, accountId: setup.accountId };

            const response = await fetch(url!, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if(!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to save data');
                return;
            }

            const result = await response.json();
            
            if(result.status) {
                await fetchData();
                setSelectedRow(null);
                setShowForm(false);
                
                if(isAccountsApi && !isUpdate) {
                    await update();
                }
            } else {
                setErrorMessage(result.message || 'Failed to save data');
            }
        } catch(error: unknown) {
            setErrorMessage('Failed to save data');
        }
    };

    const handleArchive = async (id: number) => {

        if(setup.accessStatus && setup.access && !setup.access.delete) {
            setErrorMessage('You do not have permission to delete items');
            return;
        }

        if(!setup.accountId) {
            setErrorMessage('Account ID is required');
            return;
        }

        if(!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const url = new URL(`${setup.api}/${id}`, window.location.origin);
            url.searchParams.set('accountId', setup.accountId.toString());
            
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to delete');
                return;
            }

            const result = await response.json();
            
            if(result.status) {
                await fetchData();
                setSelectedRow(null);
            } else {
                setErrorMessage(result.message || 'Failed to delete');
            }
        } catch(error: unknown) {
            setErrorMessage('Failed to delete');
        }
    }

    if(!dataLoaded) {
        return (
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["pd-all-round"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["background-style-primary"]}`}>
                Loading...
            </div>
        )
    }

    if(showForm) {
        return (
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["background-style-primary"]}`}>
                <Form 
                    setup={{ 
                        api: selectedRow !== null ? `${setup.api}/${selectedRow}` : null, 
                        content: setup.form,
                        accountId: setup.accountId
                    }} 
                    onClose={() => {
                        setSelectedRow(null);
                        setShowForm(false);
                    }} 
                    onSubmit={handleSubmit} 
                />
            </div>
        )
    }

    const canCreate = !setup.accessStatus || !setup.access || setup.access.create;

    const canUpdate = setup.api !== '/api/users' && (!setup.accessStatus || !setup.access || setup.access.update);
    const handleRowClick = canUpdate 
        ? (id: number) => {
            setSelectedRow(id);
            setShowForm(true);
        }
        : NO_OP;

    const canDelete = setup.deleteStatus && (!setup.accessStatus || !setup.access || setup.access.delete);

    return (
        <>
            {errorMessage && (
                <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["background-style-primary"]}`}>
            <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-space-between"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["wrap"]} ${styles["data-management-header"]}`}>
                <div className={`${styles["column-container"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-5"]} ${styles["data-management-title-section"]}`}>
                    <h1 className={`${styles["title-text"]} ${styles["text-left"]}`}>{setup.title}</h1>
                    <p className={`${styles["text-left"]}`}>{setup.description}</p>
                </div>
                {canCreate && (
                    <div className={`${styles["column-container"]} ${styles["content-end"]} ${styles["align-end"]} ${styles["gap-5"]} ${styles["data-management-button-section"]}`}>
                        <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["clickable"]} ${styles["data-management-button"]}`} onClick={() => setShowForm(true)}>{setup.createText}</button>
                    </div>
                )}
            </div>
            <Table 
                setup={{ 
                    headers: setup.headers, 
                    data: data, 
                    onClick: handleRowClick,
                    archiveable: canDelete, 
                    onArchive: async (id: number) => {
                        handleArchive(id);
                    }
                }} 
            />
        </div>
        </>
    )
}

