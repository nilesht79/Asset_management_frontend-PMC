import api, { apiUtils } from './api'

const userService = {
  // User Services
  getUsers: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/users${queryString ? `?${queryString}` : ''}`)
  },

  // Get all engineers (users with role 'engineer')
  getEngineers: (params = {}) => {
    const queryString = apiUtils.buildQueryString({ ...params, role: 'engineer' })
    return api.get(`/users${queryString ? `?${queryString}` : ''}`)
  },

  getUserStatistics: () => {
    return api.get('/users/statistics')
  },

  getUser: (id) => {
    return api.get(`/users/${id}`)
  },

  createUser: (data) => {
    return api.post('/users', data)
  },

  updateUser: (id, data) => {
    return api.put(`/users/${id}`, data)
  },

  deleteUser: (id) => {
    return api.delete(`/users/${id}`)
  },

  resetUserPassword: (id, newPassword) => {
    return api.post(`/users/${id}/reset-password`, { new_password: newPassword })
  },

  unlockUser: (id) => {
    return api.post(`/users/${id}/unlock`)
  },

  getUserSubordinates: (id) => {
    return api.get(`/users/${id}/subordinates`)
  },

  getUserAssets: (id, params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/users/${id}/assets${queryString ? `?${queryString}` : ''}`)
  },

  // Department Services
  getDepartments: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/departments${queryString ? `?${queryString}` : ''}`)
  },

  getDepartmentHierarchy: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/departments/hierarchy${queryString ? `?${queryString}` : ''}`)
  },

  getDepartment: (id) => {
    return api.get(`/departments/${id}`)
  },

  createDepartment: (data) => {
    return api.post('/departments', data)
  },

  updateDepartment: (id, data) => {
    return api.put(`/departments/${id}`, data)
  },

  deleteDepartment: (id) => {
    return api.delete(`/departments/${id}`)
  },

  getDepartmentUsers: (id, params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/departments/${id}/users${queryString ? `?${queryString}` : ''}`)
  },

  getDepartmentSubDepartments: (id) => {
    return api.get(`/departments/${id}/sub-departments`)
  },

  // Get users from USER_MASTER for department forms (contact person dropdown)
  getDepartmentContactUsers: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/departments/users${queryString ? `?${queryString}` : ''}`)
  },

  // Location Services
  getLocations: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/masters/locations${queryString ? `?${queryString}` : ''}`)
  },

  // Bulk operations
  bulkCreateUsers: (data) => {
    return api.post('/users/bulk', { users: data })
  },

  bulkUpdateUsers: (data) => {
    return api.put('/users/bulk', { users: data })
  },

  bulkDeleteUsers: (ids) => {
    return api.delete('/users/bulk', { data: { user_ids: ids } })
  },

  // Import/Export operations
  exportUsers: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return apiUtils.downloadFile(
      `/users/export${queryString ? `?${queryString}` : ''}`,
      `users_export_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  },

  exportDepartments: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return apiUtils.downloadFile(
      `/departments/export${queryString ? `?${queryString}` : ''}`,
      `departments_export_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  },

  importUsers: (file, onProgress) => {
    return apiUtils.uploadFile('/users/import', file, onProgress)
  },

  importDepartments: (file, onProgress) => {
    return apiUtils.uploadFile('/departments/import', file, onProgress)
  },

  // Bulk upload operations
  downloadBulkUploadTemplate: () => {
    return apiUtils.downloadFile(
      '/users/bulk-upload/template',
      `bulk-user-upload-template.xlsx`
    )
  },

  validateBulkUpload: (file, onProgress) => {
    return apiUtils.uploadFile('/users/bulk-upload/validate', file, onProgress, {
      timeout: 300000 // 5 minutes for validation
    })
  },

  bulkUploadUsers: (file, onProgress) => {
    return apiUtils.uploadFile('/users/bulk-upload', file, onProgress, {
      timeout: 600000 // 10 minutes for bulk upload with password hashing
    })
  },

  exportCredentials: (users) => {
    return api.post('/users/bulk-upload/export-credentials', { users }, {
      responseType: 'blob'
    })
  },

  // Validation and utility functions
  validateUser: (data) => {
    const errors = {}
    
    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required'
    }
    
    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required'
    }
    
    if (!data.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!data.password && !data.id) { // Password required for new users
      errors.password = 'Password is required'
    } else if (data.password && !isValidPassword(data.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    }
    
    if (!data.role) {
      errors.role = 'Role is required'
    }
    
    
    if (data.employee_id && data.employee_id.length > 20) {
      errors.employee_id = 'Employee ID must be 20 characters or less'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  },

  validateDepartment: (data) => {
    const errors = {}
    
    if (!data.name?.trim()) {
      errors.name = 'Department name is required'
    }
    
    if (data.budget !== undefined && data.budget < 0) {
      errors.budget = 'Budget cannot be negative'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  },

  // Role and permission utilities
  getRoleDisplayName: (role) => {
    const roleMap = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'it_head': 'IT Head',
      'department_head': 'Department Head',
      'coordinator': 'Coordinator',
      'department_coordinator': 'Department Coordinator',
      'engineer': 'Engineer',
      'employee': 'Employee'
    }
    return roleMap[role] || role
  },

  getRoleColor: (role) => {
    const colorMap = {
      'superadmin': '#722ed1',
      'admin': '#f5222d',
      'it_head': '#eb2f96',
      'department_head': '#fa541c',
      'coordinator': '#faad14',
      'department_coordinator': '#13c2c2',
      'engineer': '#1890ff',
      'employee': '#52c41a'
    }
    return colorMap[role] || '#666666'
  },

  getRoleHierarchy: () => {
    return {
      'superadmin': 100,
      'admin': 90,
      'it_head': 80,
      'department_head': 70,
      'coordinator': 60,
      'department_coordinator': 50,
      'engineer': 30,
      'employee': 10
    }
  },

  canUserManageUser: (currentUserRole, targetUserRole) => {
    const hierarchy = userService.getRoleHierarchy()
    const currentLevel = hierarchy[currentUserRole] || 0
    const targetLevel = hierarchy[targetUserRole] || 0
    return currentLevel > targetLevel
  },

  // getAvailableRoles: (currentUserRole) => {
  //   const hierarchy = userService.getRoleHierarchy()
  //   const currentLevel = hierarchy[currentUserRole] || 0
    
  //   return Object.entries(hierarchy)
  //     .filter(([, level]) => level < currentLevel)
  //     .map(([role]) => ({
  //       value: role,
  //       label: userService.getRoleDisplayName(role),
  //       level: hierarchy[role]
  //     }))
  //     .sort((a, b) => b.level - a.level)
  // },

  getAllRoles: () => {
  const hierarchy = userService.getRoleHierarchy()

  return Object.entries(hierarchy)
    .map(([role, level]) => ({
      value: role,
      label: userService.getRoleDisplayName(role),
      level
    }))
    .sort((a, b) => b.level - a.level)
},

// getAvailableRoles: (currentUserRole) => {
//   const hierarchy = userService.getRoleHierarchy()
//   const currentLevel = hierarchy[currentUserRole] || 0

//   return Object.entries(hierarchy)
//     .filter(([, level]) => level < currentLevel)
//     .map(([role]) => ({
//       value: role,
//       label: userService.getRoleDisplayName(role),
//       level: hierarchy[role]
//     }))
//     .sort((a, b) => b.level - a.level)
// },

//   getAvailableRoles: (currentUserRole) => {
//   const hierarchy = userService.getRoleHierarchy()

//   // Coordinator can filter all manageable roles
//   if (currentUserRole === 'coordinator') {
//     const coordinatorRoles = [
//       'it_head',
//       'department_head',
//       'department_coordinator',
//       'engineer',
//       'employee'
//     ]

//     return coordinatorRoles.map(role => ({
//       value: role,
//       label: userService.getRoleDisplayName(role),
//       level: hierarchy[role] || 0
//     }))
//   }

//   // Existing hierarchy logic for other roles
//   const currentLevel = hierarchy[currentUserRole] || 0

//   return Object.entries(hierarchy)
//     .filter(([role, level]) =>
//       level < currentLevel && role !== 'coordinator'
//     )
//     .map(([role]) => ({
//       value: role,
//       label: userService.getRoleDisplayName(role),
//       level: hierarchy[role]
//     }))
//     .sort((a, b) => b.level - a.level)
// },

  
getAvailableRoles: (currentUserRole) => {
  const hierarchy = userService.getRoleHierarchy()

  // Coordinator can filter only manageable roles
  if (currentUserRole === 'coordinator') {
    const coordinatorRoles = [
      'it_head',
      'department_head',
      'department_coordinator',
      'engineer',
      'employee'
    ]

    return coordinatorRoles.map(role => ({
      value: role,
      label: userService.getRoleDisplayName(role),
      level: hierarchy[role] || 0
    }))
  }

  // SuperAdmin and Admin can also see Coordinator
  const currentLevel = hierarchy[currentUserRole] || 0

  return Object.entries(hierarchy)
    .filter(([, level]) => level < currentLevel)
    .map(([role, level]) => ({
      value: role,
      label: userService.getRoleDisplayName(role),
      level
    }))
    .sort((a, b) => b.level - a.level)
},

  
  // Search and filter utilities
  buildSearchParams: (filters, pagination = {}) => {
    const params = {}

    // Add search filters
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.role) params.role = filters.role
    if (filters.board_id) params.board_id = filters.board_id
    if (filters.department_id) params.department_id = filters.department_id
    if (filters.location_id) params.location_id = filters.location_id
    if (filters.parent_id !== undefined) params.parent_id = filters.parent_id
    if (filters.employeeId) params.employeeId = filters.employeeId

    // Add pagination
    if (pagination.page) params.page = pagination.page
    if (pagination.limit) params.limit = pagination.limit
    if (pagination.sortBy) params.sortBy = pagination.sortBy
    if (pagination.sortOrder) params.sortOrder = pagination.sortOrder

    return params
  },

  // Department utilities
  buildDepartmentTree: (departments) => {
    const buildTree = (depts, parentId = null) => {
      return depts
        .filter(dept => dept.parentDepartmentId === parentId)
        .map(dept => ({
          ...dept,
          children: buildTree(depts, dept.id)
        }))
    }
    
    return buildTree(departments)
  },

  flattenDepartmentTree: (tree) => {
    const flattened = []
    
    const flatten = (nodes, level = 0, parentPath = '') => {
      nodes.forEach(node => {
        const path = parentPath ? `${parentPath} > ${node.name}` : node.name
        flattened.push({
          ...node,
          level,
          path,
          key: node.id
        })
        
        if (node.children && node.children.length > 0) {
          flatten(node.children, level + 1, path)
        }
      })
    }
    
    flatten(tree)
    return flattened
  },

  getDepartmentPath: (departments, departmentId) => {
    const findPath = (depts, id, path = []) => {
      const dept = depts.find(d => d.id === id)
      if (!dept) return null
      
      const newPath = [dept.name, ...path]
      
      if (dept.parentDepartmentId) {
        return findPath(depts, dept.parentDepartmentId, newPath)
      }
      
      return newPath
    }
    
    const path = findPath(departments, departmentId)
    return path ? path.join(' > ') : ''
  }
}

// Helper validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


const isValidPassword = (password) => {
  // At least 8 characters with uppercase, lowercase, number and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export default userService
