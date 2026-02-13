// Imports

"use client";
import { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import PieChart from "./pieChart";
import Table from "./table";
import ErrorPopup from "./errorPopup";
import { AnalyticsProps, PieSlice, TeamPerformanceData, PerformanceApiData } from "@/types/component";
import { statusOptions } from "@/utils/constants";

// Exports

export default function Performance({ setup }: AnalyticsProps) {

    const [teamData, setTeamData] = useState<TeamPerformanceData[]>([]);
    const [totalsTableData, setTotalsTableData] = useState<string[][]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedTeam = teamData.find((team) => team.id === selectedTeamId);
    const ticketData: PieSlice[] = selectedTeam?.data || [];

    useEffect(() => {

        const fetchData = async () => {

            if(!setup.accountId) {
                return;
            }
    
            try{
    
                const response = await fetch(`/api/performance?accountId=${setup.accountId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
    
                if(!response.ok) {
                    setErrorMessage('Error fetching performance data');
                    setDataLoaded(true);
                    return;
                }
    
                const data = await response.json();

                if(data.status && data.data) {
                    const performanceData: PerformanceApiData = data.data;

                    setTeamData(performanceData.teams);

                    const totalsRow = statusOptions.map((status) => {
                        if(status === 'Total') {
                            const totalTickets = Object.values(performanceData.totals).reduce((sum, count) => sum + count, 0);
                            return totalTickets.toString();
                        }
                        const count = performanceData.totals[status] ?? 0;
                        return count.toString();
                    });

                    setTotalsTableData([totalsRow]);
                } else {
                    setErrorMessage(data.message || 'Error fetching performance data');
                }
    
            } catch(error) {
                setErrorMessage('Error fetching performance data');
            } finally {
                setDataLoaded(true);
            }

        }

        fetchData();

    }, [setup.accountId])

    if(!dataLoaded) {
        return (
            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-20']}`}>
                Loading...
                {errorMessage && (
                    <ErrorPopup
                        message={errorMessage}
                        onClose={() => setErrorMessage(null)}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-20']}`}>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Performance Dashboard</h1>
                <p className={`${styles['text-center']}`}>This is the performance dashboard where you can view the performance of the system</p>
            </div>

            <Table setup={{
                headers: statusOptions,
                data: totalsTableData,
                onClick: () => {},
                archiveable: false,
                onArchive: () => {}
            }} />

            <div className={`${styles['width-100']} ${styles['pie-charts-container']} ${styles['gap-20']}`}>
                <div className={styles['pie-chart-wrapper']}>
                    <h2 className={`${styles['title-text']} ${styles['text-center']}`}>Team Distribution</h2>
                    <PieChart setup={{ data: teamData, clickable: true }} onClick={(reference) => {
                        setSelectedTeamId(reference);
                    }} />
                </div>
                <div className={styles['pie-chart-wrapper']}>
                    <h2 className={`${styles['title-text']} ${styles['text-center']}`}>Ticket Distribution</h2>
                    <PieChart setup={{ data: ticketData, clickable: false }} onClick={() => {}} />
                </div>
            </div>

            {errorMessage && (
                <ErrorPopup
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}

        </div>
    )
}