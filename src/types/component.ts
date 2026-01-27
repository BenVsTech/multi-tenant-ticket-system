// Exports

export interface sections {
    management: boolean;
    admin: boolean;
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

export interface OptionApi {
    api: string;
    ref: string;
}

export interface Option {
    value: string;
    label: string;
}

export interface element {
    tag: string;
    type: string;
    label: string;
    instructions: string;
    id: string;
    name: string;
    placeholder: string;
    required: boolean;
    optionApiStatus: boolean;
    optionApiRef: string | null;
    options: Option[];
}

export interface FormElements {
    title: string;
    description: string;
    apiOptionsStatus: boolean;
    apiOptions: OptionApi[];
    elements: element[];
}

export interface FormDataTypes {
    [key: string]: string | number | boolean | null | undefined;
}

export interface FormProps {
    setup: {
        api: string | null;
        content: FormElements;
    },
    onClose: () => void;
    onSubmit: (data: FormDataTypes) => void;
}

export interface AccountSelectProps {
    setup: {
        onAccountChange: (account: string) => void;
        accounts: {name: string, id: string}[];
    }
}

export interface ChangePasswordFormProps {
    setup: {
        userId?: number | string;
        onSuccess?: () => void | Promise<void>;
        onError?: (error: string) => void;
        title?: string;
        description?: string;
        requireCurrentPassword?: boolean;
        className?: string;
    }
}

