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

export interface RenderSectionProps {
    setup: {
        accountId: number | null;
        permissions: string[];
        reference: string;
    }
}

