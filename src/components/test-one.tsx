import * as React from "react";
import { connect } from "react-redux";
import { compose } from "redux";

import { RootState } from "store";
import * as FooStore from "store/foo";
import { Res } from "api";

export interface StateProps {
    foos: Res<string[]>,
}
export interface ActionProps {
    fooFetch: typeof FooStore.actions.fooFetch,
}
export interface OwnProps {}

export type TestOneProps = StateProps & ActionProps & OwnProps;

export class TestOne extends React.Component<TestOneProps> {

    public componentWillMount() {
        this.props.fooFetch();
    }

    public render() {
        const { foos } = this.props;
        if (foos.loading) {
            return "Loading...";
        }
        if (foos.error) {
            return <>
                <h1>Error</h1>
                <p>{foos.error.errorId}</p>
            </>;
        }
        return <>
            <h1>Results</h1>
            <table>
                <thead>
                    <tr>
                        <th>Foos</th>
                    </tr>
                </thead>
                <tbody>
                    {foos.result.map((foo, i) => (
                        <tr key={i}>
                            <td>{foo}</td>
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
            foos: state.foo.foos,
        }),
        { 
            fooFetch: FooStore.actions.fooFetch
        }
    )
);

export default wrap(TestOne);