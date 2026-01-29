import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { SettingsService } from '../services/settingsService';
import type { Recipe } from '../types/settings';
import { Monitor, Bell, AlertTriangle, FileText, Plus, Trash2, Edit, Save, X, Zap, Server, Database, Download, HardDrive } from 'lucide-react';

export const Settings: React.FC = () => {
    const { settings, recipes, simulationConfig, updateSettings, reloadRecipes, updateSimulationConfig } = useSettings();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'alarms' | 'recipes' | 'simulation' | 'hardware' | 'data'>('general');
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

    // Data Export State
    const [exportRange, setExportRange] = useState({ start: '', end: '' });

    // Helper for tabs
    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-colors shrink-0 ${activeTab === id
                ? 'bg-muted text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
        >
            <Icon size={18} />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );

    // Handlers
    const toggleTheme = async () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        await updateSettings({ ...settings, theme: newTheme });
    };

    const handleNotificationChange = async (key: keyof typeof settings.notifications, value: boolean) => {
        await updateSettings({
            ...settings,
            notifications: { ...settings.notifications, [key]: value }
        });
    };

    const handleThresholdChange = async (key: keyof typeof settings.thresholds, value: number) => {
        await updateSettings({
            ...settings,
            thresholds: { ...settings.thresholds, [key]: value }
        });
    };

    const handleHardwareChange = async (key: string, value: any) => {
        await updateSettings({
            ...settings,
            hardware: { ...settings.hardware, [key]: value }
        });
    };

    const handleDataConfigChange = async (key: string, value: any) => {
        await updateSettings({
            ...settings,
            data: { ...settings.data, [key]: value }
        });
    };

    const handleExport = async (type: 'temperature' | 'vacuum') => {
        const start = exportRange.start || new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const end = exportRange.end || new Date().toISOString();
        window.open(`http://127.0.0.1:8001/api/data/export?type=${type}&start=${start}&end=${end}`, '_blank');
    };

    const handleBackup = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8001/api/data/backup', { method: 'POST' });
            if (res.ok) alert("备份成功");
            else alert("备份失败");
        } catch (e) {
            alert("网络错误");
        }
    };

    // Recipe Handlers
    const handleEditRecipe = (recipe: Recipe) => {
        setEditingRecipe({ ...recipe });
        setIsRecipeModalOpen(true);
    };

    const handleNewRecipe = () => {
        setEditingRecipe({
            id: '',
            name: '新配方',
            version: '1.0',
            isDefault: false,
            targetLineType: 'anode',
            bakeDuration: 15.0,
            growthDuration: 12.0,
            eGunVoltage: 0.0,
            eGunCurrent: 0.0,
            indiumTemp: 0.0,
            sealPressure: 0.0,
            csCurrent: 0.0,
            o2Pressure: 0.0,
            photoCurrent: 0.0,
            bakeTargetTemp: 390.0,
            growthTargetTemp: 110.0
        });
        setIsRecipeModalOpen(true);
    };

    const saveRecipe = async () => {
        if (!editingRecipe) return;
        try {
            if (editingRecipe.id) {
                await SettingsService.updateRecipe(editingRecipe);
            } else {
                await SettingsService.createRecipe(editingRecipe);
            }
            await reloadRecipes();
            setIsRecipeModalOpen(false);
            setEditingRecipe(null);
        } catch (e) {
            console.error(e);
            alert('保存失败');
        }
    };

    const deleteRecipe = async (id: string) => {
        if (!confirm('确定删除此配方吗?')) return;
        try {
            await SettingsService.deleteRecipe(id);
            await reloadRecipes();
        } catch (e) {
            console.error(e);
            alert('删除失败');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto text-foreground">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <Monitor className="mr-3 text-sky-500" />
                系统设置
            </h1>

            {/* Tabs */}
            <div className="flex border-b border-border mb-6 space-x-2 overflow-x-auto pb-px">
                <TabButton id="general" label="常规设置" icon={Monitor} />
                <TabButton id="notifications" label="通知设置" icon={Bell} />
                <TabButton id="alarms" label="报警阈值" icon={AlertTriangle} />
                <TabButton id="recipes" label="工艺配方" icon={FileText} />
                <TabButton id="hardware" label="硬件接口" icon={Server} />
                <TabButton id="data" label="数据管理" icon={Database} />
                <TabButton id="simulation" label="系统仿真" icon={Zap} />
            </div>

            {/* Content */}
            <div className="bg-card p-6 rounded-lg border border-border min-h-[400px] shadow-sm">

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                            <div>
                                <h3 className="font-medium text-lg text-foreground">界面主题</h3>
                                <p className="text-muted-foreground text-sm">切换工业深色模式与高亮日间模式</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`px-4 py-2 rounded font-medium transition-colors shadow-sm ${settings.theme === 'dark'
                                    ? 'bg-sky-600 hover:bg-sky-500 text-white'
                                    : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                                    }`}
                            >
                                {settings.theme === 'dark' ? '当前：深色模式' : '当前：日间模式'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4 max-w-2xl">
                        <h3 className="text-lg font-medium mb-4">通知权限配置</h3>

                        <label className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded border border-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.notifications.enableBrowserNotifications}
                                onChange={(e) => handleNotificationChange('enableBrowserNotifications', e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                            />
                            <div>
                                <span className="block text-white">启用浏览器通知</span>
                                <span className="text-sm text-slate-500">允许系统发送桌面弹窗通知</span>
                            </div>
                        </label>

                        <label className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded border border-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.notifications.notifyOnWarning}
                                onChange={(e) => handleNotificationChange('notifyOnWarning', e.target.checked)}
                                className="w-5 h-5 accent-yellow-500"
                            />
                            <div>
                                <span className="block text-yellow-500 font-medium">警告 (Warning) 通知</span>
                                <span className="text-sm text-slate-500">当设备处于警告状态时通知</span>
                            </div>
                        </label>

                        <label className="flex items-center space-x-3 p-3 bg-slate-900/30 rounded border border-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.notifications.notifyOnError}
                                onChange={(e) => handleNotificationChange('notifyOnError', e.target.checked)}
                                className="w-5 h-5 accent-red-500"
                            />
                            <div>
                                <span className="block text-red-500 font-medium">错误 (Error) 通知</span>
                                <span className="text-sm text-slate-500">当设备发生故障或严重报警时通知</span>
                            </div>
                        </label>
                    </div>
                )}

                {/* Alarms Tab */}
                {activeTab === 'alarms' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium mb-4 text-blue-400">温度报警阈值 (℃)</h3>
                            <div className="space-y-4">
                                <div className="bg-slate-900/30 p-4 rounded border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-400 mb-2">阳极烘烤</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500">高温报警</label>
                                            <input
                                                type="number"
                                                value={settings.thresholds.anodeBakeHighTemp}
                                                onChange={(e) => handleThresholdChange('anodeBakeHighTemp', Number(e.target.value))}
                                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 mt-1 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/30 p-4 rounded border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-400 mb-2">阴极烘烤</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500">高温报警</label>
                                            <input
                                                type="number"
                                                value={settings.thresholds.cathodeBakeHighTemp}
                                                onChange={(e) => handleThresholdChange('cathodeBakeHighTemp', Number(e.target.value))}
                                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 mt-1 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/30 p-4 rounded border border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-400 mb-2">阴极生长</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500">高温报警</label>
                                            <input
                                                type="number"
                                                value={settings.thresholds.growthHighTemp}
                                                onChange={(e) => handleThresholdChange('growthHighTemp', Number(e.target.value))}
                                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 mt-1 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-4 text-green-400">真空报警阈值 (Pa)</h3>
                            <div className="bg-slate-900/30 p-4 rounded border border-slate-700 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">本底真空破坏阈值</label>
                                    <p className="text-xs text-slate-500 mb-1">超过此压力视为真空破坏</p>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.thresholds.vacuumAlertThreshold}
                                        onChange={(e) => handleThresholdChange('vacuumAlertThreshold', Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-300">工艺允许最高气压</label>
                                    <p className="text-xs text-slate-500 mb-1">生长/烘烤时允许的最高本底</p>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.thresholds.processVacuumThreshold}
                                        onChange={(e) => handleThresholdChange('processVacuumThreshold', Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recipes Tab */}
                {activeTab === 'recipes' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">工艺配方列表</h3>
                            <button
                                onClick={handleNewRecipe}
                                className="flex items-center space-x-1 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm font-bold shadow-lg shadow-green-900/20"
                            >
                                <Plus size={16} />
                                <span>新建配方</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm">
                                        <th className="p-3">名称 / 版本</th>
                                        <th className="p-3">适用线体</th>
                                        <th className="p-3">烘烤时长</th>
                                        <th className="p-3">生长时长</th>
                                        <th className="p-3">默认</th>
                                        <th className="p-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.map(recipe => (
                                        <tr key={recipe.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="p-3">
                                                <div className="font-medium text-white">{recipe.name}</div>
                                                <span className="text-xs bg-slate-700 px-1.5 rounded text-slate-300">v{recipe.version}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${recipe.targetLineType === 'anode' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
                                                    }`}>
                                                    {recipe.targetLineType.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-300">{recipe.bakeDuration}h</td>
                                            <td className="p-3 text-slate-300">
                                                {recipe.targetLineType === 'cathode' ? `${recipe.growthDuration}h` : '-'}
                                            </td>
                                            <td className="p-3">
                                                {recipe.isDefault && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">默认</span>}
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEditRecipe(recipe)}
                                                    className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteRecipe(recipe.id)}
                                                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                                                    disabled={recipe.isDefault}
                                                    title={recipe.isDefault ? "默认配方不可删除" : "删除"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Simulation Tab */}
                {activeTab === 'simulation' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <span className="w-1.5 h-6 bg-purple-500 rounded mr-3"></span>
                                时间与环境模拟
                            </h3>

                            <div className="space-y-6">
                                {/* Acceleration */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">时间加速倍率</label>
                                        <span className="text-sm font-mono font-bold text-purple-400">{simulationConfig.timeMultiplier.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="60.0"
                                        step="0.1"
                                        value={simulationConfig.timeMultiplier}
                                        onChange={(e) => updateSimulationConfig({ ...simulationConfig, timeMultiplier: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">调整系统时间的流逝速度 (最大 60x: 1秒 = 1分钟)</p>
                                </div>

                                {/* Noise */}
                                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded border border-slate-600">
                                    <div>
                                        <span className="block text-white font-medium">环境噪声模拟</span>
                                        <span className="text-xs text-slate-400">模拟传感器数据的随机波动</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={simulationConfig.noiseEnabled}
                                            onChange={(e) => updateSimulationConfig({ ...simulationConfig, noiseEnabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <span className="w-1.5 h-6 bg-red-500 rounded mr-3"></span>
                                故障注入 (Fault Injection)
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => fetch('http://127.0.0.1:8001/api/simulation/fault?type=temp_runaway&line_id=line-1&chamber_id=a-hk-101', { method: 'POST' })}
                                    className="p-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded flex items-center justify-center gap-2 text-red-400 transition-colors"
                                >
                                    <AlertTriangle size={18} />
                                    <span>触发：阳极高温失控</span>
                                </button>
                                <button
                                    onClick={() => fetch('http://127.0.0.1:8001/api/simulation/fault?type=vacuum_leak&line_id=line-1&chamber_id=c-sz-102', { method: 'POST' })}
                                    className="p-3 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 rounded flex items-center justify-center gap-2 text-orange-400 transition-colors"
                                >
                                    <AlertTriangle size={18} />
                                    <span>触发：生长仓真空泄漏</span>
                                </button>
                            </div>

                            <div className="border-t border-slate-700 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-slate-400">当前活跃故障 ({simulationConfig.activeFaults.length})</h4>
                                    <button
                                        onClick={() => fetch('http://127.0.0.1:8001/api/simulation/faults', { method: 'DELETE' }).then(() => updateSimulationConfig({ ...simulationConfig, activeFaults: [] }))}
                                        className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-600"
                                    >
                                        清除所有故障
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {simulationConfig.activeFaults.length === 0 ? (
                                        <div className="text-xs text-slate-600 italic">无活跃故障</div>
                                    ) : (
                                        simulationConfig.activeFaults.map((f: any) => (
                                            <div key={f.id} className="text-xs bg-red-500/10 border border-red-500/20 p-2 rounded text-red-300 flex justify-between">
                                                <span>{f.description}</span>
                                                <span className="font-mono opacity-50">{new Date(f.startTime * 1000).toLocaleTimeString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Hardware Tab */}
                {activeTab === 'hardware' && settings.hardware && (
                    <div className="space-y-6 max-w-3xl">
                        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <Server className="mr-2 text-blue-400" size={20} />
                                通信协议配置
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">通信协议</label>
                                    <select
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                        value={settings.hardware.protocol}
                                        onChange={(e) => handleHardwareChange('protocol', e.target.value)}
                                    >
                                        <option value="simulation">Simulation (内置仿真)</option>
                                        <option value="modbus_tcp">Modbus TCP</option>
                                        <option value="http_api">HTTP API Polling</option>
                                        <option value="mqtt">MQTT Broker</option>
                                    </select>
                                </div>

                                {settings.hardware.protocol === 'modbus_tcp' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">PLC IP地址</label>
                                            <input
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.ipAddress}
                                                onChange={(e) => handleHardwareChange('ipAddress', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">端口号 (Port)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.port}
                                                onChange={(e) => handleHardwareChange('port', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">从站 ID (Slave ID)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.slaveId}
                                                onChange={(e) => handleHardwareChange('slaveId', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">采集频率 (ms)</label>
                                            <input
                                                type="number"
                                                step="100"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.pollingInterval}
                                                onChange={(e) => handleHardwareChange('pollingInterval', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                )}
                                {settings.hardware.protocol === 'simulation' && (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-sm">
                                        系统当前运行在纯软件仿真模式。所有传感器数据由 SimulationService 生成。
                                    </div>
                                )}

                                {settings.hardware.protocol === 'http_api' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="col-span-2">
                                            <label className="block text-sm text-slate-400 mb-1">API Endpoint Host (URL)</label>
                                            <input
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                placeholder="http://192.168.1.100"
                                                value={settings.hardware.ipAddress}
                                                onChange={(e) => handleHardwareChange('ipAddress', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">端口号 (Port)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.port}
                                                onChange={(e) => handleHardwareChange('port', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">轮询频率 (ms)</label>
                                            <input
                                                type="number"
                                                step="100"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.pollingInterval}
                                                onChange={(e) => handleHardwareChange('pollingInterval', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {settings.hardware.protocol === 'mqtt' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="col-span-2">
                                            <label className="block text-sm text-slate-400 mb-1">MQTT 代理地址 (Broker Address)</label>
                                            <input
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                placeholder="tcp://broker.emqx.io"
                                                value={settings.hardware.ipAddress}
                                                onChange={(e) => handleHardwareChange('ipAddress', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">端口号 (Port)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                                value={settings.hardware.port}
                                                onChange={(e) => handleHardwareChange('port', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Topic Prefix</label>
                                            <input
                                                disabled
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-500 cursor-not-allowed"
                                                value="autoline/devices/#"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">目前只支持固定 Topic 结构</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && settings.data && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Retention Policy */}
                            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                    <Database className="mr-2 text-purple-400" size={20} />
                                    数据保留策略
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">历史数据保留时长 (天)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                            value={settings.data.retentionDays}
                                            onChange={(e) => handleDataConfigChange('retentionDays', Number(e.target.value))}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">超过此时长的数据将被自动清理以释放磁盘空间。</p>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-600">
                                        <span className="text-white">启用自动备份</span>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-purple-500"
                                            checked={settings.data.autoBackup}
                                            onChange={(e) => handleDataConfigChange('autoBackup', e.target.checked)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">备份路径</label>
                                        <input
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-mono text-sm"
                                            value={settings.data.backupPath}
                                            onChange={(e) => handleDataConfigChange('backupPath', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleBackup}
                                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <HardDrive size={16} />
                                        立即备份数据
                                    </button>
                                </div>
                            </div>

                            {/* Data Export */}
                            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                    <Download className="mr-2 text-green-400" size={20} />
                                    数据导出
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-xs text-white"
                                                onChange={e => setExportRange({ ...exportRange, start: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-xs text-white"
                                                onChange={e => setExportRange({ ...exportRange, end: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <button
                                            onClick={() => handleExport('temperature')}
                                            className="w-full py-3 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-400 rounded flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <FileText size={18} />
                                            导出温度记录 (.csv)
                                        </button>
                                        <button
                                            onClick={() => handleExport('vacuum')}
                                            className="w-full py-3 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-400 rounded flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <FileText size={18} />
                                            导出真空记录 (.csv)
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center mt-2">支持导出最近 30 天的历史记录</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recipe Edit Modal */}
            {isRecipeModalOpen && editingRecipe && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold flex items-center">
                                <FileText className="mr-2 text-blue-400" />
                                {editingRecipe.id ? '编辑配方' : '新建配方'}
                            </h2>
                            <button onClick={() => setIsRecipeModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="col-span-2 grid grid-cols-4 gap-4 bg-slate-800/30 p-4 rounded border border-slate-700">
                                <div className="col-span-2">
                                    <label className="block text-xs text-slate-500 mb-1">配方名称</label>
                                    <input
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                        value={editingRecipe.name}
                                        onChange={e => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">版本</label>
                                    <input
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                        value={editingRecipe.version}
                                        onChange={e => setEditingRecipe({ ...editingRecipe, version: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">适用线体</label>
                                    <select
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                                        value={editingRecipe.targetLineType}
                                        onChange={e => setEditingRecipe({ ...editingRecipe, targetLineType: e.target.value as any })}
                                    >
                                        <option value="anode">阳极线</option>
                                        <option value="cathode">阴极线</option>
                                    </select>
                                </div>
                                <div className="col-span-4 flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        id="isDef"
                                        checked={editingRecipe.isDefault}
                                        onChange={e => setEditingRecipe({ ...editingRecipe, isDefault: e.target.checked })}
                                        className="w-4 h-4 mr-2"
                                    />
                                    <label htmlFor="isDef" className="text-sm select-none cursor-pointer">设为默认配方</label>
                                </div>
                            </div>

                            {/* Durations */}
                            <div className="bg-slate-800/30 p-4 rounded border border-slate-700">
                                <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2">周期设置 (小时)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-500">烘烤时长 (h)</label>
                                        <input type="number" step="0.5" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1"
                                            value={editingRecipe.bakeDuration}
                                            onChange={e => setEditingRecipe({ ...editingRecipe, bakeDuration: Number(e.target.value) })}
                                        />
                                    </div>
                                    {editingRecipe.targetLineType === 'cathode' && (
                                        <div>
                                            <label className="text-xs text-slate-500">生长时长 (h)</label>
                                            <input type="number" step="0.5" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1"
                                                value={editingRecipe.growthDuration}
                                                onChange={e => setEditingRecipe({ ...editingRecipe, growthDuration: Number(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Targets */}
                            <div className="bg-slate-800/30 p-4 rounded border border-slate-700">
                                <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2">目标参数</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-500">烘烤目标温度 (℃)</label>
                                        <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1"
                                            value={editingRecipe.bakeTargetTemp}
                                            onChange={e => setEditingRecipe({ ...editingRecipe, bakeTargetTemp: Number(e.target.value) })}
                                        />
                                    </div>
                                    {editingRecipe.targetLineType === 'cathode' && (
                                        <div>
                                            <label className="text-xs text-slate-500">生长目标温度 (℃)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1"
                                                value={editingRecipe.growthTargetTemp}
                                                onChange={e => setEditingRecipe({ ...editingRecipe, growthTargetTemp: Number(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Specific Params */}
                            {editingRecipe.targetLineType === 'anode' ? (
                                <div className="col-span-2 bg-slate-800/30 p-4 rounded border border-slate-700">
                                    <h4 className="text-sm font-bold text-orange-400 mb-3 border-b border-slate-700 pb-2">阳极工艺参数</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-slate-500">电子枪电压 (kV)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.eGunVoltage} onChange={e => setEditingRecipe({ ...editingRecipe, eGunVoltage: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs text-slate-500">电子枪电流 (mA)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.eGunCurrent} onChange={e => setEditingRecipe({ ...editingRecipe, eGunCurrent: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs text-slate-500">铟封温度 (℃)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.indiumTemp} onChange={e => setEditingRecipe({ ...editingRecipe, indiumTemp: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs text-slate-500">铟封压力 (N)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.sealPressure} onChange={e => setEditingRecipe({ ...editingRecipe, sealPressure: Number(e.target.value) })} /></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="col-span-2 bg-slate-800/30 p-4 rounded border border-slate-700">
                                    <h4 className="text-sm font-bold text-cyan-400 mb-3 border-b border-slate-700 pb-2">阴极工艺参数</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className="text-xs text-slate-500">铯源电流 (A)</label>
                                            <input type="number" step="0.1" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.csCurrent} onChange={e => setEditingRecipe({ ...editingRecipe, csCurrent: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs text-slate-500">氧气压力 (Pa)</label>
                                            <input type="number" step="1e-6" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.o2Pressure} onChange={e => setEditingRecipe({ ...editingRecipe, o2Pressure: Number(e.target.value) })} /></div>
                                        <div><label className="text-xs text-slate-500">光电流 (μA)</label>
                                            <input type="number" className="w-full bg-slate-800 border-slate-600 border rounded px-2 py-1" value={editingRecipe.photoCurrent} onChange={e => setEditingRecipe({ ...editingRecipe, photoCurrent: Number(e.target.value) })} /></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-700 flex justify-end space-x-3 bg-slate-900/50">
                            <button onClick={() => setIsRecipeModalOpen(false)} className="px-4 py-2 rounded text-slate-400 hover:text-white transition-colors">取消</button>
                            <button onClick={saveRecipe} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg shadow-blue-900/40 flex items-center">
                                <Save size={18} className="mr-2" />
                                保存配置
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
