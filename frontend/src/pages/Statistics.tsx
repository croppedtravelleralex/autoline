import { useSystemStateContext } from '../context/SystemStateContext';
import { MESDataTable } from '../components/MESDataTable';
import { MESHistoryChart } from '../components/MESHistoryChart';

export function Statistics() {
    const { state } = useSystemStateContext();

    return (
        <div className="h-full p-6 flex flex-col gap-6">
            {/* 数据表格 */}
            <div className="h-1/2 min-h-[300px]">
                <MESDataTable carts={state.carts} />
            </div>

            {/* 历史趋势图 */}
            <div className="h-1/2 min-h-[300px]">
                <MESHistoryChart lines={state.lines} />
            </div>
        </div>
    );
}
