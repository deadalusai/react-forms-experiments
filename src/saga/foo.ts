import { SagaIterator } from "redux-saga";
import { takeLatest, delay, put } from "redux-saga/effects";

import * as FooStore from "store/foo";

export function* fooFetch(): SagaIterator {
    yield delay(2000);
    const results = [
        "Hello world",
        "Goodbye moon"
    ];
    yield put(FooStore.actions.fooFetchResult(results));
}

export function* saga(): SagaIterator {
    yield takeLatest(FooStore.FOO_FETCH, fooFetch);
}