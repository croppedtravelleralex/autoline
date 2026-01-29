import { Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface LinePlaybackButtonProps {
    lineId: string;
    isActive: boolean;
    onClick: () => void;
}

/**
 * 每线体的历史回溯入口按钮
 * 收起状态：灰色播放图标
 * 激活状态：橙色脉冲动画，表示正在回溯
 */
export const LinePlaybackButton = ({ isActive, onClick }: LinePlaybackButtonProps) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer",
                isActive
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-lg shadow-amber-500/20"
                    : "bg-slate-800/60 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30"
            )}
            title={isActive ? "关闭历史回溯" : "开启历史回溯"}
        >
            {isActive ? (
                <Pause className="w-3.5 h-3.5 animate-pulse" fill="currentColor" />
            ) : (
                <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
            )}
        </button>
    );
};
