// Exports

export interface DataReturnObject<T> {
    status: boolean;
    message: string;
    data: T | null;
}

