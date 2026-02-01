import { useEffect, useRef } from 'react';

/**
 * 键盘快捷键配置对象
 */
export interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    handler: (e: KeyboardEvent) => void;
}

/**
 * 一个简单高效的键盘快捷键 Hook
 * @param shortcuts 快捷键配置列表
 * @param active 是否激活监听 (通常传入弹窗的 isOpen 状态)
 * @param disabledInInput 是否在输入框聚焦时禁用这些快捷键 (默认 true, 除了 Escape)
 */
export function useKeyboardShortcut(
    shortcuts: ShortcutConfig[],
    active: boolean = true,
    disabledInInput: boolean = true
) {
    // 使用 ref 存储最新的 shortcuts 以避免 effect 频繁重新订阅
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // 如果在输入框中，且不是 Escape 键，且配置了禁用，则跳过
            if (isInput && e.key !== 'Escape' && disabledInInput) {
                // 如果是 Enter 且不是在 TEXTAREA 中，有时我们可能希望触发提交
                // 但为了保守起见，遵循 disabledInInput 参数
                return;
            }

            for (const config of shortcutsRef.current) {
                if (
                    e.key === config.key &&
                    !!e.ctrlKey === !!config.ctrlKey &&
                    !!e.shiftKey === !!config.shiftKey &&
                    !!e.altKey === !!config.altKey
                ) {
                    // 找到匹配项
                    config.handler(e);
                    // 如果不是 Escape (为了不影响浏览器默认关闭对话框等原生行为，虽然我们这里是自定义弹窗)，通常阻止默认行为
                    if (config.key !== 'Escape' || !isInput) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // 使用捕获模式确保优先拦截
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [active, disabledInInput]);
}
