// Imports

"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "../app/page.module.css";
import { DataManagementProps } from "@/types/component";
import Form from "@/components/form";
import Table, { NO_OP } from "@/components/table";

// Exports

export default function DataManagement({ setup }: DataManagementProps) {

    const { update } = useSession();
    const [showForm, setShowForm] = useState<boolean>(false);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [data, setData] = useState<string[][]>([]);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);

    const fetchData = useCallback(async () => {

        const isAccountsApi = setup.api === '/api/accounts';

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
                console.error('Failed to fetch data');
                return;
            }

            const returnData = await response.json();

            if(returnData.status && returnData.data) {
                setData(returnData.data);
            } else {
                console.error(returnData.message);
            }

        } catch(error: unknown) {
            console.error('Failed to fetch data', error);
            return;
        } finally {
            setDataLoaded(true);
        }
    }, [setup.api, setup.accountId]);

    useEffect(() => {
        fetchData();
    }, [fetchData])

    const handleSubmit = async (formData: any) => {

        const isAccountsApi = setup.api === '/api/accounts';
        const isUpdate = selectedRow !== null;

        if(!isAccountsApi && !setup.accountId) {
            console.error('Account ID is required');
            return;
        }

        try {
            const url = isUpdate ? `${setup.api}/${selectedRow}` : setup.api;
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
                console.error('Failed to save data:', errorData.message || 'Unknown error');
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
                console.error('Failed to save data:', result.message);
            }
        } catch(error: unknown) {
            console.error('Failed to save data', error);
        }
    };

    const handleArchive = async (id: number) => {

        if(!setup.accountId) {
            console.error('Account ID is required');
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
                console.error('Failed to delete:', errorData.message || 'Unknown error');
                return;
            }

            const result = await response.json();
            
            if(result.status) {
                await fetchData();
                setSelectedRow(null);
            } else {
                console.error('Failed to delete:', result.message);
            }
        } catch(error: unknown) {
            console.error('Failed to delete', error);
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
                        content: setup.form 
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

    return (
        <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["background-style-primary"]}`}>
            <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-space-between"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["wrap"]} ${styles["data-management-header"]}`}>
                <div className={`${styles["column-container"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-5"]} ${styles["data-management-title-section"]}`}>
                    <h1 className={`${styles["title-text"]} ${styles["text-left"]}`}>{setup.title}</h1>
                    <p className={`${styles["text-left"]}`}>{setup.description}</p>
                </div>
                <div className={`${styles["column-container"]} ${styles["content-end"]} ${styles["align-end"]} ${styles["gap-5"]} ${styles["data-management-button-section"]}`}>
                    <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["clickable"]} ${styles["data-management-button"]}`} onClick={() => setShowForm(true)}>{setup.createText}</button>
                </div>
            </div>
            <Table 
                setup={{ 
                    headers: setup.headers, 
                    data: data, 
                    onClick: setup.api === '/api/users' 
                        ? NO_OP
                        : (id: number) => {
                            setSelectedRow(id);
                            setShowForm(true);
                        }, 
                    archiveable: setup.deleteStatus, 
                    onArchive: async (id: number) => {
                        handleArchive(id);
                    }
                }} 
            />
        </div>
    )
}

