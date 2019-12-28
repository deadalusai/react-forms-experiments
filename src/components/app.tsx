import * as React from "react";

import FactsView from "components/facts";
import ReduxFormView from "components/reduxform";
import { MyFormViewStoreBacked, MyFormViewStateBacked } from "components/myform";

enum Page { facts, customFormsStoreBacked, customFormsStateBacked, reduxForms }

const TABS = [
    { label: "Facts", page: Page.facts },
    { label: "Custom Forms (Store backed)", page: Page.customFormsStoreBacked },
    { label: "Custom Forms (State backed)", page: Page.customFormsStateBacked },
    { label: "Redux forms", page: Page.reduxForms },
];

export function App() {
    const [page, setPage] = React.useState(Page.customFormsStoreBacked);
    return <>
        <header>
            <ul className="action-menu">
                {TABS.map((tab) =>
                    <li key={tab.page}>
                        <button
                            style={{ textDecoration: (page == tab.page ? "underline" : undefined) }}
                            onClick={() => setPage(tab.page)}>
                            {tab.label}
                        </button>
                    </li>
                )}
            </ul>
        </header>
        <section>
            {(
                page === Page.facts                  ? <FactsView /> :
                page === Page.customFormsStoreBacked ? <MyFormViewStoreBacked formName="my-form-global" arg1="hello" arg2={1} /> :
                page === Page.customFormsStateBacked ? <MyFormViewStateBacked formName="my-form-state"  arg1="world" arg2={2} /> :
                page === Page.reduxForms             ? <ReduxFormView /> : null
            )}
        </section>
    </>;
}
