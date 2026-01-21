// Imports

import { useState } from "react";
import styles from "../app/page.module.css";
import { AccountSelectProps } from "@/types/component";

// Exports

export default function AccountSelect({setup}: AccountSelectProps) {

    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    return (
        <select 
            className={`${styles['input-structure']}`} 
            name="accounts" 
            id="accounts"
            value={selectedAccount || ''}
            onChange={(e) => {
                setSelectedAccount(e.target.value);
                setup.onAccountChange(e.target.value);
            }}
        >
            <option value="">Select Account</option>
            {setup.accounts.map((account, index) => (
              <option key={index} value={account.id}>
                {account.name}
              </option>
            ))}
            <option value="new">Create New Account</option>
        </select>
    )
}

