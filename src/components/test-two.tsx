import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FooStore from "store/facts";
import { ResAdapter, ErrorType } from "api";
import { ISportsperson } from "api/query";

export interface StateProps {
    sportspeople: ResAdapter<ISportsperson[]>,
}
export interface ActionProps {
    sportspeopleFetch: typeof FooStore.actions.sportspeopleFetch,
}
export interface OwnProps { }

export type TestTwoProps = StateProps & ActionProps & OwnProps;

export class TestTwo extends React.Component<TestTwoProps> {

    public componentWillMount() {
        this.props.sportspeopleFetch();
    }

    public render() {
        return this.props.sportspeople
            .loading(<Loading />)
            .error(error => <ErrorTable error={error} />)
            .result(results => <ResultsTable results={results} />)
            .unwrap();
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            sportspeople: new ResAdapter(state.facts.sportspeople),
        }),
        {
            sportspeopleFetch: FooStore.actions.sportspeopleFetch
        }
    )
);

export default wrap(TestTwo);

function Loading() {
    return <span className="loading">Loading...</span>;
}

interface ErrorTableProps {
    error: ErrorType;
}
function ErrorTable({ error }: ErrorTableProps) {
    return <>
        <h1>Error</h1>
        <table>
            <thead>
                <tr>
                    <th colSpan={2}>
                        {error.errorId}
                    </th>
                </tr>
            </thead>
            {error.errorParams &&
                <tbody>
                    {Object.keys(error.errorParams).map((key) => (
                        <tr key={key}>
                            <td>{key}</td>
                            <td>{error.errorParams[key]}</td>
                        </tr>
                    ))}
                </tbody>}
        </table>
    </>;
}

interface ResultTableProps {
    results: ISportsperson[];
}
function ResultsTable({ results }: ResultTableProps) {
    return <>
        <h1>Results</h1>
        {results.map((result) => (
            <table key={result.id}>
                <thead>
                    <tr>
                        <th colSpan={2}>{result.name}</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(result.facts).map(key => (
                        <tr key={key}>
                            <th>{key}</th>
                            <td>{result.facts[key]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ))}
    </>;
}
