import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FooStore from "store/foo";
import { ResAdapter } from "api";

export interface StateProps {
    foos: ResAdapter<string[]>,
}
export interface ActionProps {
    fooFetch: typeof FooStore.actions.fooFetch,
}
export interface OwnProps {}

export type TestTwoProps = StateProps & ActionProps & OwnProps;

export class TestTwo extends React.Component<TestTwoProps> {

    public componentWillMount() {
        this.props.fooFetch();
    }

    public render() {
        return this.props.foos
            .loading("Loading...")
            .error(error => {
                return <>
                    <h1>Error</h1>
                    <p>{error.errorId}</p>
                </>;
            })
            .result(foos => {
                return <>
                    <h1>Results</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Foos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foos.map((foo, i) => (
                                <tr key={i}>
                                    <td>{foo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>;
            })
            .render();
    }
}

const wrap = compose(
    connect<StateProps, ActionProps, OwnProps, RootState>(
        (state) => ({
            foos: FooStore.selectors.getFoos(state.foo),
        }),
        { 
            fooFetch: FooStore.actions.fooFetch
        }
    )
);

export default wrap(TestTwo);