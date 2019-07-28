import * as React from "react";

import FactsView from "components/facts";
import MyFormView from "components/myform";
import ReduxFormView from "components/reduxform";

enum Page { facts, customForms, reduxForms }

export function App() {
    const [page, setPage] = React.useState(Page.customForms);
    return <>
        <header>
            <ul className="action-menu">
                <li>
                    <button onClick={() => setPage(Page.facts)}>
                        Facts
                    </button>
                </li>
                <li>
                    <button onClick={() => setPage(Page.customForms)}>
                        Custom Forms
                    </button>
                </li>
                <li>
                    <button onClick={() => setPage(Page.reduxForms)}>
                        Redux Forms
                    </button>
                </li>
            </ul>
        </header>
        <section>
            {(
                page === Page.facts ? <FactsView /> :
                page === Page.customForms ? <MyFormView /> :
                page === Page.reduxForms ? <ReduxFormView /> : null
            )}
        </section>
    </>;
}
