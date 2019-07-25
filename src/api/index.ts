
export interface ErrorType {
    errorId: string;
    errorParams?: any;
}

export interface ResLoading {
    error: null;
    loading: true;
}

export interface ResError {
    error: ErrorType;
    loading: false;
}

export interface ResResult<T> {
    error: null;
    loading: false;
    result: T;
}

export type Res<T> = ResLoading | ResError | ResResult<T>;

export function resLoading(): ResLoading {
    return { loading: true, error: null };
}

export function resError(error: ErrorType): ResError {
    return { loading: false, error };
}

export function resResult<T>(result: T): ResResult<T> {
    return { loading: false, error: null, result };
}