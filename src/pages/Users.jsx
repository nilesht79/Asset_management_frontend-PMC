import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Dropdown,
  Tooltip,
  Row,
  Col,
  Statistic,
  Avatar,
  Drawer,
  Divider,
  Badge,
  Typography,
  Checkbox
} from 'antd'
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  FilterOutlined,
  CloseCircleOutlined,
  ClearOutlined
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import userService from '../services/user'
import dashboardService from '../services/dashboard'
import { fetchBoards as fetchBoardsAction } from '../store/slices/masterSlice'
import PasswordInput from '../components/common/PasswordInput'
import { formatDateOnly, formatLocalDateTime } from '../utils/dateUtils'

const { Search } = Input
const { Option } = Select
const { confirm } = Modal
const { Title } = Typography

const Users = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [boards, setBoards] = useState([])
  const [locations, setLocations] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [filters, setFilters] = useState({
    search: '',
    status: 'active',
    role: '',
    board_id: '',
    department_id: '',
    location_id: '',
    employeeId: ''
  })
  const [tempFilters, setTempFilters] = useState({ ...filters })
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userDetailsVisible, setUserDetailsVisible] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    pendingApprovals: 0
  })
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [bulkUploadModalVisible, setBulkUploadModalVisible] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const { user: currentUser } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [pagination.current, pagination.pageSize, filters])

  useEffect(() => {
    fetchDepartments()
  }, [filters.board_id])

  useEffect(() => {
    fetchBoards()
    fetchLocations()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = userService.buildSearchParams(filters, {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder
      })

      const response = await userService.getUsers(params)
      const userData = response.data.data

      setUsers(userData.users || [])
      setPagination(prev => ({
        ...prev,
        total: userData.pagination?.totalItems || 0
      }))

      // Fetch actual statistics from the backend
      fetchStatistics()
    } catch (error) {
      console.error('Failed to fetch users:', error)
      message.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await userService.getUserStatistics()
      const statsData = response.data.data

      setStats({
        total: statsData.total || 0,
        active: statsData.active || 0,
        inactive: statsData.inactive || 0,
        byRole: statsData.byRole || {},
        pendingApprovals: statsData.pendingApprovals || 0
      })
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      let allDepartments = []
      let currentPage = 1
      let hasMore = true

      // If a board is selected, fetch only departments for that board
      const baseParams = filters.board_id ? { board_id: filters.board_id } : {}

      // Fetch all departments with pagination (max limit is 100)
      while (hasMore) {
        const response = await userService.getDepartments({ ...baseParams, page: currentPage, limit: 100 })
        const data = response.data.data
        const departments = data?.departments || []

        allDepartments = [...allDepartments, ...departments]

        // Check if there are more pages
        if (data?.pagination && currentPage < data.pagination.totalPages) {
          currentPage++
        } else {
          hasMore = false
        }
      }

      setDepartments(allDepartments)
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchBoards = async () => {
    try {
      const result = await dispatch(fetchBoardsAction({ limit: 1000 })).unwrap()
      // Redux action returns response.data, which contains { data: { boards: [...] } }
      setBoards(result.data?.boards || [])
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      let allLocations = []
      let currentPage = 1
      let hasMore = true

      // Fetch all locations with pagination (max limit is 100)
      while (hasMore) {
        const response = await userService.getLocations({ page: currentPage, limit: 100 })
        const data = response.data.data
        const locations = data?.locations || []

        allLocations = [...allLocations, ...locations]

        // Check if there are more pages
        if (data?.pagination && currentPage < data.pagination.totalPages) {
          currentPage++
        } else {
          hasMore = false
        }
      }

      setLocations(allLocations)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const handleTableChange = (paginationInfo, tableFilters, sorter) => {
    console.log('Table change:', { paginationInfo, tableFilters, sorter })

    setPagination(prev => {
      const newPagination = {
        ...prev,
        current: paginationInfo.current,
        pageSize: paginationInfo.pageSize
      }

      // Handle sorting
      if (sorter && sorter.columnKey) {
        // Map frontend column keys to backend field names
        const fieldMapping = {
          'user': 'first_name',
          'employeeId': 'employee_id',
          'role': 'role',
          'status': 'is_active',
          'lastLogin': 'last_login'
        }

        const backendField = fieldMapping[sorter.columnKey] || sorter.columnKey

        // Only update if we have a valid order
        if (sorter.order) {
          newPagination.sortBy = backendField
          newPagination.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
        } else {
          // Reset to default when sorting is cleared
          newPagination.sortBy = 'created_at'
          newPagination.sortOrder = 'desc'
        }
      }

      return newPagination
    })
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }

      // Cascading filter logic: when board changes, reset department
      if (key === 'board_id') {
        newFilters.department_id = ''
      }

      return newFilters
    })
    setPagination(prev => ({
      ...prev,
      current: 1
    }))
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    form.resetFields()
    setUserModalVisible(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      role: user.role,
      department_id: user.department?.id,
      location_id: user.location?.id,
      employee_id: user.employeeId,
      designation: user.designation,
      room_no: user.roomNo,
      contact_number: user.contactNumber,
      status: user.status,
      is_vip: user.isVip || false,
      allow_multi_assets: user.allowMultiAssets || false
    })
    setUserModalVisible(true)
  }

  const handleViewUser = (user) => {
    setSelectedUserDetails(user)
    setUserDetailsVisible(true)
  }

  const handleSaveUser = async (values) => {
    try {
      console.log('Form values:', values)
      if (editingUser) {
        await userService.updateUser(editingUser.id, values)
        message.success('User updated successfully')
      } else {
        await userService.createUser(values)
        message.success('User created successfully')
      }

      setUserModalVisible(false)
      fetchUsers()
      fetchStatistics()
    } catch (error) {
      console.error('Failed to save user:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save user'
      message.error(errorMessage)
    }
  }

  
  const handleDeleteUser = (user) => {
    confirm({
      title: `Delete user ${user.firstName} ${user.lastName}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.deleteUser(user.id)
          message.success('User deleted successfully')
          fetchUsers()
        } catch (error) {
          console.error('Failed to delete user:', error)
          message.error('Failed to delete user')
        }
      }
    })
  }

  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = !user.isActive
      await userService.updateUser(user.id, { is_active: newStatus })
      message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      message.error('Failed to update user status')
    }
  }

  const handleResetPassword = (user) => {
    confirm({
      title: `Reset password for ${user.firstName} ${user.lastName}?`,
      content: 'A new secure password will be automatically generated for this user.',
      onOk: async () => {
        try {
          const response = await userService.resetUserPassword(user.id)
          const data = response.data.data || response.data

          // Show the generated password in a modal
          if (data && data.passwordGenerated && data.newPassword) {
            Modal.success({
              title: 'Password Reset Successful',
              width: 600,
              content: (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-300 p-3 rounded">
                    <p className="font-semibold text-yellow-800 mb-2">⚠️ Important Security Notice</p>
                    <p className="text-sm text-yellow-700">
                      Please securely share this password with the user and instruct them to change it upon first login.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">User:</span>
                      <div className="text-base font-semibold">{data.user.name}</div>
                      <div className="text-sm text-gray-500">{data.user.email}</div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600">New Password:</span>
                      <div className="mt-1 p-3 bg-blue-50 rounded border border-blue-200">
                        <code className="text-lg font-mono font-bold text-blue-700 select-all">
                          {data.newPassword}
                        </code>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click the password to select and copy it
                      </p>
                    </div>
                  </div>
                </div>
              ),
              okText: 'Done'
            })
          } else {
            message.success('Password reset successfully')
          }

          fetchUsers()
        } catch (error) {
          console.error('Failed to reset password:', error)
          message.error(error.response?.data?.message || 'Failed to reset password')
        }
      }
    })
  }

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      message.warning('Please select users to delete')
      return
    }

    confirm({
      title: `Delete ${selectedUsers.length} selected users?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.bulkDeleteUsers(selectedUsers)
          message.success(`${selectedUsers.length} users deleted successfully`)
          setSelectedUsers([])
          fetchUsers()
        } catch (error) {
          console.error('Failed to delete users:', error)
          message.error('Failed to delete users')
        }
      }
    })
  }

  const handleExport = async () => {
    try {
      await userService.exportUsers(filters)
      message.success('Export completed successfully')
    } catch (error) {
      console.error('Failed to export users:', error)
      message.error('Failed to export users')
    }
  }

  const fetchPendingApprovals = async () => {
    setApprovalsLoading(true)
    try {
      const response = await dashboardService.getPendingApprovals({ limit: 50 })
      const approvals = response.data.data || []
      
      // Filter for user registration approvals only
      const userApprovals = approvals.filter(approval => approval.type === 'User Registration')
      setPendingUsers(userApprovals)
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error)
      message.error('Failed to load pending approvals')
    } finally {
      setApprovalsLoading(false)
    }
  }

  const handleShowApprovals = () => {
    fetchPendingApprovals()
    setApprovalModalVisible(true)
  }

  const handleApproveUser = async (userId, type = 'User Registration') => {
    try {
      await dashboardService.approveItem(userId, type)
      message.success('User approved successfully')
      fetchPendingApprovals() // Refresh pending list
      fetchUsers() // Refresh main users list
    } catch (error) {
      console.error('Failed to approve user:', error)
      message.error('Failed to approve user')
    }
  }

  const handleRejectUser = async (userId, type = 'User Registration') => {
    confirm({
      title: 'Reject User Registration?',
      content: 'This will permanently delete the user registration. This action cannot be undone.',
      okText: 'Reject',
      okType: 'danger',
      onOk: async () => {
        try {
          await dashboardService.rejectItem(userId, type, 'Rejected by admin')
          message.success('User registration rejected')
          fetchPendingApprovals() // Refresh pending list
          fetchUsers() // Refresh main users list
        } catch (error) {
          console.error('Failed to reject user:', error)
          message.error('Failed to reject user')
        }
      }
    })
  }

  const handleDownloadTemplate = async () => {
    try {
      await userService.downloadBulkUploadTemplate()
      message.success('Template downloaded successfully')
    } catch (error) {
      console.error('Failed to download template:', error)
      message.error('Failed to download template')
    }
  }

  const handleBulkUploadClick = () => {
    setUploadFile(null)
    setUploadResults(null)
    setUploadProgress(0)
    setBulkUploadModalVisible(true)
  }

  const handleFileChange = (info) => {
    const file = info.file.originFileObj || info.file
    setUploadFile(file)
    setUploadResults(null)
  }

  const handleDownloadCredentials = async () => {
    if (!uploadResults || !uploadResults.users || uploadResults.users.length === 0) {
      message.error('No credentials available to download')
      return
    }

    try {
      const response = await userService.exportCredentials(uploadResults.users)

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `user-credentials-${Date.now()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success('Credentials file downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      message.error('Failed to download credentials file')
    }
  }

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      message.warning('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await userService.bulkUploadUsers(
        uploadFile,
        (progress) => {
          // progress is -1 for indeterminate, or 0-100 for percentage
          setUploadProgress(progress >= 0 ? progress : 50) // Show 50% for indeterminate
        }
      )

      const data = response.data.data || response.data

      setUploadResults({
        success: true,
        summary: data.summary,
        users: data.users || [],
        errors: []
      })

      message.success(`Successfully created ${data.summary?.successful || 0} users`)

      // Refresh users list
      setTimeout(() => {
        fetchUsers()
      }, 1000)

    } catch (error) {
      console.error('Bulk upload failed:', error)

      const errorData = error.response?.data || {}

      setUploadResults({
        success: false,
        summary: errorData.summary || { total: 0, successful: 0, failed: 0 },
        users: errorData.users || [],
        errors: errorData.errors || [],
        availableDepartments: errorData.availableDepartments || []
      })

      if (errorData.errors && errorData.errors.length > 0) {
        message.error(`Upload failed with ${errorData.errors.length} errors`)
      } else {
        message.error('Bulk upload failed')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseBulkUpload = () => {
    setBulkUploadModalVisible(false)
    setUploadFile(null)
    setUploadResults(null)
    setUploadProgress(0)
  }

  const handleOpenFilterDrawer = () => {
    setTempFilters({ ...filters })
    setFilterDrawerVisible(true)
  }

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters })
    setPagination(prev => ({ ...prev, current: 1 }))
    setFilterDrawerVisible(false)
    message.success('Filters applied')
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'active',
      role: '',
      board_id: '',
      department_id: '',
      location_id: '',
      employeeId: ''
    }
    setTempFilters(clearedFilters)
    setFilters(clearedFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
    setFilterDrawerVisible(false)
    message.success('Filters cleared')
  }

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...filters }
    if (filterKey === 'status') {
      newFilters[filterKey] = 'active'
    } else {
      newFilters[filterKey] = ''
    }
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const getActiveFilters = () => {
    const activeFilters = []
    if (filters.search) activeFilters.push({ key: 'search', label: `Search: ${filters.search}` })
    if (filters.status !== 'active') activeFilters.push({ key: 'status', label: `Status: ${filters.status === 'inactive' ? 'Inactive' : 'All'}` })
    if (filters.role) {
      const roleObj = availableRoles.find(r => r.value === filters.role)
      activeFilters.push({ key: 'role', label: `Role: ${roleObj?.label || filters.role}` })
    }
    if (filters.board_id) {
      const board = boards.find(b => b.id === filters.board_id)
      activeFilters.push({ key: 'board_id', label: `Board: ${board?.name || 'Unknown'}` })
    }
    if (filters.department_id) {
      const dept = departments.find(d => d.id === filters.department_id)
      activeFilters.push({ key: 'department_id', label: `Department: ${dept?.name || 'Unknown'}` })
    }
    if (filters.location_id) {
      const loc = locations.find(l => l.id === filters.location_id)
      activeFilters.push({ key: 'location_id', label: `Location: ${loc?.name || 'Unknown'}` })
    }
    if (filters.employeeId) activeFilters.push({ key: 'employeeId', label: `Employee ID: ${filters.employeeId}` })
    return activeFilters
  }

  const getActionMenu = (user) => ({
    items: [
      {
        key: 'view',
        label: 'View Details',
        icon: <UserOutlined />,
        onClick: () => handleViewUser(user)
      },
      {
        key: 'edit',
        label: 'Edit User',
        icon: <EditOutlined />,
        onClick: () => handleEditUser(user),
        disabled: !userService.canUserManageUser(currentUser?.role, user.role)
      },
      {
        key: 'toggle-status',
        label: user.isActive ? 'Deactivate' : 'Activate',
        icon: user.isActive ? <LockOutlined /> : <UnlockOutlined />,
        onClick: () => handleToggleUserStatus(user),
        disabled: !userService.canUserManageUser(currentUser?.role, user.role)
      },
      {
        key: 'reset-password',
        label: 'Reset Password',
        icon: <LockOutlined />,
        onClick: () => handleResetPassword(user),
        disabled: !userService.canUserManageUser(currentUser?.role, user.role)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        label: 'Delete User',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteUser(user),
        disabled: !userService.canUserManageUser(currentUser?.role, user.role)
      }
    ]
  })

  const columns = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left',
      width: 250,
      render: (_, user) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={window.innerWidth < 576 ? 32 : 40}
            src={user.profilePicture}
            icon={<UserOutlined />}
            style={{ backgroundColor: userService.getRoleColor(user.role) }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          <div>
            <div className="font-medium" style={{ fontSize: window.innerWidth < 576 ? 13 : 14 }}>
              {user.firstName} {user.lastName}
            </div>
            <div className="text-gray-500" style={{ fontSize: window.innerWidth < 576 ? 11 : 12 }}>
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 120,
      responsive: ['md']
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 150,
      render: (designation) => designation || '-',
      responsive: ['lg']
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role) => (
        <Tag color={userService.getRoleColor(role)}>
          {userService.getRoleDisplayName(role)}
        </Tag>
      )
    },
    {
      title: 'Department',
      key: 'department',
      width: 200,
      render: (_, user) => user.department?.name || 'No Department',
      responsive: ['lg']
    },
    {
      title: 'Location',
      key: 'location',
      width: 200,
      render: (_, user) => user.location?.name || 'No Location',
      responsive: ['lg']
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date) => date ? formatDateOnly(date) : 'Never',
      responsive: ['md']
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, user) => (
        <Dropdown menu={getActionMenu(user)} trigger={['click']} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ]

  const availableRoles = userService.getAvailableRoles(currentUser?.role)
  const activeFilters = getActiveFilters()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={stats.inactive}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingApprovals}
              valueStyle={{ color: '#faad14' }}
              prefix={<UserOutlined />}
              suffix={
                stats.pendingApprovals > 0 && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={handleShowApprovals}
                    className="ml-2"
                  >
                    Review
                  </Button>
                )
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Search and Action Buttons Row */}
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search users..."
                allowClear
                onSearch={(value) => handleFilterChange('search', value)}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Space wrap size={[8, 8]} style={{ float: 'right' }}>
                <Badge count={activeFilters.length} offset={[-5, 5]}>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={handleOpenFilterDrawer}
                    size={window.innerWidth < 576 ? 'small' : 'middle'}
                  >
                    {window.innerWidth >= 768 && 'Filters'}
                  </Button>
                </Badge>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  disabled={loading}
                  size={window.innerWidth < 576 ? 'small' : 'middle'}
                >
                  {window.innerWidth >= 768 && 'Refresh'}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  size={window.innerWidth < 576 ? 'small' : 'middle'}
                >
                  {window.innerWidth >= 768 && 'Export'}
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  onClick={handleBulkUploadClick}
                  size={window.innerWidth < 576 ? 'small' : 'middle'}
                >
                  {window.innerWidth >= 768 && 'Bulk Upload'}
                </Button>
                {selectedUsers.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBulkDelete}
                    size={window.innerWidth < 576 ? 'small' : 'middle'}
                  >
                    Delete ({selectedUsers.length})
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateUser}
                  size={window.innerWidth < 576 ? 'small' : 'middle'}
                >
                  {window.innerWidth >= 768 ? 'Add User' : 'Add'}
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Space wrap size={[8, 8]}>
                <span style={{ fontWeight: 500, color: '#666', fontSize: '13px' }}>Active Filters:</span>
                {activeFilters.map(filter => (
                  <Tag
                    key={filter.key}
                    closable
                    onClose={() => handleRemoveFilter(filter.key)}
                    color="blue"
                    style={{ fontSize: '12px', padding: '4px 8px', margin: 0 }}
                  >
                    {filter.label}
                  </Tag>
                ))}
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={handleClearFilters}
                  style={{ padding: '0 8px', fontSize: '12px' }}
                >
                  Clear All
                </Button>
              </Space>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
              size: window.innerWidth < 576 ? 'small' : 'default'
            }}
            onChange={handleTableChange}
            rowSelection={{
              selectedRowKeys: selectedUsers,
              onChange: setSelectedUsers,
              getCheckboxProps: (record) => ({
                disabled: !userService.canUserManageUser(currentUser?.role, record.role)
              })
            }}
            scroll={{ x: 'max-content' }}
            size={window.innerWidth < 576 ? 'small' : 'middle'}
          />
        </Space>
      </Card>

      {/* User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                tooltip="Optional - will be auto-generated as firstname.lastname@company.local if not provided"
                rules={[
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Leave blank to auto-generate" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ height: '72px' }}></div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Role is required' }]}
              >
                <Select>
                  {availableRoles.map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department_id"
              >
                <Select
                  allowClear
                  placeholder="Select department"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                  optionFilterProp="children"
                  virtual
                  listHeight={256}
                >
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Location"
                name="location_id"
                className="location-select-form-item"
              >
                <Select
                  allowClear
                  placeholder="Select location"
                  showSearch
                  filterOption={(input, option) => {
                    const searchText = input.toLowerCase()
                    const locationName = option?.locationname?.toLowerCase() || ''
                    const building = option?.building?.toLowerCase() || ''
                    const floor = option?.floor?.toLowerCase() || ''
                    return locationName.includes(searchText) ||
                           building.includes(searchText) ||
                           floor.includes(searchText)
                  }}
                  virtual
                  listHeight={256}
                  style={{ width: '100%' }}
                  optionLabelProp="children"
                >
                  {locations.map(loc => {
                    const buildingFloor = [
                      loc.building ? `Building: ${loc.building}` : '',
                      loc.floor ? `Floor: ${loc.floor}` : ''
                    ].filter(Boolean).join(' • ')

                    return (
                      <Option
                        key={loc.id}
                        value={loc.id}
                        locationname={loc.name}
                        building={loc.building || ''}
                        floor={loc.floor || ''}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${loc.name}${buildingFloor ? ` (${buildingFloor})` : ''}`}>
                          <span style={{ fontWeight: 500 }}>{loc.name}</span>
                          {buildingFloor && (
                            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                              ({buildingFloor})
                            </span>
                          )}
                        </div>
                      </Option>
                    )
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Room No"
                name="room_no"
              >
                <Input placeholder="e.g., 101, A-12, Conference Room 3" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Employee ID"
                name="employee_id"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Designation"
                name="designation"
              >
                <Input placeholder="e.g., Software Engineer, Manager" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contact Number"
                name="contact_number"
                rules={[
                  { pattern: /^[0-9]{10,15}$/, message: 'Enter a valid phone number (10-15 digits)' }
                ]}
              >
                <Input placeholder="10-digit mobile number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                initialValue="active"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ height: '32px' }}></div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_vip"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>VIP User</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="allow_multi_assets"
                valuePropName="checked"
                initialValue={false}
                tooltip="When enabled, this user can be assigned multiple assets of the same category/subcategory type"
              >
                <Checkbox>Allow Multiple Assets of Same Type</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 8, message: 'Password must be at least 8 characters' },
                {
                  validator: async (_, value) => {
                    if (!value) return Promise.reject();

                    // Import password strength checker
                    const { checkPasswordStrength } = await import('../utils/passwordStrength');
                    const strength = checkPasswordStrength(value);

                    // Accept Medium, Good, or Strong passwords (score >= 40)
                    if (strength.score < 40) {
                      return Promise.reject('Password is too weak. Use at least 3 character types (uppercase, lowercase, numbers, special chars)');
                    }

                    return Promise.resolve();
                  }
                }
              ]}
            >
              <PasswordInput showRequirements placeholder="Enter password (minimum: Medium strength)" />
            </Form.Item>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setUserModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* User Details Drawer */}
      <Drawer
        title="User Details"
        placement="right"
        onClose={() => setUserDetailsVisible(false)}
        open={userDetailsVisible}
        width={400}
      >
        {selectedUserDetails && (
          <div className="space-y-4">
            <div className="text-center">
              <Avatar 
                size={80} 
                src={selectedUserDetails.profilePicture} 
                icon={<UserOutlined />}
                style={{ backgroundColor: userService.getRoleColor(selectedUserDetails.role) }}
              >
                {selectedUserDetails.firstName?.[0]}{selectedUserDetails.lastName?.[0]}
              </Avatar>
              <h3 className="mt-2 text-lg font-semibold">
                {selectedUserDetails.firstName} {selectedUserDetails.lastName}
              </h3>
              <Tag color={userService.getRoleColor(selectedUserDetails.role)}>
                {userService.getRoleDisplayName(selectedUserDetails.role)}
              </Tag>
            </div>

            <div className="space-y-2">
              <div><strong>Email:</strong> {selectedUserDetails.email}</div>
              <div><strong>Employee ID:</strong> {selectedUserDetails.employeeId || 'N/A'}</div>
              <div><strong>Designation:</strong> {selectedUserDetails.designation || 'N/A'}</div>
              <div><strong>Department:</strong> {selectedUserDetails.department?.name || 'No Department'}</div>
              <div><strong>Location:</strong> {selectedUserDetails.location?.name || 'No Location'}</div>
              {selectedUserDetails.location?.building && (
                <div><strong>Building:</strong> {selectedUserDetails.location.building}</div>
              )}
              {selectedUserDetails.location?.floor && (
                <div><strong>Floor:</strong> {selectedUserDetails.location.floor}</div>
              )}
              <div><strong>Room No:</strong> {selectedUserDetails.roomNo || 'N/A'}</div>
              <div><strong>Contact Number:</strong> {selectedUserDetails.contactNumber || 'N/A'}</div>
              <div>
                <strong>Status:</strong>
                <Tag color={selectedUserDetails.isActive ? 'green' : 'red'} className="ml-2">
                  {selectedUserDetails.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
              </div>
              <div>
                <strong>VIP:</strong>
                <Tag color={selectedUserDetails.isVip ? 'gold' : 'default'} className="ml-2">
                  {selectedUserDetails.isVip ? 'YES' : 'NO'}
                </Tag>
              </div>
              <div>
                <strong>Allow Multi Assets:</strong>
                <Tag color={selectedUserDetails.allowMultiAssets ? 'blue' : 'default'} className="ml-2">
                  {selectedUserDetails.allowMultiAssets ? 'YES' : 'NO'}
                </Tag>
              </div>
              <div><strong>Last Login:</strong> {selectedUserDetails.lastLogin ? formatLocalDateTime(selectedUserDetails.lastLogin) : 'Never'}</div>
              <div><strong>Created:</strong> {selectedUserDetails.createdAt ? formatLocalDateTime(selectedUserDetails.createdAt) : 'N/A'}</div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Pending Approvals Modal */}
      <Modal
        title="Pending User Approvals"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          {approvalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading pending approvals...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending user approvals</p>
            </div>
          ) : (
            pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.id} size="small">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{pendingUser.item}</h4>
                    <p className="text-sm text-gray-500">
                      Requested on: {pendingUser.date}
                    </p>
                    <Tag color={
                      pendingUser.priority === 'high' ? 'red' :
                      pendingUser.priority === 'medium' ? 'orange' : 'green'
                    }>
                      {pendingUser.priority?.toUpperCase()} PRIORITY
                    </Tag>
                  </div>
                  <Space>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleApproveUser(pendingUser.id, pendingUser.type)}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      size="small"
                      onClick={() => handleRejectUser(pendingUser.id, pendingUser.type)}
                    >
                      Reject
                    </Button>
                  </Space>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        title="Bulk Upload Users"
        open={bulkUploadModalVisible}
        onCancel={handleCloseBulkUpload}
        width={800}
        footer={[
          <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Download Template
          </Button>,
          <Button key="cancel" onClick={handleCloseBulkUpload}>
            Close
          </Button>,
          <Button
            key="upload"
            type="primary"
            icon={<UploadOutlined />}
            loading={isUploading}
            onClick={handleBulkUpload}
            disabled={!uploadFile}
          >
            Upload
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Download the Excel template using the button below</li>
              <li>Fill in user details following the template format</li>
              <li>Save the file and upload it using the upload button</li>
              <li>Review any validation errors and fix them if needed</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange({ file: e.target.files[0] })}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            {uploadFile && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {isUploading && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {uploadProgress < 100 ? 'Uploading file...' : 'Processing users...'}
                </span>
                <span className="text-sm text-gray-600">
                  {uploadProgress < 100 ? `${uploadProgress}%` : ''}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${uploadProgress >= 100 ? 'animate-pulse bg-blue-400' : 'bg-blue-600'}`}
                  style={{ width: uploadProgress >= 100 ? '100%' : `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadResults && (
            <div className="mt-4">
              <Card
                size="small"
                className={uploadResults.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-lg">
                      {uploadResults.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">
                        {uploadResults.summary?.total || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {uploadResults.summary?.successful || 0}
                      </div>
                      <div className="text-sm text-gray-600">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {uploadResults.summary?.failed || uploadResults.summary?.invalid || 0}
                      </div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-red-700 mb-2">Errors:</h5>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {uploadResults.errors.map((error, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-red-200">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-red-700">
                                Row {error.row}: {error.name || error.email}
                              </span>
                            </div>
                            <ul className="text-sm text-red-600 list-disc list-inside">
                              {Array.isArray(error.errors) ? (
                                error.errors.map((err, i) => <li key={i}>{err}</li>)
                              ) : (
                                <li>{error.error || 'Unknown error'}</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {uploadResults.availableDepartments && uploadResults.availableDepartments.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <h6 className="font-semibold text-blue-900 text-sm mb-1">
                            Available Departments:
                          </h6>
                          <div className="text-sm text-blue-800">
                            {uploadResults.availableDepartments.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadResults.success && uploadResults.users && uploadResults.users.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-green-700">Created Users:</h5>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadCredentials}
                          size="small"
                        >
                          Download Credentials
                        </Button>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-3 text-sm">
                        <span className="font-semibold text-yellow-800">⚠️ Important:</span>
                        <span className="text-yellow-700 ml-2">
                          Download and securely distribute the credentials to users. Passwords are shown below for your reference.
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {uploadResults.users.map((user, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-green-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-base">{user.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Email:</span> {user.email}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Password:</span>{' '}
                                  <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {user.password}
                                  </code>
                                  {user.passwordGenerated && (
                                    <Tag color="orange" className="ml-2" size="small">Auto-Generated</Tag>
                                  )}
                                </div>
                                {user.employeeId && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Employee ID:</span> {user.employeeId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Modal>

      {/* Filter Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <FilterOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Filters
            </span>
            <Badge count={activeFilters.length} showZero={false} />
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 480}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              style={{ flex: 1 }}
            >
              Clear All
            </Button>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApplyFilters}
              style={{ flex: 1 }}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Basic Filters Section */}
          <div>
            <Title level={5} style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              Basic Filters
            </Title>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Status
                </label>
                <Select
                  placeholder="Filter by Status"
                  style={{ width: '100%' }}
                  onChange={(value) => setTempFilters(prev => ({ ...prev, status: value }))}
                  value={tempFilters.status}
                  size="large"
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="">All</Option>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Role
                </label>
                <Select
                  placeholder="Filter by Role"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setTempFilters(prev => ({ ...prev, role: value || '' }))}
                  value={tempFilters.role || undefined}
                  size="large"
                >
                  {availableRoles.map(role => (
                    <Option key={role.value} value={role.value}>
                      {role.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Board
                </label>
                <Select
                  placeholder="Filter by Board"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    setTempFilters(prev => ({
                      ...prev,
                      board_id: value || '',
                      department_id: ''
                    }))
                  }}
                  value={tempFilters.board_id || undefined}
                  size="large"
                >
                  {boards.map(board => (
                    <Option key={board.id} value={board.id}>
                      {board.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Department
                </label>
                <Select
                  placeholder="Filter by Department"
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  onChange={(value) => setTempFilters(prev => ({ ...prev, department_id: value || '' }))}
                  value={tempFilters.department_id || undefined}
                  disabled={tempFilters.board_id && departments.length === 0}
                  size="large"
                  filterOption={(input, option) =>
                    (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Location
                </label>
                <Select
                  placeholder="Filter by Location"
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  onChange={(value) => setTempFilters(prev => ({ ...prev, location_id: value || '' }))}
                  value={tempFilters.location_id || undefined}
                  size="large"
                  optionLabelProp="children"
                  filterOption={(input, option) => {
                    const searchText = input.toLowerCase()
                    const locationName = option?.locationname?.toLowerCase() || ''
                    const building = option?.building?.toLowerCase() || ''
                    const floor = option?.floor?.toLowerCase() || ''
                    return locationName.includes(searchText) ||
                           building.includes(searchText) ||
                           floor.includes(searchText)
                  }}
                >
                  {locations.map(loc => {
                    const buildingFloor = [
                      loc.building ? `Building: ${loc.building}` : '',
                      loc.floor ? `Floor: ${loc.floor}` : ''
                    ].filter(Boolean).join(' • ')

                    return (
                      <Option
                        key={loc.id}
                        value={loc.id}
                        locationname={loc.name}
                        building={loc.building || ''}
                        floor={loc.floor || ''}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${loc.name}${buildingFloor ? ` (${buildingFloor})` : ''}`}>
                          <span style={{ fontWeight: 500 }}>{loc.name}</span>
                          {buildingFloor && (
                            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                              ({buildingFloor})
                            </span>
                          )}
                        </div>
                      </Option>
                    )
                  })}
                </Select>
              </div>
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Advanced Filters Section */}
          <div>
            <Title level={5} style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              Advanced Filters
            </Title>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                  Employee ID
                </label>
                <Input
                  placeholder="Search by Employee ID"
                  allowClear
                  value={tempFilters.employeeId}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, employeeId: e.target.value }))}
                  size="large"
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                />
              </div>
            </Space>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Filter Summary */}
          <div>
            <Title level={5} style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
              Active Filters ({activeFilters.length})
            </Title>
            {activeFilters.length > 0 ? (
              <Space wrap size={[8, 8]}>
                {activeFilters.map(filter => (
                  <Tag key={filter.key} color="blue" style={{ fontSize: 12, padding: '4px 8px' }}>
                    {filter.label}
                  </Tag>
                ))}
              </Space>
            ) : (
              <div style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>
                No filters applied
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default Users
