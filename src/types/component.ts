// Exports

export interface sections {
    management: boolean;
    admin: boolean;
    account: boolean;
    system: boolean;
}

export interface SettingsProps {
    setup: {
        onClose: () => void;
    }
}

