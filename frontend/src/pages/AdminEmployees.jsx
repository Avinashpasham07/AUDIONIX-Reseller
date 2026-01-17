import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { FaUserPlus, FaTrash, FaShieldAlt, FaEnvelope, FaUser, FaLock, FaCheckSquare, FaEdit } from 'react-icons/fa';

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        permissions: []
    });

    const permissionOptions = [
        { id: 'orders', label: 'Manage Orders' },
        { id: 'products', label: 'Manage Products' },
        { id: 'resellers', label: 'Manage Resellers' },
        { id: 'meetings', label: 'Schedule Meetings' },
        { id: 'requests', label: 'Premium Requests' },
        { id: 'analytics', label: 'View Analytics' },
        { id: 'settings', label: 'Manage Settings' },
        { id: 'employees', label: 'Manage Employees' }
    ];

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/employees');
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData({ name: '', email: '', password: '', permissions: [] });
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setEditingEmployee(emp);
        setFormData({
            name: emp.name,
            email: emp.email,
            password: '****', // Password can't be updated here normally
            permissions: emp.permissions
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await api.put(`/admin/employees/${editingEmployee._id}/permissions`, {
                    permissions: formData.permissions
                });
                toast.success("Permissions updated successfully!");
            } else {
                await api.post('/admin/employees', formData);
                toast.success("Employee created successfully!");
            }
            setShowModal(false);
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Are you sure you want to remove this employee?")) return;
        try {
            await api.delete(`/admin/employees/${id}`);
            toast.success("Employee removed successfully");
            fetchEmployees();
        } catch (error) {
            toast.error("Failed to delete employee");
        }
    };

    const togglePermission = (permId) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    return (
        <MainLayout>
            <div className="mb-8 p-4 md:p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        Employee Management<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-zinc-400">Add and manage backend staff permissions.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-red-900/20"
                >
                    <FaUserPlus /> Add Employee
                </button>
            </div>

            {loading ? (
                <div className="text-zinc-500 text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading employees...
                </div>
            ) : employees.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-20 text-center">
                    <FaShieldAlt className="text-zinc-700 text-6xl mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400">No employees found</h2>
                    <p className="text-zinc-500 mb-6">Start by adding your first backend staff member.</p>
                    <button
                        onClick={openAddModal}
                        className="text-red-500 font-bold hover:underline"
                    >
                        Click here to add
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                        <div key={emp._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={() => openEditModal(emp)}
                                    className="text-zinc-600 hover:text-blue-500 p-2"
                                    title="Edit Permissions"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDeleteEmployee(emp._id)}
                                    className="text-zinc-600 hover:text-red-500 p-2"
                                    title="Remove Employee"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                                    <p className="text-zinc-500 text-sm">{emp.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                    {emp.permissions.length > 0 ? (
                                        emp.permissions.map(p => (
                                            <span key={p} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold border border-zinc-700 uppercase">
                                                {p}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-zinc-600 text-xs italic">No access assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 relative z-110 shadow-2xl animate-scaleUp">
                        <h2 className="text-3xl font-black text-white mb-6">
                            {editingEmployee ? 'Edit Permissions' : 'New Employee'}<span className="text-red-600">.</span>
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input
                                        required
                                        disabled={!!editingEmployee}
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition disabled:opacity-50"
                                    />
                                </div>
                                <div className="relative">
                                    <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input
                                        required
                                        disabled={!!editingEmployee}
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition disabled:opacity-50"
                                    />
                                </div>
                                {!editingEmployee && (
                                    <div className="relative">
                                        <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            required
                                            type="password"
                                            placeholder="Initial Password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-bold text-zinc-400">Select Access Permissions:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {permissionOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => togglePermission(opt.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition text-xs font-bold ${formData.permissions.includes(opt.id)
                                                ? 'bg-red-600/10 border-red-500 text-red-500'
                                                : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                        >
                                            <FaCheckSquare className={formData.permissions.includes(opt.id) ? 'opacity-100' : 'opacity-20'} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
                                >
                                    {editingEmployee ? 'Update Permissions' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default AdminEmployees;
