import * as React from "react";

import FactsView from "components/facts";
import MyFormView from "components/myform";

enum Page { facts, form }

export function App() {
    const [page, setPage] = React.useState(Page.form);
    return <>
        <header>
            <ul className="action-menu">
                <li>
                    <button onClick={() => setPage(Page.facts)}>
                        Facts
                    </button>
                </li>
                <li>
                    <button onClick={() => setPage(Page.form)}>
                        Form
                    </button>
                </li>
            </ul>
        </header>
        <section>
            {(
                page == Page.facts ? <FactsView /> :
                page == Page.form ? <MyFormView /> : null
            )}
        </section>
    </>;
}
