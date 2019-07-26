import { SagaIterator } from "redux-saga";
import { takeLatest, put, call } from "redux-saga/effects";

import * as GlobalStore from "store/global";
import * as FactsStore from "store/facts";
import { ISportsperson } from "api/query";

const delay = (ms: number) =>
    new Promise((resolve, _reject) => setTimeout(resolve, ms));

const api = {
    getSportspeople: async () => {
        await delay(2000);
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
                    "win-loss record": "94-46",
                    "earned run average": 2.28,
                    "born": "November 25, 1914",
                    "died": "March 8, 1999"
                }
            },
        ];
        return results; 
    }
};

export function* sportspeopleFetch(): SagaIterator {
    try {
        const results = yield call(api.getSportspeople);
        yield put(FactsStore.actions.sportspeopleFetchResult(results));
    }
    catch {
        yield put(GlobalStore.actions.setError("ERROR.SPORTSPEOPLE_FETCH_ERROR"));
    }
}

export function* saga(): SagaIterator {
    yield takeLatest(FactsStore.FACTS_SPORTSPEOPLE_FETCH, sportspeopleFetch);
}