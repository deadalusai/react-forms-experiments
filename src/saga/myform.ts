import { SagaIterator } from "redux-saga";
import { takeLeading, put, call } from "redux-saga/effects";

import { delayMs } from "util";
import { FormErrors } from "forms";
import * as FormsStore from "forms/redux/store";
import * as MyFormStore from "store/myform";

export function* saveChangesSaga(action: MyFormStore.ISaveChangesAction): SagaIterator {
    yield call(delayMs, 1500);
    alert("results: " + JSON.stringify(action.formData, null, 4));
    // Fake some external validation failures
    const errors: FormErrors<MyFormStore.MyForm> = {
        text1: { error: "ERROR.ERROR_SENT_FROM_SERVER" },
        text2: { error: "ERROR.ERROR_SENT_FROM_SERVER" },
        radio1: { error: "ERROR.ERROR_SENT_FROM_SERVER" },
        checkbox2: { error: "ERROR.ERROR_SENT_FROM_SERVER" },
    };
    yield put(FormsStore.actions.setFormErrors(action.formName, errors));
    yield put(MyFormStore.actionCreators.saveChangesComplete());
}

export function* saga(): SagaIterator {
    yield takeLeading(MyFormStore.MYFORM_SAVE_CHANGES, saveChangesSaga);
}