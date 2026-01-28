// Imports

import styles from "@/app/page.module.css";
import { TableProps } from "@/types/component";

// Constants

export const NO_OP = () => {};

// Exports

export default function Table({ setup }: TableProps) {

    return (
        <div className={styles["table-wrapper"]}>
            <table className={styles["table-container"]}>
                <thead>
                    <tr>
                        {setup.headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                        {setup.archiveable && (
                            <th>Archive</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {setup.data.length === 0 ? (
                        <tr>
                            <td colSpan={setup.headers.length} className={styles["text-center"]}>No data available</td>
                        </tr>
                    ) : (
                        setup.data.map((row, rowIndex) => {
                            const isClickable = setup.onClick !== NO_OP;
                            return (
                                <tr 
                                    key={rowIndex} 
                                    className={isClickable ? styles["clickable"] : undefined} 
                                    onClick={isClickable ? () => setup.onClick(Number(row[0])) : undefined}
                                >
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                    {setup.archiveable && (
                                        <td>
                                            <button
                                                className={`${styles["button-structure"]} ${styles["secondary-button"]}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setup.onArchive(Number(row[0]));
                                                }}
                                            >
                                                Archive
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}