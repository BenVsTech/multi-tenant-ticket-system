// Imports

"use client";
import { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import PieChart from "./pieChart";
import Table from "./table";
import { AnalyticsProps, PieSlice } from "@/types/component";
import { statusOptions } from "@/utils/constants";

// Sample Data

const ticketData = [
    { id: '1', label: 'Unassigned', value: 55, fill: '#A8A8D8' },
    { id: '2', label: 'In Progress', value: 19, fill: '#FFC966' },
    { id: '3', label: 'On Hold', value: 6, fill: '#FF8A8A' },
    { id: '4', label: 'Blocked', value: 4, fill: '#C0C0C0' },
    { id: '5', label: 'Cancelled', value: 39, fill: '#5BA3F5' },
    { id: '6', label: 'Completed', value: 64, fill: '#6DD4A8' },
];

const backlogData = [
    {
        reference: '1',
        data: [
            {id: '1', label: 'employee 1', value: 20, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 15, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 12, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 8, fill: '#5DB3B3'},
        ]
    },
    {
        reference: '2',
        data: [
            {id: '1', label: 'employee 1', value: 8, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 5, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 4, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 2, fill: '#5DB3B3'},
        ]
    },
    {
        reference: '3',
        data: [
            {id: '1', label: 'employee 1', value: 2, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 2, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 1, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 1, fill: '#5DB3B3'},
        ]
    },
    {
        reference: '4',
        data: [
            {id: '1', label: 'employee 1', value: 1, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 1, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 1, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 1, fill: '#5DB3B3'},
        ]
    },
    {
        reference: '5',
        data: [
            {id: '1', label: 'employee 1', value: 12, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 11, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 9, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 7, fill: '#5DB3B3'},
        ]
    },
    {
        reference: '6',
        data: [
            {id: '1', label: 'employee 1', value: 18, fill: '#6B9BD2'},
            {id: '2', label: 'employee 2', value: 17, fill: '#7BC8A4'},
            {id: '3', label: 'employee 3', value: 15, fill: '#B19CD9'},
            {id: '4', label: 'employee 4', value: 14, fill: '#5DB3B3'},
        ]
    }
];

// Exports

export default function TeamPerformance(setup: AnalyticsProps) {

    const [employeeData, setEmployeeData] = useState<PieSlice[]>([]);

    return (
        <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-start']} ${styles['align-start']} ${styles['gap-20']}`}>

            <div className={`${styles['width-100']} ${styles['column-container']} ${styles['content-center']} ${styles['align-center']} ${styles['gap-10']}`}>
                <h1 className={`${styles['title-text']} ${styles['text-center']}`}>Team Performance Dashboard</h1>
                <p className={`${styles['text-center']}`}>This is the team performance dashboard where you can view the performance of your team</p>
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
                    <PieChart setup={{ data: ticketData, clickable: true }} onClick={(reference) => {
                        setEmployeeData(backlogData.find((data) => data.reference === reference)?.data || []);
                    }} />
                </div>
                <div className={styles['pie-chart-wrapper']}>
                    <h2 className={`${styles['title-text']} ${styles['text-center']}`}>Ticket Distribution</h2>
                    <PieChart setup={{ data: employeeData, clickable: false }} onClick={() => {}} />
                </div>
            </div>

        </div>
    )
}