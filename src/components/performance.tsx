// Imports

"use client";
import { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import PieChart from "./pieChart";
import Table from "./table";
import { AnalyticsProps, PieSlice } from "@/types/component";
import { statusOptions } from "@/utils/constants";

// Sample Data

const teamData = [
    { id: '1', label: 'team 1', value: 80, fill: '#6B9BD2' },
    { id: '2', label: 'team 2', value: 63, fill: '#7BC8A4' },
    { id: '3', label: 'team 3', value: 29, fill: '#B19CD9' },
    { id: '4', label: 'team 4', value: 15, fill: '#5DB3B3' },
];

const backlogData = [
    {
        reference: '1',
        data: [
            {id: '1', label: 'Unassigned', value: 25, fill: '#A8A8D8'},
            {id: '2', label: 'In Progress', value: 8, fill: '#FFC966'},
            {id: '3', label: 'On Hold', value: 3, fill: '#FF8A8A'},
            {id: '4', label: 'Blocked', value: 2, fill: '#C0C0C0'},
            {id: '5', label: 'Cancelled', value: 12, fill: '#5BA3F5'},
            {id: '6', label: 'Completed', value: 30, fill: '#6DD4A8'}
        ]
    },
    {
        reference: '2',
        data: [
            {id: '1', label: 'Unassigned', value: 15, fill: '#A8A8D8'},
            {id: '2', label: 'In Progress', value: 5, fill: '#FFC966'},
            {id: '3', label: 'On Hold', value: 2, fill: '#FF8A8A'},
            {id: '4', label: 'Blocked', value: 1, fill: '#C0C0C0'},
            {id: '5', label: 'Cancelled', value: 18, fill: '#5BA3F5'},
            {id: '6', label: 'Completed', value: 22, fill: '#6DD4A8'}
        ]
    },
    {
        reference: '3',
        data: [
            {id: '1', label: 'Unassigned', value: 10, fill: '#A8A8D8'},
            {id: '2', label: 'In Progress', value: 4, fill: '#FFC966'},
            {id: '3', label: 'On Hold', value: 1, fill: '#FF8A8A'},
            {id: '4', label: 'Blocked', value: 0, fill: '#C0C0C0'},
            {id: '5', label: 'Cancelled', value: 6, fill: '#5BA3F5'},
            {id: '6', label: 'Completed', value: 8, fill: '#6DD4A8'}
        ]
    },
    {
        reference: '4',
        data: [
            {id: '1', label: 'Unassigned', value: 5, fill: '#A8A8D8'},
            {id: '2', label: 'In Progress', value: 2, fill: '#FFC966'},
            {id: '3', label: 'On Hold', value: 0, fill: '#FF8A8A'},
            {id: '4', label: 'Blocked', value: 1, fill: '#C0C0C0'},
            {id: '5', label: 'Cancelled', value: 3, fill: '#5BA3F5'},
            {id: '6', label: 'Completed', value: 4, fill: '#6DD4A8'}
        ]
    }
];

// Exports

export default function Performance(setup: AnalyticsProps) {

    const [ticketData, setTicketData] = useState<PieSlice[]>([]);

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-20']}`}>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Overall Performance Dashboard</h1>
                <p className={`${styles['text-center']}`}>This is the overall performance dashboard where you can view the performance of the system</p>
            </div>

            <Table setup={{
                headers: statusOptions,
                data: [['55', '19', '6', '4', '39', '64', '200', '387']],
                onClick: () => {},
                archiveable: false,
                onArchive: () => {}
            }} />

            <div className={`${styles['width-100']} ${styles['pie-charts-container']}`}>
                <div className={styles['pie-chart-wrapper']}>
                    <h2 className={`${styles['title-text']} ${styles['text-center']}`}>Team Distribution</h2>
                    <PieChart setup={{ data: teamData, clickable: true }} onClick={(reference) => {
                        setTicketData(backlogData.find((data) => data.reference === reference)?.data || []);
                    }} />
                </div>
                <div className={styles['pie-chart-wrapper']}>
                    <h2 className={`${styles['title-text']} ${styles['text-center']}`}>Ticket Distribution</h2>
                    <PieChart setup={{ data: ticketData, clickable: false }} onClick={() => {}} />
                </div>
            </div>

        </div>
    )
}