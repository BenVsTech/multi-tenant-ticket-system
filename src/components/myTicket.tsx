// Imports

"use client";
import { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import Table from "./table";
import ErrorPopup from "./errorPopup";
import { MyTicketProps } from "@/types/component";

// Functions 

function AssignTickets(props: {
    assignTicketId: number | null;
    accountId: number | null;
    setAssignTicketStatus: (status: boolean) => void;
    setAssignTicketId: (id: number | null) => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}) {
    const { assignTicketId, accountId, setAssignTicketStatus, setAssignTicketId, onSuccess, onError } = props;
    const [assigning, setAssigning] = useState(false);

    const handleYes = async () => {
        if (assignTicketId == null || accountId == null) return;
        setAssigning(true);
        try {
            const response = await fetch(`/api/tickets/my/assign?accountId=${accountId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: assignTicketId }),
            });
            const data = await response.json();
            if (!response.ok || !data.status) {
                onError(data.message || "Failed to assign ticket");
                return;
            }
            setAssignTicketStatus(false);
            setAssignTicketId(null);
            onSuccess();
        } catch (e) {
            onError(e instanceof Error ? e.message : "Failed to assign ticket");
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
            <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Do you want to assign ticket #{assignTicketId} to yourself?</h1>
            <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <button
                    className={`${styles['button-structure']} ${styles['primary-button']} ${styles['clickable']}`}
                    onClick={handleYes}
                    disabled={assigning}
                >
                    {assigning ? "Assigning…" : "Yes"}
                </button>
                <button
                    className={`${styles['button-structure']} ${styles['secondary-button']} ${styles['clickable']}`}
                    onClick={() => {
                        setAssignTicketStatus(false);
                        setAssignTicketId(null);
                    }}
                    disabled={assigning}
                >
                    No
                </button>
            </div>
        </div>
    );
}

function UpdateStatus(props: {
    id: number | null;
    status: string | null;
    accountId: number | null;
    setUpdateValue: (value: { id: number | null; status: string | null }) => void;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}) {
    const { id, status, accountId, setUpdateValue, onClose, onSuccess, onError } = props;
    const [updating, setUpdating] = useState(false);

    const handleUpdate = async () => {
        if (id == null || status == null || accountId == null) return;
        setUpdating(true);
        try {
            const response = await fetch(`/api/tickets/${id}?accountId=${accountId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok || !data.status) {
                onError(data.message || "Failed to update status");
                return;
            }
            onClose();
            onSuccess();
        } catch (e) {
            onError(e instanceof Error ? e.message : "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
            <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Update Status{id != null ? ` — Ticket #${id}` : ''}</h1>
            <select
                className={`${styles['input-structure']}`}
                value={status || ''}
                onChange={(e) => setUpdateValue({ id, status: e.target.value || null })}
            >
                <option value="Backlog">Backlog</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Blocked">Blocked</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
            </select>
            <div className={`${styles['row-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <button
                    className={`${styles['button-structure']} ${styles['primary-button']} ${styles['clickable']}`}
                    onClick={handleUpdate}
                    disabled={updating}
                >
                    {updating ? "Updating…" : "Update"}
                </button>
                <button
                    className={`${styles['button-structure']} ${styles['secondary-button']} ${styles['clickable']}`}
                    onClick={onClose}
                    disabled={updating}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// Exports

export default function MyTicket({ setup }: MyTicketProps) {

    const [tickets, setTickets] = useState<{open: string[][], created: string[][], assigned: string[][]}>({open: [], created: [], assigned: []});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [assignTicketStatus, setAssignTicketStatus] = useState<boolean>(false);
    const [assignTicketId, setAssignTicketId] = useState<number | null>(null);
    const [showUpdateStatusAssigned, setShowUpdateStatusAssigned] = useState<boolean>(false);
    const [updateValueAssigned, setUpdateValueAssigned] = useState<{id: number | null, status: string | null}>({id: null, status: null});
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetchTickets = () => setRefreshTrigger((t) => t + 1);

    useEffect(() => {

        if(!setup.accountId) {
            setErrorMessage('Account ID is required');
            setTickets({open: [], created: [], assigned: []});
            return;
        }

        const fetchTickets = async () => {
            setLoading(true);
            try{

                const response = await fetch(`/api/tickets/my?accountId=${setup.accountId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if(!response.ok) {
                    setErrorMessage('Failed to fetch tickets');
                    setTickets({open: [], created: [], assigned: []});
                    return;
                }

                const data = await response.json();

                if(data.status && data.data) {
                    setTickets({open: data.data.open, created: data.data.created, assigned: data.data.assigned});
                } else {
                    setErrorMessage(data.message || 'Failed to fetch tickets');
                    setTickets({open: [], created: [], assigned: []});
                }

            } catch(error: unknown) {
                setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch tickets');
                setTickets({open: [], created: [], assigned: []});
            } finally {
                setLoading(false);
            }
        }

        fetchTickets();

    }, [setup.accountId, refreshTrigger]);

    if(loading) {
        return (
            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-20']}`}>
                Loading...
            </div>
        )
    }

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-20']}`}>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Open Tickets</h1>
                <p className={`${styles['text-center']}`}>Here you can view the open tickets for your team</p>
                <Table
                    setup={{
                        headers: ['ID', 'Title', 'Status', 'Last Updated', 'Created On'],
                        data: tickets.open,
                        onClick: (id: number) => {
                            setAssignTicketStatus(true);
                            setAssignTicketId(id);
                        },
                        archiveable: false,
                        onArchive: () => {}
                    }} 
                />
                {assignTicketStatus && (
                    <AssignTickets
                        assignTicketId={assignTicketId}
                        accountId={setup.accountId}
                        setAssignTicketStatus={setAssignTicketStatus}
                        setAssignTicketId={setAssignTicketId}
                        onSuccess={refetchTickets}
                        onError={setErrorMessage}
                    />
                )}
            </div>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>My Created Tickets</h1>
                <p className={`${styles['text-center']}`}>Here you can view the tickets you have created</p>
                <Table
                    setup={{
                        headers: ['ID', 'Title', 'Status', 'Last Updated', 'Created On'],
                        data: tickets.created,
                        onClick: () => {},
                        archiveable: false,
                        onArchive: () => {}
                    }} 
                />
            </div>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>My Assigned Tickets</h1>
                <p className={`${styles['text-center']}`}>Here you can view the tickets you are assigned to</p>
                <Table
                    setup={{
                        headers: ['ID', 'Title', 'Status', 'Last Updated', 'Created On'],
                        data: tickets.assigned,
                        onClick: (id: number) => {
                            const row = tickets.assigned.find((r) => r[0] === String(id));
                            setUpdateValueAssigned({ id, status: row ? row[2] : null });
                            setShowUpdateStatusAssigned(true);
                        },
                        archiveable: false,
                        onArchive: () => {}
                    }} 
                />
                {showUpdateStatusAssigned && (
                    <UpdateStatus
                        id={updateValueAssigned.id}
                        status={updateValueAssigned.status}
                        accountId={setup.accountId}
                        setUpdateValue={setUpdateValueAssigned}
                        onClose={() => {
                            setShowUpdateStatusAssigned(false);
                            setUpdateValueAssigned({ id: null, status: null });
                        }}
                        onSuccess={refetchTickets}
                        onError={setErrorMessage}
                    />
                )}
            </div>

            {errorMessage && (
                <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

        </div>
    )
}

