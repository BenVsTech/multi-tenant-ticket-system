// Imports

import styles from "@/app/page.module.css";
import { ErrorPopupProps } from "@/types/component";

// Exports

export default function ErrorPopup({ message, onClose }: ErrorPopupProps) {
    return (
        <div className={styles["popup-container"]}>
            <div className={`${styles["popup"]} ${styles["column-container"]} ${styles["width-100"]} ${styles["content-center"]} ${styles["align-center"]} ${styles["gap-10"]}`}>
                <h2 className={`${styles["title-text"]} ${styles["text-center"]}`}>Error</h2>
                <p className={`${styles["text-center"]}`}>{message}</p>
                <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-center"]} ${styles["align-center"]} ${styles["gap-10"]}`}>
                    <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["width-100"]} ${styles["clickable"]}`} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
}

