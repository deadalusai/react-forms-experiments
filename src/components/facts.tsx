import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FactsStore from "store/facts";
import { GlobalErrorInfo } from "store/global";
import { Res } from "api";
import { ISportsperson } from "api/query";

export interface StateProps {
    sportspeople: Res<ISportsperson[]>;
    error: GlobalErrorInfo | null;
}
export interface ActionProps {
    sportspeopleFetch: typeof FactsStore.actions.sportspeopleFetch,
}
export interface OwnProps {}

export type FactsViewProps = StateProps & ActionProps & OwnProps;

export class FactsView extends React.Component<FactsViewProps> {

    public componentWillMount() {
        this.props.sportspeopleFetch();
    }

    public render() {
        const { error, sportspeople } = this.props;
        if (error) {
            return <span className="warning">{error.errorId}</span>
        }
        return sportspeople.loading
            ? <Loading />
            : <ResultsTable results={sportspeople.result} /> ;
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            sportspeople: state.facts.sportspeople,
            error: state.global.error,
        }),
        { 
            sportspeopleFetch: FactsStore.actions.sportspeopleFetch
        }
    )
);

export default wrap(FactsView);


function Loading() {
    return <span className="loading">Loading...</span>;
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
