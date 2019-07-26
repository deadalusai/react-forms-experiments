
export interface ResLoading<T> {
    loading: true;
    result?: T;
}

export interface ResResult<T> {
    loading: false;
    result: T;
}

export type Res<T> = ResLoading<T> | ResResult<T>;

export function resLoading<T>(result?: T): ResLoading<T> {
    return { loading: true, result };
}

export function resResult<T>(result: T): ResResult<T> {
    return { loading: false, result };
}
