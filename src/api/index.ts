
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

export class ResAdapter<T> {
    constructor(
        private _res: Res<T>
    ) {}

    public get res() {
        return this._res;
    }

    public unwrap(): T {
        const res = this._res;
        if (res.error) {
            throw new Error("Unable to unwrapp failed resource: " + res.error.errorId);
        }
        if (res.loading) {
            throw new Error("Unable to unwrap loading resource");
        }
        return res.result;
    }

    public error<NewError>(error: ErrorSelector<NewError>) {
        return new ResFluent(this._res, { error });
    }

    public loading<NewLoading>(loading: LoadingSelector<NewLoading>) {
        return new ResFluent(this._res, { loading });
    }
    
    public result<NewResult>(result: ResultSelector<T, NewResult>) {
        return new ResFluent(this._res, { result });
    }
}

type ErrorSelector<TError> = ((error: ErrorType) => TError) | TError;
type LoadingSelector<TLoading> = (() => TLoading) | TLoading;
type ResultSelector<T, TResult> = ((result: T) => TResult) | TResult;

interface Selectors<T, TError, TLoading, TResult> {
    error?: ErrorSelector<TError>;
    loading?: LoadingSelector<TLoading>;
    result?: ResultSelector<T, TResult>;
}

export class ResFluent<T, TError, TLoading, TResult> {

    constructor(
        private _res: Res<T>,
        private _selectors: Selectors<T, TError, TLoading, TResult>
    ) {}

    public error<NewError>(error: ErrorSelector<NewError>) {
        return new ResFluent(this._res, { ...this._selectors, error });
    }

    public loading<NewLoading>(loading: LoadingSelector<NewLoading>) {
        return new ResFluent(this._res, { ...this._selectors, loading });
    }
    
    public result<NewResult>(result: ResultSelector<T, NewResult>) {
        return new ResFluent(this._res, { ...this._selectors, result });
    }

    public unwrap(): TError | TLoading | TResult | undefined {
        const res = this._res;
        const { error, loading, result } = this._selectors;
        if (res.error) {
            return error instanceof Function ? error(res.error) : error;
        }
        if (res.loading) {
            return loading instanceof Function ? loading() : loading;
        }
        return result instanceof Function ? result(res.result) : result;
    }
}