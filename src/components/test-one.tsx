import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FooStore from "store/facts";
import { Res } from "api";
import { ISportsperson } from "api/query";

export interface StateProps {
    sportspeople: Res<ISportsperson[]>,
}
export interface ActionProps {
    sportspeopleFetch: typeof FooStore.actions.sportspeopleFetch,
}
export interface OwnProps {}

export type TestOneProps = StateProps & ActionProps & OwnProps;

export class TestOne extends React.Component<TestOneProps> {

    public componentWillMount() {
        this.props.sportspeopleFetch();
    }

    public render() {
        const { sportspeople } = this.props;
        if (sportspeople.loading) {
            return "Loading...";
        }
        if (sportspeople.error) {
            return <>
                <h1>Error</h1>
                <p>{sportspeople.error.errorId}</p>
            </>;
        }
        return <>
            <h1>Results</h1>
            <table>
                <thead>
                    <tr>
                        <th>Sportspeople</th>
                    </tr>
                </thead>
                <tbody>
                    {sportspeople.result.map((person, i) => (
                        <tr key={i}>
                            <td>{person.name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>;
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            sportspeople: state.facts.sportspeople,
        }),
        { 
            sportspeopleFetch: FooStore.actions.sportspeopleFetch
        }
    )
);

export default wrap(TestOne);