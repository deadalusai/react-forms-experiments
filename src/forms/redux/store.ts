import { ActionsFrom } from "util";
import { Form } from "../core";

//
// State
//

export interface FormsState {
    [name: string]: Form<any> | undefined;
}

export const initialState: FormsState = {};

//
// Actions
//

const FORMS_UPDATE_FORM = "FORMS:UPDATE_FORM";
export interface UpdateFormAction {
    type: typeof FORMS_UPDATE_FORM;
    form: Form;
}
function updateForm(form: Form): UpdateFormAction {
    return { type: FORMS_UPDATE_FORM, form };
}
function updateFormReducer(state: FormsState, action: UpdateFormAction): FormsState {
    return {
        ...state,
        [action.form.name]: action.form,
    };
}

//
// Reducer
//

export const actions = {
    updateForm,
};

export function reducer(state: FormsState | undefined, action: ActionsFrom<typeof actions>) {
    if (!state) {
        return initialState;
    }
    if (action.type === FORMS_UPDATE_FORM) {
        return updateFormReducer(state, action);
    }
    return state;
}