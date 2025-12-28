import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Eye, EyeOff, Key } from 'lucide-react';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_ids: [],
    is_active: true,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState(null);

  // Error boundary fallback
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading User Management</h2>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button 
          onClick={() => { setError(null); window.location.reload(); }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  useEffect(() => {
    try {
      fetchUsers();
      fetchRoles();
      fetchModules();
    } catch (err) {
      console.error('useEffect error:', err);
      setError(err);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await api.getUsers();
      console.log('Users fetched:', response);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      console.error('Error details:', error);
      showMessage('error', error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      const response = await api.getRoles();
      console.log('Roles fetched:', response);
      setRoles(response.data || []);
    } catch (error) {
      console.error('Fetch roles error:', error);
      console.error('Error details:', error);
    }
  };

  const fetchModules = async () => {
    try {
      console.log('Fetching modules...');
      const response = await api.getModules();
      console.log('Modules response:', response);
      console.log('Modules data:', response.data);
      setModules(response.data || []);
      console.log('Modules set to state');
    } catch (error) {
      console.error('Fetch modules error:', error);
    }
  };

  const handleManagePermissions = async (user) => {
    console.log('Opening permissions modal for user:', user);
    
    // Set the user and show modal immediately
    setSelectedUser(user);
    setShowPermissions(true);
    setPermissionsLoading(true);
    
    try {
      console.log('Fetching permissions for user ID:', user.id);
      const response = await api.getUserPermissions(user.id);
      console.log('Permissions response:', response);
      
      // Ensure we have an array of permissions
      const perms = Array.isArray(response.data) ? response.data : [];
      console.log('Setting permissions:', perms);
      setUserPermissions(perms);
    } catch (error) {
      console.error('Fetch permissions error:', error);
      // Set empty permissions on error so modal still shows
      setUserPermissions([]);
      showMessage('error', 'Failed to fetch user permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handlePermissionChange = (moduleId, field, isMainModule = false) => {
    console.log('Permission change:', moduleId, field, 'isMainModule:', isMainModule);
    
    setUserPermissions(prev => {
      const prevPerms = Array.isArray(prev) ? prev : [];
      const existing = prevPerms.find(p => p.module_id === moduleId);
      const newValue = existing ? !existing[field] : true;
      
      let updatedPerms;
      
      if (existing) {
        // Update existing permission
        updatedPerms = prevPerms.map(p => 
          p.module_id === moduleId
            ? { ...p, [field]: newValue }
            : p
        );
      } else {
        // Add new permission
        updatedPerms = [...prevPerms, {
          module_id: moduleId,
          can_view: field === 'can_view',
          can_edit: field === 'can_edit',
          can_delete: field === 'can_delete'
        }];
      }
      
      // If this is a main module, also update all its submodules
      if (isMainModule) {
        const submodules = modules.filter(m => m.parent_module_id === moduleId);
        console.log('Found', submodules.length, 'submodules for main module', moduleId);
        
        submodules.forEach(subModule => {
          const subExisting = updatedPerms.find(p => p.module_id === subModule.id);
          
          if (subExisting) {
            // Update existing submodule permission
            updatedPerms = updatedPerms.map(p =>
              p.module_id === subModule.id
                ? { ...p, [field]: newValue }
                : p
            );
          } else {
            // Add new submodule permission
            updatedPerms.push({
              module_id: subModule.id,
              can_view: field === 'can_view' ? newValue : false,
              can_edit: field === 'can_edit' ? newValue : false,
              can_delete: field === 'can_delete' ? newValue : false
            });
          }
        });
      }
      
      return updatedPerms;
    });
  };

  const handleSavePermissions = async () => {
    try {
      await api.updateUserPermissions(selectedUser.id, { permissions: userPermissions });
      showMessage('success', 'Permissions updated successfully');
      setShowPermissions(false);
    } catch (error) {
      console.error('Save permissions error:', error);
      showMessage('error', 'Failed to save permissions');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleChange = (roleId) => {
    console.log('Role change clicked:', roleId);
    console.log('Current role_ids:', formData.role_ids);
    
    setFormData(prev => {
      const role_ids = prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...prev.role_ids, roleId];
      
      console.log('New role_ids:', role_ids);
      return { ...prev, role_ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate role selection
      if (!formData.role_ids || formData.role_ids.length === 0) {
        showMessage('error', 'Please select at least one role');
        return;
      }

      const payload = { ...formData };
      
      // Don't send password if editing and password is empty
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      console.log('Submitting user data:', payload);

      if (editingUser) {
        const response = await api.updateUser(editingUser.id, payload);
        console.log('Update response:', response);
        showMessage('success', 'User updated successfully');
      } else {
        const response = await api.createUser(payload);
        console.log('Create response:', response);
        showMessage('success', 'User created successfully');
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      console.error('Error details:', error);
      showMessage('error', error.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      role_ids: user.roles?.map(r => r.role_id) || [],
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.deleteUser(id);
      showMessage('success', 'User deleted successfully');
      fetchUsers();
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role_ids: [],
      is_active: true,
    });
    setEditingUser(null);
    setShowForm(false);
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add User
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                  {editingUser && <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500">Loading roles...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.role_ids?.includes(role.id) || false}
                        onChange={() => handleRoleChange(role.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{role.role_name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selected: {formData.role_ids?.length || 0} role(s)
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Active User
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No users found. Click "Add User" to create one.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role.role_id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Shield size={12} className="mr-1" />
                              {role.role_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleManagePermissions(user)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                          title="Manage Permissions"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissions && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop
            if (e.target === e.currentTarget) {
              console.log('Closing modal - backdrop clicked');
              setShowPermissions(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => {
              // Prevent any clicks inside the modal from bubbling to backdrop
              e.stopPropagation();
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Manage Permissions</h2>
                <p className="text-sm text-purple-100 mt-1">
                  {selectedUser?.full_name || 'Loading...'} (@{selectedUser?.username || 'N/A'})
                </p>
              </div>
              <button
                onClick={() => setShowPermissions(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Modules loaded: {modules.length} | Permissions: {Array.isArray(userPermissions) ? userPermissions.length : 0}
                  </p>
                  
                  {modules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No modules found. Please check the database.
                    </div>
                  ) : (
                    modules.filter(m => !m.parent_module_id).map((mainModule) => (
                      <div key={mainModule.id} className="border rounded-lg overflow-hidden">
                        {/* Main Module Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Shield size={18} className="text-purple-600" />
                            {mainModule.module_name}
                          </h3>
                        </div>

                        {/* Main Module Permissions */}
                        <div className="bg-white">
                          <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b bg-gray-50">
                            <div className="font-medium text-sm text-gray-700">Module</div>
                          <div className="font-medium text-sm text-gray-700 text-center">View</div>
                          <div className="font-medium text-sm text-gray-700 text-center">Edit</div>
                          <div className="font-medium text-sm text-gray-700 text-center">Delete</div>
                        </div>

                        {/* Main Module Row */}
                        {(() => {
                          const perm = Array.isArray(userPermissions) 
                            ? userPermissions.find(p => p.module_id === mainModule.id) || {}
                            : {};
                          return (
                            <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b hover:bg-gray-50">
                              <div className="text-sm font-medium text-gray-900">{mainModule.module_name}</div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_view || false}
                                  onChange={() => handlePermissionChange(mainModule.id, 'can_view', true)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  title="Toggle all submodules"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_edit || false}
                                  onChange={() => handlePermissionChange(mainModule.id, 'can_edit', true)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  title="Toggle all submodules"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_delete || false}
                                  onChange={() => handlePermissionChange(mainModule.id, 'can_delete', true)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  title="Toggle all submodules"
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Submodules */}
                        {modules.filter(m => m.parent_module_id === mainModule.id).map((subModule) => {
                          const perm = Array.isArray(userPermissions)
                            ? userPermissions.find(p => p.module_id === subModule.id) || {}
                            : {};
                          return (
                            <div key={subModule.id} className="grid grid-cols-4 gap-4 px-4 py-2 border-b hover:bg-gray-50">
                              <div className="text-sm text-gray-700 pl-6">↳ {subModule.module_name}</div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_view || false}
                                  onChange={() => handlePermissionChange(subModule.id, 'can_view')}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_edit || false}
                                  onChange={() => handlePermissionChange(subModule.id, 'can_edit')}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                              </div>
                              <div className="text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.can_delete || false}
                                  onChange={() => handlePermissionChange(subModule.id, 'can_delete')}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowPermissions(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
