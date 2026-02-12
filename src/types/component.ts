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
        accountId?: number | null;
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

export interface DataManagementProps {
    setup: {
        accountId: number | null;
        title: string;
        description: string;
        createText: string;
        deleteStatus: boolean;
        form: FormElements;
        headers: string[];
        api: string;
        accessStatus: boolean;
        access: {
            view: boolean;
            create: boolean;
            update: boolean;
            delete: boolean;
        } | null;
    }
}

export interface TableProps {
    setup: {
        headers: string[];
        data: string[][];
        onClick: (id: number) => void;
        archiveable: boolean;
        onArchive: (id: number) => void;
    }
}

export interface ErrorPopupProps {
    message: string;
    onClose: () => void;
}

export interface ApiResponse<T> {
    status: boolean;
    data: T | null;
    message?: string;
}

export interface ApiOptionData {
    reference: string;
    options: Option[] | ApiOptionItem[];
}

export interface ApiOptionItem {
    id: number | string;
    name: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface ReportProblemFormData extends FormDataTypes {
    'problem-type'?: string;
    issueType?: string;
    description?: string;
    issueDescription?: string;
}

export interface AccountFormData extends FormDataTypes {
    name: string;
    description: string;
}

export interface UserFormData extends FormDataTypes {
    name: string;
    email: string;
    roleId: string | number;
    accountId?: string | number;
}

export interface DatabaseRow {
    id: number;
    [key: string]: string | number | boolean | Date | null | undefined;
}

export interface UserAccountRow extends DatabaseRow {
    user_id: number;
    account_id: number;
    role_id: number;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface RolePermissionRow extends DatabaseRow {
    role_id: number;
    permission_id: number;
}

export interface UserRow extends DatabaseRow {
    name: string;
    email: string;
    password: string;
    must_change_password: boolean;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface AccountRow extends DatabaseRow {
    name: string;
    description: string;
    created_at: Date | string;
    updated_at: Date | string;
}

export interface RoleRow extends DatabaseRow {
    name: string;
    description: string;
}

export interface PermissionRow extends DatabaseRow {
    name: string;
    description: string;
}

export interface UpdateAccountData {
    name?: string;
    description?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface CommentProps {
    setup: {
        accountId: number;
    }
}

export type PieSlice = {
    id: string
    label: string
    value: number
    fill: string
}

export interface PieChartProps {
    setup: {
        data: PieSlice[];
        clickable: boolean;
    }
    onClick: (reference: string) => void;
}

export interface AnalyticsProps {
    setup: {
        accountId: number | null;
    }
}

export interface TeamPerformanceData {
    id: string;
    label: string;
    value: number;
    fill: string;
    data: PieSlice[];
}

export interface PerformanceApiData {
    teams: TeamPerformanceData[];
    totals: Record<string, number>;
}

