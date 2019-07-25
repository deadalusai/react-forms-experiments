import { SagaIterator } from "redux-saga";
import { takeLatest, delay, call } from "redux-saga/effects";

import * as FooStore from "store/foo";

export function* fooFetch(): SagaIterator {
    yield delay(2000);
    yield call(FooStore.actions.fooFetchResult, []);
}

export function* saga(): SagaIterator {
    yield takeLatest(FooStore.FOO_FETCH, fooFetch);
}