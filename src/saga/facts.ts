import { SagaIterator } from "redux-saga";
import { takeLatest, delay, put } from "redux-saga/effects";

import * as FooStore from "store/facts";
import { ISportsperson } from "api/query";

export function* fooFetch(): SagaIterator {
    while (true) {
        yield delay(2000);
        const error = {
            errorId: "SPORTSPEOPLE_FETCH_FAILURE",
            errorParams: {
                "error code": 10021,
                "error message": "failure to communicate"
            },
        };
        yield put(FooStore.actions.sportspeopleFetchError(error));
        yield delay(2000);
        const results: ISportsperson[] = [
            {
                id: "325d76ac-f553-4efa-b7c5-8465d89087af",
                name: "Joe DiMaggio",
                facts: {
                    "sport": "Baseball",
                    "batting average": .325,
                    "hits": 2214,
                    "home runs": 361,
                    "runs batted in": 1537,
                    "born": "November 25, 1914",
                    "died": "March 8, 1999"
                }
            },
            {
                id: "52f2174d-ea4a-4997-9056-8676e89a6678",
                name: "Babe Ruth",
                facts: {
                    "sport": "Baseball",
                    "batting average": .342,
                    "hits": 2873,
                    "home runs": 714,
                    "runs batted in": 2213,
                    "win–loss record": "94–46",
                    "earned run average": 2.28,
                    "born": "November 25, 1914",
                    "died": "March 8, 1999"
                }
            },
        ];
        yield put(FooStore.actions.sportspeopleFetchResult(results));
    }
}

export function* saga(): SagaIterator {
    yield takeLatest(FooStore.FACTS_SPORTSPEOPLE_FETCH, fooFetch);
}