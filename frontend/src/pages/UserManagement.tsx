import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Trash2, Edit, Plus, X } from 'lucide-react';
import { useUser, type UserRole, type User } from '../context/UserContext';

const API_THREAD = 'http://127.0.0.1:8001/api';

export function UserManagement() {
    const { user, checkPermission } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await fetch(`${API_THREAD}/users`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (username: string) => {
        if (!confirm(`确定删除用户 ${username}?`)) return;
        try {
            const res = await fetch(`${API_THREAD}/users/${username}`, { method: 'DELETE' });
            if (res.ok) {
                loadUsers();
            } else {
                alert("删除失败");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Note: handleSave removed as it was ambiguous, using Create/Update directly.

    const handleCreate = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch(`${API_THREAD}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            if (res.ok) {
                setIsModalOpen(false);
                loadUsers();
            } else {
                const err = await res.json();
                setFormError(err.detail || "创建失败");
            }
        } catch (e) {
            setFormError("网络错误");
        }
    }

    const handleUpdate = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch(`${API_THREAD}/users/${editingUser.username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            if (res.ok) {
                setIsModalOpen(false);
                loadUsers();
            } else {
                alert("更新失败");
            }
        } catch (e) {
            alert("网络错误");
        }
    }

    const openNewUser = () => {
        setEditingUser({ username: '', role: 'observer' });
        setFormError('');
        setIsModalOpen(true);
    }

    const openEditUser = (u: User) => {
        setEditingUser({ ...u });
        setFormError('');
        setIsModalOpen(true);
    }

    if (!checkPermission('admin')) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Shield className="w-16 h-16 mb-4 text-destructive opacity-50" />
                <h2 className="text-xl font-bold text-foreground opacity-70">访问受限</h2>
                <p className="mt-2 text-sm">您没有权限查看此页面</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center">
                        <UserIcon className="mr-3 text-sky-500" />
                        用户管理
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">管理系统用户及权限 (RBAC)</p>
                </div>
                <button
                    onClick={openNewUser}
                    className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-lg shadow-sky-500/20"
                >
                    <Plus size={18} />
                    <span>添加用户</span>
                </button>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border text-muted-foreground text-sm">
                            <th className="p-4">用户名</th>
                            <th className="p-4">角色</th>
                            <th className="p-4">状态</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.username} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-medium text-foreground flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    {u.username}
                                    {u.username === user?.username && <span className="text-[10px] bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 rounded ml-2">我</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded font-bold border ${u.role === 'admin' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                                        u.role === 'operator' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                            'bg-muted text-muted-foreground border-border'
                                        }`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        在线
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => openEditUser(u)}
                                        className="p-1.5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded transition-colors"
                                        title="编辑权限"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.username)}
                                        className={`p-1.5 rounded transition-colors ${u.username === 'admin' ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-destructive/10 text-destructive'}`}
                                        disabled={u.username === 'admin'}
                                        title="删除用户"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="p-8 text-center text-muted-foreground">
                        暂无用户数据
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-lg w-[500px] shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground">
                                {users.some(u => u.username === editingUser.username && u.username !== '') ? '编辑用户' : '添加用户'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">用户名</label>
                                <input
                                    className="w-full bg-background border border-border rounded p-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    value={editingUser.username}
                                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                    disabled={users.some(u => u.username === editingUser.username && u.username !== '')} // Disable if editing existing
                                    placeholder="请输入用户名"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">角色权限</label>
                                <select
                                    className="w-full bg-background border border-border rounded p-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                >
                                    <option value="observer">观察员 (只读)</option>
                                    <option value="operator">操作员 (可操作)</option>
                                    <option value="admin">管理员 (全权限)</option>
                                </select>
                            </div>

                            {formError && (
                                <p className="text-destructive text-sm font-medium">{formError}</p>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">取消</button>
                                {users.some(u => u.username === editingUser.username && u.username !== '') ? (
                                    <button onClick={handleUpdate} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-bold">更新权限</button>
                                ) : (
                                    <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold">创建用户</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
