import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('❗ ErrorBoundary 捕获错误:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4 bg-red-900/20 rounded">
                    页面加载出错，请检查控制台日志。
                </div>
            );
        }
        return this.props.children;
    }
}
