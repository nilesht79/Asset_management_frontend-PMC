import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Dropdown,
  Row,
  Col,
  Statistic,
  Typography,
  Badge,
  Tooltip,
  message,
  Progress,
  Divider,
  Avatar,
  Collapse,
  Drawer,
  DatePicker,
  Tabs,
  Alert
} from 'antd'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  MoreOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  TagOutlined,
  FileTextOutlined,
  EyeOutlined,
  SettingOutlined,
  BankOutlined,
  ApiOutlined,
  MinusCircleOutlined,
  QrcodeOutlined,
  HistoryOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { Pie } from '@ant-design/plots'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchAssets,
  fetchAssetStatistics,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  fetchAssetsDropdown,
  clearAssetError,
  setAssetFilters,
  clearAssetFilters,
  setAssetPagination,
  selectAssets,
  selectAssetStatistics,
  selectAssetFilters,
  selectAssetAssignment,
  selectAssetsDropdown
} from '../../../store/slices/assetSlice'
import assetService from '../../../services/asset'
import userService from '../../../services/user'
import {
  fetchOEMs,
  fetchProducts,
  fetchCategories,
  fetchProductSubCategories,
  fetchBoards,
  fetchVendors,
  selectOEMs,
  selectProducts,
  selectCategories,
  selectProductSubCategories,
  selectBoards
} from '../../../store/slices/masterSlice'
import {
  fetchLocations,
  selectLocations
} from '../../../store/slices/masterSlice'
import {
  fetchUsers,
  selectUsers
} from '../../../store/slices/userSlice'
import BulkAddAssetsModal from './BulkAddAssetsModal'
import LegacyImportModal from './LegacyImportModal'
import ComponentManager from './components/ComponentManager'
import AssetSoftwareView from './AssetSoftwareView'
import AssetLabelPreview from './AssetLabelPreview'
import AssetRepairHistory from './AssetRepairHistory'
import licenseService from '../../../services/license'
import { formatDateOnly } from '../../../utils/dateUtils'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const AssetInventory = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [departments, setDepartments] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isDeletedModalVisible, setIsDeletedModalVisible] = useState(false)
  const [deletedAssets, setDeletedAssets] = useState([])
  const [deletedAssetsLoading, setDeletedAssetsLoading] = useState(false)
  const [form] = Form.useForm()
  const [labelPreviewVisible, setLabelPreviewVisible] = useState(false)
  const [labelAssetId, setLabelAssetId] = useState(null)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [editingAsset, setEditingAsset] = useState(null)
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [assigningAsset, setAssigningAsset] = useState(null)
  const [assignForm] = Form.useForm()
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false)
  const [viewingAsset, setViewingAsset] = useState(null)
  const [bulkAddModalVisible, setBulkAddModalVisible] = useState(false)
  const [legacyImportModalVisible, setLegacyImportModalVisible] = useState(false)
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [componentDrawerVisible, setComponentDrawerVisible] = useState(false)
  const [managingComponentsAsset, setManagingComponentsAsset] = useState(null)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: '',
    condition_status: '',
    location_id: '',
    assigned_to: '',
    employee_code: '',
    product_id: '',
    category_id: '',
    subcategory_id: '',
    oem_id: '',
    board_id: '',
    serial_number: ''
  })
  const [serialNumberOptions, setSerialNumberOptions] = useState([])
  const [serialNumberSearching, setSerialNumberSearching] = useState(false)
  const [softwareProducts, setSoftwareProducts] = useState([])
  const [softwareLoading, setSoftwareLoading] = useState(false)
  const [productLicenses, setProductLicenses] = useState({}) // Map of productId -> available licenses

  // Redux selectors
  const assets = useSelector(selectAssets)
  const statistics = useSelector(selectAssetStatistics)
  const filters = useSelector(selectAssetFilters)
  const assignment = useSelector(selectAssetAssignment)
  const dropdown = useSelector(selectAssetsDropdown)

  // Master data selectors
  const oems = useSelector(selectOEMs)
  const products = useSelector(selectProducts)
  const categories = useSelector(selectCategories)
  const subcategories = useSelector(selectProductSubCategories)
  // const locations = useSelector(selectLocations)
  const locationsData = useSelector(selectLocations)
  const locations = locationsData?.data || []
  const users = useSelector(selectUsers)
  const boards = useSelector(selectBoards)
  const vendors = useSelector(state => state.master.vendors)

  // Load initial data
  useEffect(() => {
    // Check for search query parameter from URL
    const searchParams = new URLSearchParams(location.search)
    const searchQuery = searchParams.get('search')

    // Fetch assets with search param if present
    if (searchQuery) {
      dispatch(setAssetFilters({ search: searchQuery }))
      dispatch(fetchAssets({ page: 1, limit: 10, search: searchQuery }))
      setTempFilters(prev => ({ ...prev, search: searchQuery }))
    } else {
      dispatch(fetchAssets({ page: 1, limit: 10 }))
    }
    dispatch(fetchAssetStatistics())

    // Fetch master data for dropdowns with high limit to get all items
    dispatch(fetchBoards({ limit: 1000 }))
    dispatch(fetchOEMs({ limit: 1000 }))
    dispatch(fetchVendors({ limit: 1000 }))
    dispatch(fetchProducts({ limit: 1000 }))
    dispatch(fetchCategories({ limit: 1000, include_subcategories: 'true' }))
    dispatch(fetchProductSubCategories({ limit: 1000 }))
    dispatch(fetchLocations({ limit: 1000 }))
    dispatch(fetchUsers())
  }, [dispatch, location.search])

  // Filter software products from all products
  useEffect(() => {
    if (products.data && categories.data) {
      // Find Software category ID (case-insensitive, top-level category only)
      const softwareCategory = categories.data.find(cat =>
        cat.name?.toLowerCase() === 'software' && !cat.parent_category_id
      )
      if (softwareCategory) {
        // Get all software subcategory IDs
        const softwareCategoryIds = [softwareCategory.id]
        categories.data.forEach(cat => {
          if (cat.parent_category_id === softwareCategory.id) {
            softwareCategoryIds.push(cat.id)
          }
        })

        // Filter products that belong to Software category or its subcategories
        const softwareProds = products.data.filter(product =>
          softwareCategoryIds.includes(product.category_id)
        )
        setSoftwareProducts(softwareProds)
      } else {
        setSoftwareProducts([])
      }
    }
  }, [products.data, categories.data])

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearAssetError())
    }
  }, [])

     useEffect(() => {
      fetchDepartments()
    }, [filters.board_id])



  // Helper function to get status colors
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    const colors = {
      'free': '#52c41a',
      'assigned': '#1890ff',
      'under_repair': '#faad14',
      'under repair': '#faad14',
      'discarded': '#f5222d',
      'disposed': '#f5222d',
      'in_use': '#1890ff',
      'available': '#52c41a',
      'maintenance': '#faad14'
    }
    return colors[statusLower] || '#8c8c8c'
  }

  // Generate location distribution from statistics
  const locationDistribution = statistics.data?.locationDistribution ?
    statistics.data.locationDistribution.map((item, index) => ({
      location: item.location_name,
      building: item.building,
      floor: item.floor,
      count: item.asset_count || 0,
      color: `hsl(${index * 60}, 70%, 50%)`
    })) : []

  // Generate status distribution from statistics
  const statusDistribution = statistics.data?.statusDistribution ?
    statistics.data.statusDistribution.map(item => ({
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
      count: item.count,
      color: getStatusColor(item.status)
    })) : []

  // Critical alerts from statistics
  const criticalAlerts = statistics.data?.criticalAlerts || []

  const showAddModal = () => {
    setEditingAsset(null)
    setIsAddModalVisible(true)
    form.resetFields()
    // Fetch assets dropdown for parent asset selection
    dispatch(fetchAssetsDropdown())
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




  const showEditModal = async (asset) => {
    setEditingAsset(asset)
    setIsAddModalVisible(true)

    // Fetch software installations for this asset
    let softwareInstallations = []
    try {
      const response = await assetService.getAssetSoftware(asset.id)
      const softwareData = response.data?.success ? response.data.data : (response.data || [])

      if (softwareData && softwareData.length > 0) {
        // Transform software data to form format
        softwareInstallations = softwareData.map(software => ({
          software_product_id: software.software_product_id,
          software_type: software.software_type,
          license_key: software.license_key,
          license_id: software.license_id,
          installation_date: software.installation_date ? dayjs(software.installation_date) : null,
          notes: software.notes
        }))

        // Pre-fetch licenses for each software product - include the currently assigned license
        const licensePromises = softwareData
          .filter(software => software.software_product_id)
          .map(software => fetchLicensesForProduct(software.software_product_id, software.license_id))
        await Promise.all(licensePromises)
      }
    } catch (error) {
      console.error('Error fetching software installations:', error)
      message.warning('Could not load software installations for this asset')
    }

    form.setFieldsValue({
      serial_number: asset.serial_number,
      asset_tag: asset.asset_tag,
      product_id: asset.product_id,
      assigned_to: asset.assigned_to,
      status: asset.status,
      importance: asset.importance || 'medium',
      condition_status: asset.condition_status,
      asset_type: asset.asset_type || 'standalone',
      parent_asset_id: asset.parent_asset_id,
      installation_notes: asset.installation_notes,
      purchase_date: asset.purchase_date,
      warranty_start_date: asset.warranty_start_date ? dayjs(asset.warranty_start_date) : null,
      warranty_end_date: asset.warranty_end_date ? dayjs(asset.warranty_end_date) : null,
      eol_date: asset.eol_date ? dayjs(asset.eol_date) : null,
      eos_date: asset.eos_date ? dayjs(asset.eos_date) : null,
      vendor_id: asset.vendor_id,
      invoice_number: asset.invoice_number,
      purchase_cost: asset.purchase_cost,
      notes: asset.notes,
      department_id: asset.department_id,
      location_id: asset.location_id,
      software_installations: softwareInstallations
    })
  }

  const handleSubmit = async (values) => {
    try {
      // Validate: Components cannot be assigned to users
      if (values.asset_type === 'component' && values.assigned_to) {
        message.error('Components cannot be assigned to users. Please remove the assignment or change asset type.')
        return
      }

      // Note: Components can be spare stock without parent_asset_id
      // parent_asset_id is optional for spare/stock components

      // Format dates to YYYY-MM-DD for API
      const formattedValues = { ...values }

            formattedValues.location_id = values.location_id || null
      formattedValues.department_id = values.department_id || null

       console.log('UPDATE PAYLOAD:', formattedValues)

       // ✅ FIX INVALID VALUES
    if (formattedValues.asset_type === 'parent') {
      formattedValues.asset_type = 'standalone'
    }

    // ✅ Ensure notes is not null
    // if (formattedValues.notes === null) {
    //   formattedValues.notes = ''
    // }

    // ✅ Ensure vendor_id is string
    if (formattedValues.vendor_id) {
      formattedValues.vendor_id = String(formattedValues.vendor_id)
    }

    // ✅ Ensure purchase_cost is number
    if (formattedValues.purchase_cost) {
      formattedValues.purchase_cost = Number(formattedValues.purchase_cost)
    }



      // Ensure UUID fields are strings (not arrays) - fix for form caching issues
      const uuidFields = ['vendor_id', 'product_id', 'assigned_to', 'parent_asset_id']
      uuidFields.forEach(field => {
        if (formattedValues[field]) {
          // If it's an array, take the first value
          if (Array.isArray(formattedValues[field])) {
            formattedValues[field] = formattedValues[field][0] || null
          }
          // Ensure it's a string
          if (formattedValues[field] && typeof formattedValues[field] !== 'string') {
            formattedValues[field] = String(formattedValues[field])
          }
        }
      })

      // Format warranty and lifecycle dates
      if (formattedValues.warranty_start_date) {
        formattedValues.warranty_start_date = formattedValues.warranty_start_date.format('YYYY-MM-DD')
      }
      if (formattedValues.warranty_end_date) {
        formattedValues.warranty_end_date = formattedValues.warranty_end_date.format('YYYY-MM-DD')
      }
      if (formattedValues.eol_date) {
        formattedValues.eol_date = formattedValues.eol_date.format('YYYY-MM-DD')
      }
      if (formattedValues.eos_date) {
        formattedValues.eos_date = formattedValues.eos_date.format('YYYY-MM-DD')
      }

      // Format software installation dates and validate installation dates
      if (formattedValues.software_installations && formattedValues.software_installations.length > 0) {
        // Validate installation dates against license pool expiration dates
        for (const software of formattedValues.software_installations) {
          if (software.license_id && software.installation_date) {
            const licensePool = productLicenses[software.software_product_id]?.find(l => l.id === software.license_id)
            if (licensePool?.expiration_date) {
              const installationDate = software.installation_date.format ? software.installation_date : dayjs(software.installation_date)
              const licenseExpDate = dayjs(licensePool.expiration_date)
              if (installationDate.isAfter(licenseExpDate)) {
                message.error(`Installation date cannot be after license pool expiration date (${licenseExpDate.format('YYYY-MM-DD')})`)
                return
              }
            }
          }
        }

        formattedValues.software_installations = formattedValues.software_installations.map(software => ({
          ...software,
          // Ensure license_id is a string
          license_id: software.license_id ? (Array.isArray(software.license_id) ? software.license_id[0] : software.license_id) : null,
          software_product_id: software.software_product_id ? (Array.isArray(software.software_product_id) ? software.software_product_id[0] : software.software_product_id) : null,
          installation_date: software.installation_date ? (software.installation_date.format ? software.installation_date.format('YYYY-MM-DD') : software.installation_date) : null
        }))
      }

      if (editingAsset) {
        await dispatch(updateAsset({ id: editingAsset.id, data: formattedValues })).unwrap()
        message.success('Asset updated successfully')
        // Refresh assets and statistics to show updated data
        dispatch(fetchAssets({ page: assets.pagination?.page || 1, limit: assets.pagination?.pageSize || 10 }))
        dispatch(fetchAssetStatistics())
      } else {
        await dispatch(createAsset(formattedValues)).unwrap()
        message.success('Asset created successfully')
        // Refresh assets and statistics to show new asset
        dispatch(fetchAssets({ page: assets.pagination?.page || 1, limit: assets.pagination?.pageSize || 10 }))
        dispatch(fetchAssetStatistics())
      }
      setIsAddModalVisible(false)
      form.resetFields()
      setEditingAsset(null)
    } catch (error) {
      message.error(error.message || 'Operation failed')
    }
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this asset?',
      content: (
        <div>
          <p>Asset: <strong>{record.asset_tag}</strong></p>
          <p>Product: <strong>{record.product_name}</strong></p>
          <p className="text-red-500 mt-2">⚠️ This action will soft delete the asset. You can restore it later if needed.</p>
        </div>
      ),
      icon: <DeleteOutlined className="text-red-500" />,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteAsset(record.id)).unwrap()
          message.success('Asset deleted successfully')
        } catch (error) {
          message.error(error.message || 'Failed to delete asset')
        }
      }
    })
  }

  const showViewDetailsModal = (asset) => {
    setViewingAsset(asset)
    setViewDetailsModalVisible(true)
  }

  const showAssignModal = (asset) => {
    setAssigningAsset(asset)
    setAssignModalVisible(true)
    assignForm.setFieldsValue({
      user_id: asset.assigned_to || undefined,
      location_id: asset.location_id || undefined
    })
  }

  const handleTagAsset = (asset) => {
    message.info(`Tag functionality for ${asset.asset_tag} - Coming soon!`)
  }

  const handleAssetSettings = (asset) => {
    message.info(`Settings for ${asset.asset_tag} - Coming soon!`)
  }

  const handleManageComponents = (asset) => {
    setManagingComponentsAsset(asset)
    setComponentDrawerVisible(true)
  }

  const handleGenerateLabel = (asset) => {
    setLabelAssetId(asset.id)
    setLabelPreviewVisible(true)
  }

  const handleBulkLabelGeneration = async (assetIds, filename) => {
    setBulkGenerating(true)
    try {
      const response = await assetService.downloadBulkLabels(assetIds)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success(`Successfully generated ${assetIds.length} label(s)`)
    } catch (error) {
      console.error('Error generating bulk labels:', error)
      message.error(error.message || 'Failed to generate labels')
    } finally {
      setBulkGenerating(false)
    }
  }

  const handleGenerateSelectedLabels = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one asset')
      return
    }

    Modal.confirm({
      title: 'Generate Labels',
      content: `Are you sure you want to generate labels for ${selectedRowKeys.length} selected asset(s)?`,
      icon: <QrcodeOutlined className="text-blue-500" />,
      okText: 'Generate',
      onOk: () => {
        handleBulkLabelGeneration(
          selectedRowKeys,
          `asset-labels-selected-${Date.now()}.pdf`
        )
      }
    })
  }

  const handleGenerateAllLabels = () => {
    const totalAssets = assets.pagination?.total || 0

    if (totalAssets === 0) {
      message.warning('No assets available to generate labels')
      return
    }

    if (totalAssets > 2000) {
      message.error('Too many assets. Please apply filters to reduce the count below 2000.')
      return
    }

    Modal.confirm({
      title: 'Generate All Labels',
      content: (
        <div>
          <p>Are you sure you want to generate labels for all {totalAssets} asset(s)?</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments depending on the number of assets.</p>
        </div>
      ),
      icon: <QrcodeOutlined className="text-blue-500" />,
      okText: 'Generate',
      onOk: async () => {
        setBulkGenerating(true)
        try {
          const response = await assetService.downloadAllLabels(filters)
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `asset-labels-all-${Date.now()}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          message.success(`Successfully generated ${totalAssets} label(s)`)
        } catch (error) {
          console.error('Error generating all labels:', error)
          message.error(error.message || 'Failed to generate labels')
        } finally {
          setBulkGenerating(false)
        }
      }
    })
  }

  const handleAssignAsset = async (values) => {
    try {
      await dispatch(assignAsset({ id: assigningAsset.id, data: values })).unwrap()
      message.success('Asset assigned successfully')
      setAssignModalVisible(false)
      assignForm.resetFields()
      setAssigningAsset(null)
      // Refresh assets and statistics
      dispatch(fetchAssets({ page: assets.pagination?.page || 1, limit: assets.pagination?.pageSize || 10 }))
      dispatch(fetchAssetStatistics())
    } catch (error) {
      message.error(error.message || 'Failed to assign asset')
    }
  }

  const handleUnassignAsset = (asset) => {
    Modal.confirm({
      title: 'Unassign Asset',
      content: (
        <div>
          <p>Are you sure you want to unassign this asset?</p>
          <p>Asset: <strong>{asset.asset_tag}</strong></p>
          {asset.assigned_user_name && (
            <p>Currently assigned to: <strong>{asset.assigned_user_name}</strong></p>
          )}
          <p className="text-gray-500 mt-2">The asset will be marked as available.</p>
        </div>
      ),
      icon: <UserOutlined className="text-blue-500" />,
      okText: 'Yes, Unassign',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(unassignAsset(asset.id)).unwrap()
          message.success('Asset unassigned successfully')
          // Refresh assets and statistics
          dispatch(fetchAssets({ page: assets.pagination?.page || 1, limit: assets.pagination?.pageSize || 10 }))
          dispatch(fetchAssetStatistics())
        } catch (error) {
          message.error(error.message || 'Failed to unassign asset')
        }
      }
    })
  }

  const handleSearch = (value) => {
    dispatch(setAssetFilters({ ...filters, search: value }))
    dispatch(fetchAssets({ ...filters, search: value, page: 1 }))
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    dispatch(setAssetFilters(newFilters))
    dispatch(fetchAssets({ ...newFilters, page: 1 }))
  }

  const handleTableChange = (pagination) => {
    const { current: page, pageSize } = pagination
    dispatch(setAssetPagination({ page, pageSize }))

    // Refetch with new pagination
    dispatch(fetchAssets({
      page,
      limit: pageSize,
      ...filters
    }))
  }

  const handleExport = async (exportAll = false) => {
    try {
      // Call service directly to avoid storing blob in Redux state
      // If exportAll is true, pass empty filters to get all assets
      const exportFilters = exportAll ? {} : filters
      const response = await assetService.exportAssets(exportFilters)

      // Create blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const exportType = exportAll ? 'all' : 'filtered'
      link.download = `assets_export_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success(`Export completed successfully${exportAll ? ' (All Assets)' : ''}`)
    } catch (error) {
      message.error(error.message || 'Failed to export assets')
    }
  }

  const handleCancel = () => {
    setIsAddModalVisible(false)
    form.resetFields()
    setEditingAsset(null)
  }

  // Filter drawer handlers
  const showFilterDrawer = () => {
    setTempFilters({
      search: filters?.search || '',
      status: filters?.status || '',
      condition_status: filters?.condition_status || '',
      location_id: filters?.location_id || '',
      assigned_to: filters?.assigned_to || '',
      employee_code: filters?.employee_code || '',
      product_id: filters?.product_id || '',
      category_id: filters?.category_id || '',
      oem_id: filters?.oem_id || '',
      board_id: filters?.board_id || '',
      serial_number: filters?.serial_number || ''
    })
    setFilterDrawerVisible(true)
  }

  const handleApplyFilters = () => {
    dispatch(setAssetFilters(tempFilters))
    dispatch(fetchAssets({ ...tempFilters, page: 1 }))
    setFilterDrawerVisible(false)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      condition_status: '',
      location_id: '',
      assigned_to: '',
      employee_code: '',
      product_id: '',
      category_id: '',
      subcategory_id: '',
      oem_id: '',
      board_id: '',
      serial_number: ''
    }
    setTempFilters(clearedFilters)
    dispatch(setAssetFilters(clearedFilters))
    dispatch(fetchAssets({ page: 1, limit: assets.pagination?.limit || 10 }))
    setFilterDrawerVisible(false)
  }

  const handleTempFilterChange = (key, value) => {
    setTempFilters({ ...tempFilters, [key]: value })
  }

  const handleFilterDrawerClose = () => {
    setFilterDrawerVisible(false)
    // Reset tempFilters to current applied filters when closing without applying
    setTempFilters({
      search: filters?.search || '',
      status: filters?.status || '',
      condition_status: filters?.condition_status || '',
      location_id: filters?.location_id || '',
      assigned_to: filters?.assigned_to || '',
      employee_code: filters?.employee_code || '',
      product_id: filters?.product_id || '',
      category_id: filters?.category_id || '',
      oem_id: filters?.oem_id || '',
      board_id: filters?.board_id || '',
      serial_number: filters?.serial_number || ''
    })
  }

  // Fetch available licenses for a software product
  // includeLicenseId: optional - include a specific license even if fully allocated (for editing)
  const fetchLicensesForProduct = async (productId, includeLicenseId = null) => {
    if (!productId) return []

    // When editing with a specific license, always fetch fresh to include that license
    const cacheKey = includeLicenseId ? `${productId}_${includeLicenseId}` : productId

    // Check if we already have licenses for this product cached
    if (!includeLicenseId && productLicenses[productId]) return productLicenses[productId]

    try {
      const response = await licenseService.getLicensesForProduct(productId, includeLicenseId)
      if (response.data?.success && response.data?.data) {
        const licenses = response.data.data
        setProductLicenses(prev => ({
          ...prev,
          [productId]: licenses
        }))
        return licenses
      }
    } catch (error) {
      console.error('Error fetching licenses for product:', error)
    }
    return []
  }

  // Handle software product selection - fetch available licenses and auto-populate software_type
  const handleSoftwareProductChange = (productId, fieldIndex) => {
    if (productId) {
      fetchLicensesForProduct(productId)
      // Find the selected product to get its software_type
      const selectedProduct = softwareProducts.find(p => p.id === productId)
      // Update the form with cleared license and auto-populated software_type
      const softwareInstallations = form.getFieldValue('software_installations') || []
      if (softwareInstallations[fieldIndex]) {
        softwareInstallations[fieldIndex].license_id = undefined
        // Auto-populate software_type from the product
        softwareInstallations[fieldIndex].software_type = selectedProduct?.software_type || 'application'
        form.setFieldsValue({ software_installations: softwareInstallations })
      }
    }
  }

  // Fetch serial numbers for autocomplete based on search
  const handleSerialNumberSearch = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSerialNumberOptions([])
      setSerialNumberSearching(false)
      return
    }

    setSerialNumberSearching(true)

    try {
      // Fetch assets matching the search text
      const response = await assetService.getAssets({
        search: searchText,
        limit: 100 // Limit to 100 results for performance
      })

      console.log('Serial number search response:', response.data)

      // Extract unique serial numbers that match the search
      const serialNumbers = response.data?.data?.assets
        ?.filter(asset => {
          if (!asset.serial_number) return false
          const serialLower = asset.serial_number.toLowerCase()
          const searchLower = searchText.toLowerCase()
          return serialLower.includes(searchLower)
        })
        .map(asset => ({
          value: asset.serial_number,
          label: `${asset.serial_number} (${asset.product_name || 'Unknown'})`
        })) || []

      console.log('Extracted serial numbers:', serialNumbers)

      // Remove duplicates based on value
      const uniqueSerialNumbers = Array.from(
        new Map(serialNumbers.map(item => [item.value, item])).values()
      )

      console.log('Unique serial numbers:', uniqueSerialNumbers)
      setSerialNumberOptions(uniqueSerialNumbers)
    } catch (error) {
      console.error('Error fetching serial numbers:', error)
      setSerialNumberOptions([])
    } finally {
      setSerialNumberSearching(false)
    }
  }

  // Fetch deleted assets
  const fetchDeletedAssets = async () => {
    setDeletedAssetsLoading(true)
    try {
      const response = await assetService.getDeletedAssets({ page: 1, limit: 100 })

      // API returns: { success, data: { assets, pagination }, message }
      const assets = response.data?.data?.assets || []
      setDeletedAssets(assets)

      if (assets.length === 0) {
        message.info('No deleted assets found')
      } else {
        message.success(`Found ${assets.length} deleted assets`)
      }
    } catch (error) {
      console.error('Error fetching deleted assets:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch deleted assets'
      message.error(errorMessage)
    } finally {
      setDeletedAssetsLoading(false)
    }
  }

  // Show deleted assets modal
  const showDeletedAssetsModal = () => {
    setIsDeletedModalVisible(true)
    fetchDeletedAssets()
  }

  // Restore asset
  const handleRestoreAsset = (asset) => {
    Modal.confirm({
      title: 'Restore Asset',
      content: (
        <div>
          <p>Are you sure you want to restore this asset?</p>
          <p>Asset: <strong>{asset.asset_tag}</strong></p>
          <p>Product: <strong>{asset.product_name}</strong></p>
        </div>
      ),
      icon: <CheckCircleOutlined className="text-green-500" />,
      okText: 'Yes, Restore',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await assetService.restoreAsset(asset.id)
          message.success('Asset restored successfully')
          fetchDeletedAssets() // Refresh deleted assets list
          dispatch(fetchAssets({ page: 1, limit: 10 })) // Refresh main assets list
          dispatch(fetchAssetStatistics()) // Refresh statistics
        } catch (error) {
          message.error(error.message || 'Failed to restore asset')
        }
      }
    })
  }

  // Status Pie Chart Component - Responsive
  const StatusPieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0)
    if (total === 0) {
      return (
        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
          <div className="text-center text-gray-500 text-xs sm:text-sm">No data</div>
        </div>
      )
    }

    let cumulativePercentage = 0
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const radius = isMobile ? 50 : 60
    const strokeWidth = isMobile ? 16 : 20
    const svgSize = isMobile ? 128 : 160
    const center = svgSize / 2

    return (
      <div className={`relative ${isMobile ? 'w-32 h-32' : 'w-40 h-40'} mx-auto`}>
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          {data.map((item, index) => {
            const percentage = (item.count / total) * 100
            const circumference = 2 * Math.PI * radius
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference)

            const result = (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            )

            cumulativePercentage += percentage
            return result
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
    )
  }

  // Location Pie Chart Component - Responsive
  const LocationPieChart = ({ data }) => {
    if (data.length === 0) {
      return (
        <div className="text-center text-gray-500 py-6 sm:py-8">
          <InfoCircleOutlined className="text-xl sm:text-2xl mb-2" />
          <div className="text-xs sm:text-sm">No location data available</div>
        </div>
      )
    }

    const total = data.reduce((sum, item) => sum + item.count, 0)

    const chartData = data.map(item => ({
      location: item.location || 'Unknown',
      building: item.building || null,
      floor: item.floor || null,
      value: item.count || 0,
      color: item.color || '#d9d9d9'
    })).filter(item => item.value > 0)

    const config = {
      data: chartData,
      angleField: 'value',
      colorField: 'location',
      radius: 1.1,
      innerRadius: 0.75,
      height: typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 320,
      label: false,
      appendPadding: [0, 0, 10, 0],
      meta: {
        location: {
          alias: 'Location',
        },
        value: {
          alias: 'Assets',
          formatter: (val) => `${val}`,
        },
      },
      interactions: [{ type: 'element-active' }],
      legend: {
        position: 'bottom',
        layout: 'horizontal',
        itemName: {
          style: {
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 11,
          },
        },
        maxRow: 3,
      },
      statistic: {
        title: {
          style: {
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '12px' : '14px',
            color: '#999',
          },
          content: 'Total Assets',
        },
        content: {
          style: {
            fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '18px' : '20px',
            fontWeight: 'bold',
          },
          content: total.toString(),
        },
      },
      color: data.map(item => item.color),
    }

    return (
      <div style={{ height: typeof window !== 'undefined' && window.innerWidth < 640 ? '300px' : '340px' }}>
        <Pie {...config} />
      </div>
    )
  }

  // Status Overview Pie Chart Configuration
  const statusChartData = statusDistribution.map(item => ({
    type: item.status,
    value: item.count
  }))

  const statusChartConfig = {
    data: statusChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.5,
    legend: {
      position: 'bottom',
      itemName: {
        style: {
          fontSize: 12,
        },
      },
    },
    statistic: {
      title: false,
      content: {
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
        },
        content: statusDistribution.reduce((sum, item) => sum + item.count, 0).toString(),
      },
    },
    color: statusDistribution.map(item => item.color),
  }

  // Table columns matching the design
  const columns = [
    {
      title: <span className="font-semibold text-gray-700">#</span>,
      key: 'srno',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => (
        <span className="text-gray-600 font-medium">
          {(assets.pagination?.page - 1) * assets.pagination?.limit + index + 1}
        </span>
      )
    },
    {
      title: <span className="font-semibold text-gray-700">Product</span>,
      key: 'name',
      width: 100,
      render: (_, record) => (
        <div className="py-1">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-semibold text-gray-800 text-sm">{record.product_name || 'N/A'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{record.product_model || 'No model'}</div>
            </div>
            {record.installed_component_count > 0 && (
              <Tooltip title={`${record.installed_component_count} component${record.installed_component_count !== 1 ? 's' : ''} installed`}>
                <Badge
                  count={record.installed_component_count}
                  style={{ backgroundColor: '#52c41a' }}
                  size="small"
                />
              </Tooltip>
            )}
          </div>
        </div>
      )
    },
    {
      title: <span className="font-semibold text-gray-700">Assigned To</span>,
      key: 'assigned_to',
      width: 180,
      render: (_, record) => {
        if (record.assigned_user_name) {
          return (
            <div className="py-1">
              <div className="font-medium text-gray-800 text-sm flex items-center">
                <UserOutlined className="mr-1.5 text-blue-500" />
                {record.assigned_user_name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 ml-5">{record.assigned_user_email || ''}</div>
            </div>
          )
        }
        return (
          <span className="text-gray-400 italic flex items-center">
            <UserOutlined className="mr-1.5" />
            Unassigned
          </span>
        )
      }
    },
    {
      title: <span className="font-semibold text-gray-700">Employee Code</span>,
      dataIndex: 'assigned_employee_code',
      key: 'assigned_employee_code',
      width: 120,
      render: (code) => code ? (
        <span className="font-mono text-xs bg-green-50 px-2 py-1 rounded text-green-700">
          {code}
        </span>
      ) : <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Serial No</span>,
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 130,
      render: (serial) => serial ? <span className="font-mono text-xs text-gray-700">{serial}</span> : <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Category</span>,
      dataIndex: 'category_name',
      key: 'category',
      width: 120,
      render: (text) => text ? <Tag color="purple" className="text-xs">{text}</Tag> : <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Sub-Category</span>,
      dataIndex: 'subcategory_name',
      key: 'subcategory',
      width: 130,
      render: (text) => text ? <Tag color="geekblue" className="text-xs">{text}</Tag> : <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Department</span>,
      dataIndex: 'department',
      key: 'department',
      width: 130,
      render: (department) => department || <span className="text-gray-400 italic">Unassigned</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Location</span>,
      dataIndex: 'location_name',
      key: 'location',
      width: 150,
      render: (text) => <span className="text-gray-700">{text}</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Floor</span>,
      dataIndex: 'location_floor',
      key: 'floor',
      width: 80,
      render: (text) => text || <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Address</span>,
      dataIndex: 'location_address',
      key: 'address',
      width: 150,
      ellipsis: true,
      render: (text) => text ? <Tooltip title={text}><span className="text-gray-600 text-xs">{text}</span></Tooltip> : <span className="text-gray-400">—</span>
    },
    // {
    //   title: <span className="font-semibold text-gray-700">Tag No</span>,
    //   dataIndex: 'tag_no',
    //   key: 'tag_no',
    //   width: 100,
    //   render: (tagNo) => tagNo ? <span className="font-mono text-xs">{tagNo}</span> : <span className="text-gray-400">—</span>
    // },
    {
      title: <span className="font-semibold text-gray-700">Notes</span>,
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      render: (notes) => notes ? <span className="font-mono text-xs">{notes}</span> : <span className="text-gray-400">—</span>
    },
    {
      title: <span className="font-semibold text-gray-700">Status</span>,
      key: 'status',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const statusConfig = {
          available: { color: 'green', label: 'Available' },
          assigned: { color: 'blue', label: 'Assigned' },
          in_transit: { color: 'orange', label: 'In Transit' },
          in_use: { color: 'cyan', label: 'In Use' },
          under_repair: { color: 'red', label: 'Under Repair' },
          retired: { color: 'default', label: 'Retired' },
          lost: { color: 'volcano', label: 'Lost' },
          damaged: { color: 'magenta', label: 'Damaged' }
        };

        const config = statusConfig[record.status] || { color: 'default', label: record.status };

        return (
          <Tag
            color={config.color}
            className="font-medium"
            style={{ minWidth: '80px', textAlign: 'center' }}
          >
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: <span className="font-semibold text-gray-700">Actions</span>,
      key: 'action',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const isAssigned = record.assigned_to

        return (
          <div className="flex items-center justify-center">
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'view',
                    label: 'View Details',
                    icon: <EyeOutlined />,
                    onClick: () => showViewDetailsModal(record)
                  },
                  ...(record.asset_type !== 'component' ? [{
                    key: 'components',
                    label: 'Manage Components',
                    icon: <ApiOutlined />,
                    onClick: () => handleManageComponents(record)
                  }] : []),
                  {
                    key: 'edit',
                    label: 'Edit Asset',
                    icon: <EditOutlined />,
                    onClick: () => showEditModal(record)
                  },
                  {
                    key: 'settings',
                    label: 'Settings',
                    icon: <SettingOutlined />,
                    onClick: () => handleAssetSettings(record)
                  },
                  {
                    key: 'tag',
                    label: 'Tag Asset',
                    icon: <TagOutlined />,
                    onClick: () => handleTagAsset(record)
                  },
                  {
                    key: 'generate-label',
                    label: 'Generate Label',
                    icon: <QrcodeOutlined />,
                    onClick: () => handleGenerateLabel(record)
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'assign',
                    label: isAssigned ? 'Reassign' : 'Assign',
                    icon: <UserOutlined />,
                    onClick: () => showAssignModal(record)
                  },
                  ...(isAssigned ? [{
                    key: 'unassign',
                    label: 'Unassign / Release',
                    icon: <UserOutlined />,
                    onClick: () => handleUnassignAsset(record)
                  }] : []),
                  {
                    type: 'divider'
                  },
                  {
                    key: 'delete',
                    label: 'Delete Asset',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDelete(record)
                  }
                ]
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className="flex items-center justify-center w-8 h-8"
              />
            </Dropdown>
          </div>
        )
      }
    }
  ]

  // Asset Location Map Component
  const AssetLocationMap = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedLocations, setExpandedLocations] = useState([])
    const [expandedBuildings, setExpandedBuildings] = useState([])

    // Group by Location → Building → Floor hierarchy
    const locationGroups = data.reduce((acc, item) => {
      const location = item.location || 'Unspecified Location'
      const building = item.building || 'Unspecified Building'
      const floor = item.floor || 'No Floor Info'

      if (!acc[location]) {
        acc[location] = {}
      }
      if (!acc[location][building]) {
        acc[location][building] = []
      }
      acc[location][building].push(item)
      return acc
    }, {})

    // Filter locations, buildings, and floors based on search
    const filteredLocationGroups = Object.entries(locationGroups).reduce((acc, [location, buildings]) => {
      if (searchTerm) {
        const filteredBuildings = Object.entries(buildings).reduce((buildingAcc, [building, items]) => {
          const filteredItems = items.filter(item =>
            item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.building && item.building.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.floor && item.floor.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          if (filteredItems.length > 0) {
            buildingAcc[building] = filteredItems
          }
          return buildingAcc
        }, {})

        if (Object.keys(filteredBuildings).length > 0) {
          acc[location] = filteredBuildings
        }
      } else {
        acc[location] = buildings
      }
      return acc
    }, {})

    const totalAssets = data.reduce((sum, item) => sum + item.count, 0)
    const filteredTotalAssets = Object.values(filteredLocationGroups)
      .flatMap(buildings => Object.values(buildings))
      .flat()
      .reduce((sum, item) => sum + item.count, 0)

    // Auto-expand first 2 locations and first 2 buildings or all if search active
    useEffect(() => {
      if (searchTerm) {
        setExpandedLocations(Object.keys(filteredLocationGroups))
        const allBuildingKeys = Object.entries(filteredLocationGroups)
          .flatMap(([loc, buildings]) => Object.keys(buildings).map(b => `${loc}|${b}`))
        setExpandedBuildings(allBuildingKeys)
      } else {
        setExpandedLocations(Object.keys(locationGroups).slice(0, 2))
        const firstTwoBuildings = Object.entries(locationGroups)
          .slice(0, 2)
          .flatMap(([loc, buildings]) => Object.keys(buildings).slice(0, 2).map(b => `${loc}|${b}`))
        setExpandedBuildings(firstTwoBuildings)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm])

    const toggleLocation = (location) => {
      setExpandedLocations(prev =>
        prev.includes(location)
          ? prev.filter(l => l !== location)
          : [...prev, location]
      )
    }

    const toggleBuilding = (location, building) => {
      const key = `${location}|${building}`
      setExpandedBuildings(prev =>
        prev.includes(key)
          ? prev.filter(b => b !== key)
          : [...prev, key]
      )
    }

    const expandAll = () => {
      setExpandedLocations(Object.keys(filteredLocationGroups))
      const allBuildingKeys = Object.entries(filteredLocationGroups)
        .flatMap(([loc, buildings]) => Object.keys(buildings).map(b => `${loc}|${b}`))
      setExpandedBuildings(allBuildingKeys)
    }

    const collapseAll = () => {
      setExpandedLocations([])
      setExpandedBuildings([])
    }

    return (
      <div className="p-2 sm:p-4">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Asset Distribution</h3>

          {/* Search and Controls - Responsive */}
          <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
            <Input.Search
              placeholder="Search locations, buildings..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '100%' }}
              size={typeof window !== 'undefined' && window.innerWidth < 640 ? 'middle' : 'large'}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center">
                  <EnvironmentOutlined className="mr-1" />
                  <span className="hidden sm:inline">{Object.keys(filteredLocationGroups).length} Location{Object.keys(filteredLocationGroups).length !== 1 ? 's' : ''}</span>
                  <span className="inline sm:hidden">{Object.keys(filteredLocationGroups).length} Loc</span>
                </span>
                <span className="flex items-center">
                  <TagOutlined className="mr-1" />
                  <span className="hidden sm:inline">{Object.values(filteredLocationGroups).flatMap(b => Object.keys(b)).length} Building{Object.values(filteredLocationGroups).flatMap(b => Object.keys(b)).length !== 1 ? 's' : ''}</span>
                  <span className="inline sm:hidden">{Object.values(filteredLocationGroups).flatMap(b => Object.keys(b)).length} Bldg</span>
                </span>
                <span className="flex items-center font-medium text-blue-600">
                  {searchTerm ? `${filteredTotalAssets} / ` : ''}{totalAssets} Assets
                </span>
              </div>
              <Space size="small">
                <Button size="small" type="link" onClick={expandAll} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Expand All</span>
                  <span className="inline sm:hidden">Expand</span>
                </Button>
                <Button size="small" type="link" onClick={collapseAll} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Collapse All</span>
                  <span className="inline sm:hidden">Collapse</span>
                </Button>
              </Space>
            </div>
          </div>
        </div>

        {/* Location → Building → Floor Hierarchy with Collapse */}
        {Object.keys(filteredLocationGroups).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>No locations found matching "{searchTerm}"</div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredLocationGroups).map(([location, buildings]) => {
              const locationTotal = Object.values(buildings)
                .flat()
                .reduce((sum, item) => sum + item.count, 0)
              const isLocationExpanded = expandedLocations.includes(location)
              const buildingCount = Object.keys(buildings).length

              return (
                <div key={location} className="border-2 border-indigo-200 rounded-lg overflow-hidden shadow-md">
                  {/* Location Header - Top Level */}
                  <div
                    className="bg-gradient-to-r from-indigo-100 to-indigo-200 p-4 cursor-pointer hover:from-indigo-200 hover:to-indigo-300 transition-colors"
                    onClick={() => toggleLocation(location)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <EnvironmentOutlined className="mr-3 text-indigo-700 text-xl" />
                          {location}
                          <span className="ml-3 text-sm font-normal text-gray-600">
                            ({buildingCount} building{buildingCount !== 1 ? 's' : ''})
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-700">{locationTotal}</div>
                          <div className="text-xs text-gray-700">total assets</div>
                        </div>
                        <div className="text-gray-600 text-lg">
                          {isLocationExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buildings under this Location */}
                  {isLocationExpanded && (
                    <div className="bg-white p-3 space-y-3">
                      {Object.entries(buildings).map(([building, items]) => {
                        const buildingTotal = items.reduce((sum, item) => sum + item.count, 0)
                        const buildingKey = `${location}|${building}`
                        const isBuildingExpanded = expandedBuildings.includes(buildingKey)

                        // Group items by floor
                        const floorGroups = items.reduce((acc, item) => {
                          const floor = item.floor || 'No Floor Info'
                          if (!acc[floor]) acc[floor] = []
                          acc[floor].push(item)
                          return acc
                        }, {})

                        return (
                          <div key={buildingKey} className="border border-blue-200 rounded-lg overflow-hidden">
                            {/* Building Header - Second Level */}
                            <div
                              className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-colors"
                              onClick={() => toggleBuilding(location, building)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800 flex items-center">
                                    <BankOutlined className="mr-2 text-blue-600" />
                                    {building}
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                      ({Object.keys(floorGroups).length} floor{Object.keys(floorGroups).length !== 1 ? 's' : ''})
                                    </span>
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600">{buildingTotal}</div>
                                    <div className="text-xs text-gray-600">assets</div>
                                  </div>
                                  <div className="text-gray-400">
                                    {isBuildingExpanded ? '▼' : '▶'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Floors under this Building */}
                            {isBuildingExpanded && (
                              <div className="p-3 bg-gray-50">
                                <Collapse
                                  ghost
                                  defaultActiveKey={Object.keys(floorGroups).slice(0, 2)}
                                  items={Object.entries(floorGroups).map(([floor, floorItems]) => {
                                    const floorTotal = floorItems.reduce((sum, item) => sum + item.count, 0)
                                    return {
                                      key: floor,
                                      label: (
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium text-gray-700">
                                            <TagOutlined className="mr-2" />
                                            Floor: {floor}
                                          </span>
                                          <span className="text-sm font-semibold text-blue-600 mr-2">
                                            {floorTotal} asset{floorTotal !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      ),
                                      children: (
                                        <div className="space-y-1 pl-4">
                                          {floorItems.map((item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex justify-between items-center text-sm p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                                            >
                                              <span className="text-gray-700 font-medium">
                                                {item.location} - {item.building} - {item.floor}
                                              </span>
                                              <Badge
                                                count={item.count}
                                                showZero
                                                style={{ backgroundColor: item.count > 0 ? '#1890ff' : '#d9d9d9' }}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    }
                                  })}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Statistics */}
        {Object.keys(filteredLocationGroups).length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-4 text-gray-800 text-lg">📊 Distribution Summary</h4>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Total Locations"
                  value={Object.keys(locationGroups).length}
                  prefix={<EnvironmentOutlined style={{ color: '#6366f1' }} />}
                  valueStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Buildings"
                  value={Object.values(locationGroups).flatMap(b => Object.keys(b)).length}
                  prefix={<BankOutlined style={{ color: '#3b82f6' }} />}
                  valueStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Floors"
                  value={data.length}
                  prefix={<TagOutlined style={{ color: '#10b981' }} />}
                  valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total Assets"
                  value={totalAssets}
                  valueStyle={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '24px' }}
                />
              </Col>
            </Row>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="mb-0">Asset Inventory</Title>
      </div>

      {/* Statistics Cards - Fully Responsive */}
      <Row gutter={[{ xs: 12, sm: 16, md: 20, lg: 24 }, { xs: 12, sm: 16, md: 20, lg: 24 }]} className="mb-6 md:mb-8">
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
          <Card className="text-center border-0 shadow-sm h-full">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <CheckCircleOutlined className="text-blue-500 text-base sm:text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{(statistics.data?.totalAssets || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-500">Total Assets</div>
              </div>
            </div>
            <div className="flex items-center justify-center text-green-500 text-xs">
              <ArrowUpOutlined className="mr-1" />
              2.3% from last month
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
          <Card className="text-center border-0 shadow-sm h-full">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <CheckCircleOutlined className="text-green-500 text-base sm:text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{(statistics.data?.activeAssets || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-500">Active Assets</div>
              </div>
            </div>
            <div className="flex items-center justify-center text-blue-500 text-xs">
              87.2% of total inventory
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
          <Card className="text-center border-0 shadow-sm h-full">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <WarningOutlined className="text-yellow-500 text-base sm:text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{(statistics.data?.assetsAtRisk || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-500">Assets at Risk</div>
              </div>
            </div>
            <div className="flex items-center justify-center text-yellow-500 text-xs">
              Warranty EOL alerts
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
          <Card className="text-center border-0 shadow-sm h-full">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <PlusOutlined className="text-purple-500 text-base sm:text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{(statistics.data?.addedThisMonth || 0).toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-500">Added This Month</div>
              </div>
            </div>
            <div className="flex items-center justify-center text-green-500 text-xs">
              <ArrowUpOutlined className="mr-1" />
              5.15% Increase
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row - Fully Responsive */}
      <Row gutter={[{ xs: 12, sm: 16, md: 20, lg: 24 }, { xs: 12, sm: 16, md: 20, lg: 24 }]} className="mb-6 md:mb-8">
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm sm:text-base">Asset Distribution</span>
                <InfoCircleOutlined className="text-gray-400" />
              </div>
            }
            loading={statistics.loading}
            className="h-full"
            extra={
              <Button
                type="link"
                className="text-blue-500 text-xs sm:text-sm"
                onClick={() => setMapModalVisible(true)}
                icon={<EnvironmentOutlined />}
                size="small"
              >
                <span className="hidden sm:inline">View Map</span>
                <span className="inline sm:hidden">Map</span>
              </Button>
            }
          >
            <LocationPieChart data={locationDistribution} />
            <div className="mt-4 text-xs text-gray-500 flex items-center">
              <InfoCircleOutlined className="mr-1" />
              <span className="hidden sm:inline">Click on a slice to view details for that location</span>
              <span className="inline sm:hidden">Click slice for details</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm sm:text-base">Asset Status Overview</span>
                <InfoCircleOutlined className="text-gray-400" />
              </div>
            }
            loading={statistics.loading}
            className="h-full"
          >
            {statusDistribution.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="text-center mb-4">
                  <StatusPieChart data={statusDistribution} />
                </div>
                <div className="space-y-2 mb-4">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-xs">{item.status}</span>
                      </div>
                      <span className="text-xs font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-4 border-t">
                  <div className="flex items-center text-blue-500 text-sm">
                    <InfoCircleOutlined className="mr-2" />
                    <span>Status Check - {statistics.data?.availableAssets || 0} assets available for immediate deployment</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <InfoCircleOutlined className="text-2xl mb-2" />
                <div>No status data available</div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm sm:text-base">Critical Alerts</span>
                <WarningOutlined className="text-red-500" />
              </div>
            }
            loading={statistics.loading}
            className="h-full"
            extra={<Button type="link" className="text-blue-500 text-xs sm:text-sm" size="small" onClick={() => navigate('/assets/lifecycle')}>View All</Button>}
          >
            <div className="space-y-2 sm:space-y-3">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((alert, index) => {
                  const alertConfig = {
                    'warranty_expiring': { bg: 'bg-orange-50', border: 'border-orange-400', color: 'bg-orange-400', label: 'Warranty Expiring Soon', desc: 'Assets warranty expires within 30 days' },
                    'warranty_expired': { bg: 'bg-red-50', border: 'border-red-400', color: 'bg-red-400', label: 'Warranty Expired', desc: 'Assets with expired warranty' },
                    'eol_approaching': { bg: 'bg-yellow-50', border: 'border-yellow-400', color: 'bg-yellow-400', label: 'EOL Approaching', desc: 'Assets reaching end of life within 6 months' },
                    'eol_reached': { bg: 'bg-red-50', border: 'border-red-500', color: 'bg-red-500', label: 'EOL Reached', desc: 'Assets that reached end of life' },
                    'eos_approaching': { bg: 'bg-orange-50', border: 'border-orange-500', color: 'bg-orange-500', label: 'EOS Approaching', desc: 'Assets reaching end of support within 3 months' },
                    'eos_reached': { bg: 'bg-red-50', border: 'border-red-600', color: 'bg-red-600', label: 'EOS Reached', desc: 'Assets that reached end of support' },
                    'licenses_expiring': { bg: 'bg-purple-50', border: 'border-purple-400', color: 'bg-purple-400', label: 'Licenses Expiring Soon', desc: 'Software licenses expiring within 30 days' },
                    'licenses_expired': { bg: 'bg-purple-50', border: 'border-purple-500', color: 'bg-purple-500', label: 'Licenses Expired', desc: 'Software licenses that have expired' },
                    'under_repair': { bg: 'bg-yellow-50', border: 'border-yellow-500', color: 'bg-yellow-500', label: 'Under Repair', desc: 'Assets currently under repair' }
                  }
                  const config = alertConfig[alert.type] || { bg: 'bg-gray-50', border: 'border-gray-400', color: 'bg-gray-400', label: alert.type, desc: '' }

                  return (
                    <div key={index} className={`flex justify-between items-center p-2 sm:p-3 ${config.bg} rounded border-l-4 ${config.border}`}>
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-medium text-xs sm:text-sm truncate">{config.label}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">{config.desc}</div>
                      </div>
                      <Badge count={alert.count} overflowCount={99999} className={config.color} />
                    </div>
                  )
                })
              ) : (
                <div className="flex justify-center items-center p-4 text-gray-400">
                  <CheckCircleOutlined className="mr-2" />
                  <span className="text-xs sm:text-sm">No critical alerts</span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Asset Inventory Table Section - Fully Responsive */}
      <Card className="border-0 shadow-sm">


        <div className="mb-4">
          <Space wrap size={[8, 8]} className="w-full">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
              className="bg-blue-500"
              size="small"
            >
              <span className="hidden sm:inline">Add Single Asset</span>
              <span className="inline sm:hidden">Add Asset</span>
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => setBulkAddModalVisible(true)}
              size="small"
            >
              <span className="hidden md:inline">Bulk Add Assets</span>
              <span className="inline md:hidden">Bulk Add</span>
            </Button>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={() => setLegacyImportModalVisible(true)}
              size="small"
            >
              <span className="hidden md:inline">Import Legacy Data</span>
              <span className="inline md:hidden">Import</span>
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'all', label: 'Export All Assets', icon: <DownloadOutlined />, onClick: () => handleExport(true) },
                  { key: 'filtered', label: 'Export Filtered View', icon: <FilterOutlined />, onClick: () => handleExport(false) }
                ]
              }}
            >
              <Button icon={<ExportOutlined />} size="small">Export</Button>
            </Dropdown>
            <Badge count={Object.values(filters || {}).filter(v => v && v !== '').length} offset={[-5, 5]}>
              <Button icon={<FilterOutlined />} onClick={showFilterDrawer} size="small">Filters</Button>
            </Badge>
            <Button
              icon={<DeleteOutlined />}
              onClick={showDeletedAssetsModal}
              className="text-red-500 border-red-500 hover:bg-red-50"
              size="small"
            >
              <span className="hidden lg:inline">View Deleted Assets</span>
              <span className="inline lg:hidden">Deleted</span>
            </Button>
            <Button
              icon={<QrcodeOutlined />}
              onClick={handleGenerateSelectedLabels}
              disabled={selectedRowKeys.length === 0}
              loading={bulkGenerating}
              size="small"
              className="border-purple-500 text-purple-500 hover:bg-purple-50"
            >
              <span className="hidden md:inline">Generate Labels ({selectedRowKeys.length})</span>
              <span className="inline md:hidden">Labels ({selectedRowKeys.length})</span>
            </Button>
            <Button
              icon={<QrcodeOutlined />}
              onClick={handleGenerateAllLabels}
              loading={bulkGenerating}
              size="small"
              className="border-green-500 text-green-500 hover:bg-green-50"
            >
              <span className="hidden lg:inline">Generate All Labels ({assets.pagination?.total || 0})</span>
              <span className="inline lg:hidden">All Labels</span>
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={assets.data}
          rowKey="id"
          loading={assets.loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
            ],
          }}
          pagination={{
            current: assets.pagination?.page || 1,
            pageSize: assets.pagination?.limit || 10,
            total: assets.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: typeof window !== 'undefined' && window.innerWidth >= 768,
            showTotal: (total, range) =>
              typeof window !== 'undefined' && window.innerWidth >= 640
                ? `Showing ${range[0]} to ${range[1]} of ${total} entries`
                : `${range[0]}-${range[1]} of ${total}`,
            className: 'mt-4',
            pageSizeOptions: ['10', '20', '50', '100'],
            simple: typeof window !== 'undefined' && window.innerWidth < 576,
            responsive: true
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400, y: 'calc(100vh - 400px)' }}
          size={typeof window !== 'undefined' && window.innerWidth < 768 ? 'small' : 'middle'}
          className="custom-table"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        />
      </Card>

      {/* Add/Edit Asset - Responsive Drawer */}
      <Drawer
        title={<span className="text-sm sm:text-base font-semibold">{editingAsset ? 'Edit Asset' : 'Add New Asset'}</span>}
        open={isAddModalVisible}
        onClose={handleCancel}
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 720}
        placement="right"
        className="asset-form-drawer"
        styles={{
          body: { paddingBottom: 80 }
        }}
        extra={
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} loading={assets.loading}>
              {editingAsset ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues, allValues) => {
            // Auto-clear assigned_to when changing to component type
            if (changedValues.asset_type === 'component' && allValues.assigned_to) {
              form.setFieldsValue({ assigned_to: undefined })
            }
            // Auto-clear parent_asset_id and installation_notes when changing away from component
            if (changedValues.asset_type && changedValues.asset_type !== 'component') {
              form.setFieldsValue({
                parent_asset_id: undefined,
                installation_notes: undefined
              })
            }
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="serial_number"
                label="Serial Number"
                rules={[{ required: true, message: 'Please input serial number!' }]}
                extra="Asset Tag will be auto-generated from product name"
              >
                <Input placeholder="Enter serial number (e.g., SN123456)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_id"
                label="Product"
                rules={[{ required: true, message: 'Please select product!' }]}
              >
                <Select
                  placeholder="Select product"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const searchText = `${option.label || ''}`.toLowerCase()
                    return searchText.includes(input.toLowerCase())
                  }}
                  options={products.data?.map(product => ({
                    value: product.id,
                    label: `${product.name}${product.model ? ` - ${product.model}` : ''}`
                  }))}
                  loading={products.loading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="available">Available</Option>
                  <Option value="assigned">Assigned</Option>
                  <Option value="in_use">In Use</Option>
                  <Option value="under_repair">Under Repair</Option>
                  <Option value="maintenance">Maintenance</Option>
                  <Option value="disposed">Disposed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="importance"
                label="Importance"
                initialValue="medium"
              >
                <Select placeholder="Select importance level">
                  <Option value="critical">Critical</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="condition_status"
                label="Condition"
              >
                <Select placeholder="Select condition">
                  <Option value="excellent">Excellent</Option>
                  <Option value="good">Good</Option>
                  <Option value="fair">Fair</Option>
                  <Option value="poor">Poor</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="asset_type"
                label="Asset Type"
                initialValue="standalone"
                extra="Standalone: Regular assets. Component: Parts that can be installed in other assets (can be spare stock or installed)"
              >
                <Select placeholder="Select asset type">
                  <Option value="standalone">Standalone (Laptops, Printers, etc.)</Option>
                  <Option value="component">Component (RAM, HDD, Monitor, etc.)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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

                return (
                  locationName.includes(searchText) ||
                  building.includes(searchText) ||
                  floor.includes(searchText)
                )
              }}
              virtual
              listHeight={256}
              style={{ width: '100%' }}
              optionLabelProp="children"
            >
              {Array.isArray(locations) && locations.map(loc => {
              
                const buildingFloor = [
                  loc.building ? `Building: ${loc.building}` : '',
                  loc.floor ? `Floor: ${loc.floor}` : ''
                ]
                  .filter(Boolean)
                  .join(' • ')

                return (
                  <Option
                    key={loc.id}
                    value={loc.id}
                    locationname={loc.name}
                    building={loc.building || ''}
                    floor={loc.floor || ''}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${loc.name}${buildingFloor ? ` (${buildingFloor})` : ''}`}
                    >
                      <span style={{ fontWeight: 500 }}>{loc.name}</span>

                      {buildingFloor && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            marginLeft: '8px'
                          }}
                        >
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


          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.asset_type !== currentValues.asset_type}
              >
                {({ getFieldValue }) => {
                  const assetType = getFieldValue('asset_type')
                  const isComponent = assetType === 'component'
                  return (
                    <Form.Item
                      name="assigned_to"
                      label="Assigned To (Optional)"
                      extra={isComponent ? "Components cannot be assigned to users" : "Asset will inherit location from assigned user"}
                    >
                      <Select
                      placeholder={isComponent ? "N/A - Components cannot be assigned" : "Select user (asset will inherit location from user)"}
                      showSearch
                      allowClear
                      disabled={isComponent}
                      optionFilterProp="children"
                      onChange={(value) => {
                        const selectedUser = users.data?.find(
                          user => user.id === value
                        )

                        console.log('Selected User:', selectedUser)

                        if (selectedUser) {
                          form.setFieldsValue({
                            location_id: selectedUser.location_id,
                            department_id:
                              selectedUser.department_id ||
                              selectedUser.department?.id ||
                              selectedUser.department
                          })
                        }
                      }}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={users.data?.map(user => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}${user.employeeId ? ` (${user.employeeId})` : ''} (${user.email})`
                      }))}
                      loading={users.loading}
                    />
                    </Form.Item>
                  )
                }}
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
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.asset_type !== currentValues.asset_type}
              >
                {({ getFieldValue }) => {
                  const assetType = getFieldValue('asset_type')
                  return assetType === 'component' ? (
                    <Form.Item
                      name="parent_asset_id"
                      label="Parent Asset (Optional)"
                      extra="Leave empty for spare/stock components. Select parent when installing the component."
                    >
                      <Select
                        placeholder="Leave empty for spare stock, or select parent asset..."
                        showSearch
                        allowClear
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={dropdown.data?.filter(asset => asset.asset_type !== 'component').map(asset => ({
                          value: asset.id,
                          label: `${asset.product_name || 'Unknown'} - ${asset.label || asset.asset_tag || 'N/A'}`
                        }))}
                        loading={dropdown.loading}
                      />
                    </Form.Item>
                  ) : null
                }}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.asset_type !== currentValues.asset_type}
          >
            {({ getFieldValue }) => {
              const assetType = getFieldValue('asset_type')
              return assetType === 'component' ? (
                <Form.Item
                  name="installation_notes"
                  label="Installation Notes (Optional)"
                  extra="Add notes about the component installation"
                >
                  <Input.TextArea rows={2} placeholder="E.g., Upgraded from previous component" />
                </Form.Item>
              ) : null
            }}
          </Form.Item>

          <Collapse
            defaultActiveKey={editingAsset ? ['warranty', 'purchase'] : []}
            ghost
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'warranty',
                label: <span className="font-medium text-gray-700">Warranty & Lifecycle</span>,
                children: (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="warranty_start_date"
                          label="Warranty Start Date"
                        >
                          <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            placeholder="Select start date"
                            presets={[
                              { label: 'Today', value: dayjs() },
                              { label: 'Yesterday', value: dayjs().subtract(1, 'day') },
                              { label: 'Last Week', value: dayjs().subtract(1, 'week') },
                              { label: 'Last Month', value: dayjs().subtract(1, 'month') },
                            ]}
                            onChange={(date) => {
                              // Auto-suggest warranty end date when start date is selected
                              if (date && !form.getFieldValue('warranty_end_date')) {
                                // Don't auto-set, just highlight the field
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="warranty_end_date"
                          label="Warranty End Date"
                        >
                          <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            placeholder="Select end date"
                            presets={[
                              { label: '+1 Year', value: dayjs().add(1, 'year') },
                              { label: '+2 Years', value: dayjs().add(2, 'year') },
                              { label: '+3 Years', value: dayjs().add(3, 'year') },
                              { label: '+5 Years', value: dayjs().add(5, 'year') },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="eol_date"
                          label="Expected End of Life (EOL)"
                          extra="When product is discontinued"
                        >
                          <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            placeholder="Select EOL date"
                            presets={[
                              { label: '+3 Years', value: dayjs().add(3, 'year') },
                              { label: '+5 Years', value: dayjs().add(5, 'year') },
                              { label: '+7 Years', value: dayjs().add(7, 'year') },
                              { label: '+10 Years', value: dayjs().add(10, 'year') },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="eos_date"
                          label="Expected End of Support (EOS)"
                          extra="When support ends"
                        >
                          <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            placeholder="Select EOS date"
                            presets={[
                              { label: '+2 Years', value: dayjs().add(2, 'year') },
                              { label: '+4 Years', value: dayjs().add(4, 'year') },
                              { label: '+6 Years', value: dayjs().add(6, 'year') },
                              { label: '+8 Years', value: dayjs().add(8, 'year') },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: 'purchase',
                label: <span className="font-medium text-gray-700">Purchase Information</span>,
                children: (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="vendor_id"
                          label="Vendor"
                        >
                          <Select
                            placeholder="Select vendor"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={vendors?.data?.map(vendor => ({
                              value: vendor.id,
                              label: vendor.name
                            })) || []}
                            loading={vendors?.loading}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="invoice_number"
                          label="Invoice Number"
                        >
                          <Input placeholder="Enter invoice number" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="purchase_cost"
                          label="Purchase Cost"
                        >
                          <Input type="number" prefix="₹" placeholder="Enter cost" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              }
            ]}
          />

          <Form.Item
            name="notes"
            label="Notes"
            style={{ marginTop: 16 }}
          >
            <Input.TextArea rows={3} placeholder="Enter any additional notes" />
          </Form.Item>

          <Collapse
            ghost
            style={{ marginTop: 8 }}
            items={[
              {
                key: 'software',
                label: <span className="font-medium text-gray-700">Software & Licenses (Optional)</span>,
                children: (
                  <Form.List name="software_installations">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                            <Row gutter={16}>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'software_product_id']}
                                  label="Software Product"
                                  rules={[{ required: true, message: 'Please select software' }]}
                                >
                                  <Select
                                    placeholder="Select software product"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={softwareProducts.map(product => ({
                                      value: product.id,
                                      label: `${product.name}${product.model ? ` - ${product.model}` : ''}`
                                    }))}
                                    loading={products.loading}
                                    onChange={(value) => handleSoftwareProductChange(value, name)}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'software_type']}
                                  label={
                                    <span>
                                      Software Type{' '}
                                      <Tooltip title="Auto-populated from the selected software product">
                                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                      </Tooltip>
                                    </span>
                                  }
                                  initialValue="application"
                                >
                                  <Select placeholder="Auto-populated from product" disabled>
                                    <Option value="operating_system">Operating System</Option>
                                    <Option value="application">Application</Option>
                                    <Option value="utility">Utility</Option>
                                    <Option value="driver">Driver</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* License Pool - Select from organizational license pools */}
                            <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) =>
                                prevValues?.software_installations?.[name]?.software_product_id !==
                                currentValues?.software_installations?.[name]?.software_product_id
                              }
                            >
                              {({ getFieldValue }) => {
                                const selectedProductId = getFieldValue(['software_installations', name, 'software_product_id'])
                                const availableLicenses = productLicenses[selectedProductId] || []

                                return (
                                  <Row gutter={16}>
                                    <Col span={24}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'license_id']}
                                        label={
                                          <span>
                                            License Pool{' '}
                                            <Tooltip title="Select from organizational license pools. License key will be auto-assigned from the pool.">
                                              <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                            </Tooltip>
                                          </span>
                                        }
                                      >
                                        <Select
                                          placeholder={!selectedProductId ? "Select software first" : "Select license pool"}
                                          allowClear
                                          disabled={!selectedProductId}
                                          notFoundContent={selectedProductId ? "No licenses available for this software" : "Select software first"}
                                          popupMatchSelectWidth={false}
                                          style={{ width: '100%' }}
                                          optionLabelProp="label"
                                        >
                                          {availableLicenses.map(license => {
                                            const typeLabels = {
                                              per_user: 'User',
                                              per_device: 'Device',
                                              concurrent: 'Concurrent',
                                              site: 'Site',
                                              volume: 'Volume'
                                            }
                                            const typeColors = {
                                              per_user: 'blue',
                                              per_device: 'green',
                                              concurrent: 'purple',
                                              site: 'gold',
                                              volume: 'cyan'
                                            }
                                            const displayName = license.license_name.length > 35
                                              ? license.license_name.substring(0, 35) + '...'
                                              : license.license_name
                                            return (
                                              <Option
                                                key={license.id}
                                                value={license.id}
                                                disabled={license.available_licenses <= 0}
                                                label={displayName}
                                              >
                                                <Tooltip title={license.license_name} placement="left">
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 350 }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                                      {license.license_name}
                                                    </span>
                                                    <Space size={4} style={{ flexShrink: 0, marginLeft: 8 }}>
                                                      <Tag color={typeColors[license.license_type] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                                                        {typeLabels[license.license_type] || license.license_type}
                                                      </Tag>
                                                      <Tag color={license.available_licenses > 0 ? 'green' : 'red'} style={{ margin: 0, fontSize: 11 }}>
                                                        {license.available_licenses}/{license.total_licenses}
                                                      </Tag>
                                                    </Space>
                                                  </div>
                                                </Tooltip>
                                              </Option>
                                            )
                                          })}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                )
                              }}
                            </Form.Item>

                            <Row gutter={16}>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'installation_date']}
                                  label="Installation Date (Optional)"
                                  tooltip="Date when the software was installed on this asset"
                                >
                                  <DatePicker
                                    style={{ width: '100%' }}
                                    format="YYYY-MM-DD"
                                    placeholder="Select date"
                                    presets={[
                                      { label: 'Today', value: dayjs() },
                                      { label: 'Yesterday', value: dayjs().subtract(1, 'day') },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'notes']}
                                  label="Installation Notes (Optional)"
                                >
                                  <Input.TextArea rows={2} placeholder="Enter installation notes" />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Button
                              type="dashed"
                              danger
                              onClick={() => remove(name)}
                              block
                              icon={<MinusCircleOutlined />}
                            >
                              Remove Software
                            </Button>
                          </div>
                        ))}
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            Add Software Installation
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                )
              }
            ]}
          />
        </Form>
      </Drawer>

      {/* Deleted Assets Modal - Responsive */}
      <Modal
        title={<span className="text-sm sm:text-base">Deleted Assets</span>}
        open={isDeletedModalVisible}
        onCancel={() => setIsDeletedModalVisible(false)}
        footer={null}
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '95vw' : typeof window !== 'undefined' && window.innerWidth < 1200 ? '90vw' : 1200}
        className="responsive-modal"
      >
        <div className="mb-4">
          <Text className="text-gray-600">
            Assets that have been soft deleted. You can restore them to make them active again.
          </Text>
        </div>

        <div className="mb-4">
          <Text>Total deleted assets: <strong>{deletedAssets.length}</strong></Text>
          {deletedAssetsLoading && <Text className="ml-4 text-blue-500">Loading...</Text>}
        </div>

        <Table
          columns={[
            {
              title: 'Asset Tag',
              dataIndex: 'asset_tag',
              key: 'asset_tag'
            },
            {
              title: 'Product',
              render: (_, record) => (
                <div>
                  <div className="font-medium">{record.product_name}</div>
                  <div className="text-xs text-gray-500">{record.product_model}</div>
                </div>
              )
            },
            {
              title: 'Category',
              dataIndex: 'category_name',
              key: 'category'
            },
            {
              title: 'Location',
              dataIndex: 'location_name',
              key: 'location'
            },
            {
              title: 'Deleted At',
              dataIndex: 'updated_at',
              key: 'deleted_at',
              render: (date) => formatDateOnly(date)
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleRestoreAsset(record)}
                  className="bg-green-500 border-green-500 hover:bg-green-600"
                >
                  Restore
                </Button>
              )
            }
          ]}
          dataSource={deletedAssets}
          rowKey="id"
          loading={deletedAssetsLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deleted assets`
          }}
          size="small"
          locale={{
            emptyText: deletedAssetsLoading ? 'Loading...' : 'No deleted assets found'
          }}
        />
      </Modal>

      {/* Asset Location Map Modal - Responsive */}
      <Modal
        title={<span className="text-sm sm:text-base">Asset Distribution Map</span>}
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '95vw' : typeof window !== 'undefined' && window.innerWidth < 1200 ? '90vw' : 1000}
        className="asset-map-modal responsive-modal"
      >
        <AssetLocationMap data={locationDistribution} />
      </Modal>

      {/* View Details Modal - Responsive */}
      <Modal
        title={
          <Space size="small" className="flex-wrap">
            <EyeOutlined />
            <span className="text-sm sm:text-base">Asset Details</span>
            {viewingAsset && <Tag color="blue" className="text-xs">{viewingAsset.asset_tag}</Tag>}
          </Space>
        }
        open={viewDetailsModalVisible}
        onCancel={() => {
          setViewDetailsModalVisible(false)
          setViewingAsset(null)
        }}
        footer={[
          <Button key="edit" icon={<EditOutlined />} size="small" onClick={() => {
            setViewDetailsModalVisible(false)
            showEditModal(viewingAsset)
          }}>
            <span className="hidden sm:inline">Edit Asset</span>
            <span className="inline sm:hidden">Edit</span>
          </Button>,
          ...(viewingAsset?.asset_type !== 'component' ? [
            <Button key="assign" type="primary" icon={<UserOutlined />} size="small" onClick={() => {
              setViewDetailsModalVisible(false)
              showAssignModal(viewingAsset)
            }}>
              <span className="hidden sm:inline">Assign Asset</span>
              <span className="inline sm:hidden">Assign</span>
            </Button>
          ] : []),
          <Button key="close" size="small" onClick={() => {
            setViewDetailsModalVisible(false)
            setViewingAsset(null)
          }}>
            Close
          </Button>
        ]}
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '95vw' : typeof window !== 'undefined' && window.innerWidth < 768 ? '90vw' : 900}
        className="responsive-modal"
      >
        {viewingAsset && (
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: (
                  <span>
                    <InfoCircleOutlined />
                    Details
                  </span>
                ),
                children: (
          <div className="space-y-4">
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12} md={8}>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <Text type="secondary" className="text-xs">Asset Tag (Auto-generated)</Text>
                  <div className="font-medium text-base sm:text-lg">{viewingAsset.asset_tag}</div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <Text type="secondary" className="text-xs">Serial Number</Text>
                  <div className="font-medium text-base sm:text-lg">{viewingAsset.serial_number || 'N/A'}</div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <Text type="secondary" className="text-xs">Status</Text>
                  <div className="mt-1">
                    <Tag color={getStatusColor(viewingAsset.status)} className="text-xs sm:text-sm">
                      {viewingAsset.status ? viewingAsset.status.charAt(0).toUpperCase() + viewingAsset.status.slice(1).replace('_', ' ') : 'N/A'}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <Text type="secondary" className="text-xs">Importance</Text>
                  <div className="mt-1">
                    <Tag color={
                      viewingAsset.importance === 'critical' ? 'red' :
                      viewingAsset.importance === 'high' ? 'orange' :
                      viewingAsset.importance === 'medium' ? 'blue' :
                      viewingAsset.importance === 'low' ? 'green' : 'default'
                    } className="text-xs sm:text-sm">
                      {viewingAsset.importance ? viewingAsset.importance.charAt(0).toUpperCase() + viewingAsset.importance.slice(1) : 'Medium'}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider orientation="left"><span className="text-sm">Product Information</span></Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Product Name:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.product_name || 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Model:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.product_model || 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Category:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.category_name || 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">OEM:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.oem_name || 'N/A'}</div>
              </Col>
            </Row>

            <Divider orientation="left"><span className="text-sm">Asset Type & Hierarchy</span></Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Text type="secondary">Asset Type:</Text>
                <div className="font-medium">
                  <Tag color={
                    viewingAsset.asset_type === 'component' ? 'green' :
                    viewingAsset.asset_type === 'parent' ? 'blue' : 'default'
                  }>
                    {viewingAsset.asset_type ? viewingAsset.asset_type.toUpperCase() : 'STANDALONE'}
                  </Tag>
                </div>
              </Col>
              {viewingAsset.asset_type === 'component' && viewingAsset.parent_asset_tag && (
                <Col xs={24} sm={12}>
                  <Text type="secondary" className="text-xs sm:text-sm">Parent Asset:</Text>
                  <div className="font-medium text-sm sm:text-base flex items-center">
                    <ApiOutlined className="mr-2" />
                    {viewingAsset.parent_asset_tag}
                  </div>
                </Col>
              )}
              {viewingAsset.asset_type === 'component' && viewingAsset.installation_date && (
                <Col xs={24} sm={12}>
                  <Text type="secondary" className="text-xs sm:text-sm">Installation Date:</Text>
                  <div className="font-medium text-sm sm:text-base">{formatDateOnly(viewingAsset.installation_date)}</div>
                </Col>
              )}
              {viewingAsset.asset_type === 'component' && viewingAsset.installed_by_name && (
                <Col xs={24} sm={12}>
                  <Text type="secondary" className="text-xs sm:text-sm">Installed By:</Text>
                  <div className="font-medium text-sm sm:text-base">{viewingAsset.installed_by_name}</div>
                </Col>
              )}
            </Row>

            {viewingAsset.asset_type === 'component' && viewingAsset.installation_notes && (
              <>
                <Divider orientation="left"><span className="text-sm">Installation Notes</span></Divider>
                <div className="bg-blue-50 p-2 sm:p-3 rounded">
                  <Text className="text-xs sm:text-sm">{viewingAsset.installation_notes}</Text>
                </div>
              </>
            )}

            <Divider orientation="left"><span className="text-sm">Location & Assignment</span></Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Location:</Text>
                <div className="font-medium text-sm sm:text-base flex items-center">
                  <EnvironmentOutlined className="mr-2" />
                  {viewingAsset.location_name || 'N/A'}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Assigned To:</Text>
                <div className="font-medium text-sm sm:text-base flex items-center">
                  <UserOutlined className="mr-2" />
                  <div>
                    <div>{viewingAsset.assigned_user_name || (viewingAsset.asset_type === 'component' ? 'N/A (Components cannot be assigned)' : 'Unassigned')}</div>
                    {viewingAsset.assigned_user_email && (
                      <div className="text-xs text-gray-500">{viewingAsset.assigned_user_email}</div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            <Divider orientation="left"><span className="text-sm">Purchase Information</span></Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Vendor:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.vendor_name || 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Invoice Number:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.invoice_number || 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Purchase Date:</Text>
                <div className="font-medium text-sm sm:text-base">
                  {viewingAsset.purchase_date ? formatDateOnly(viewingAsset.purchase_date) : 'N/A'}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Purchase Cost:</Text>
                <div className="font-medium text-sm sm:text-base">{viewingAsset.purchase_cost ? `₹${viewingAsset.purchase_cost}` : 'N/A'}</div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Condition:</Text>
                <div className="font-medium text-sm sm:text-base capitalize">{viewingAsset.condition_status || 'N/A'}</div>
              </Col>
            </Row>

            <Divider orientation="left"><span className="text-sm">Warranty & Lifecycle</span></Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">Warranty Period:</Text>
                <div className="font-medium text-sm sm:text-base">
                  {viewingAsset.warranty_start_date && viewingAsset.warranty_end_date ? (
                    <>
                      {formatDateOnly(viewingAsset.warranty_start_date)} - {formatDateOnly(viewingAsset.warranty_end_date)}
                      {(() => {
                        const endDate = new Date(viewingAsset.warranty_end_date)
                        const today = new Date()
                        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
                        if (daysLeft < 0) {
                          return <Tag color="error" style={{ marginLeft: 8 }}>Expired</Tag>
                        } else if (daysLeft <= 30) {
                          return <Tag color="warning" style={{ marginLeft: 8 }}>Expiring Soon ({daysLeft}d)</Tag>
                        } else {
                          return <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>
                        }
                      })()}
                    </>
                  ) : viewingAsset.warranty_end_date ? (
                    <>
                      Until {formatDateOnly(viewingAsset.warranty_end_date)}
                      {(() => {
                        const endDate = new Date(viewingAsset.warranty_end_date)
                        const today = new Date()
                        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
                        if (daysLeft < 0) {
                          return <Tag color="error" style={{ marginLeft: 8 }}>Expired</Tag>
                        } else if (daysLeft <= 30) {
                          return <Tag color="warning" style={{ marginLeft: 8 }}>Expiring Soon ({daysLeft}d)</Tag>
                        } else {
                          return <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>
                        }
                      })()}
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">End of Life (EOL):</Text>
                <div className="font-medium text-sm sm:text-base">
                  {viewingAsset.eol_date ? (
                    <>
                      {formatDateOnly(viewingAsset.eol_date)}
                      {(() => {
                        const eolDate = new Date(viewingAsset.eol_date)
                        const today = new Date()
                        const daysLeft = Math.ceil((eolDate - today) / (1000 * 60 * 60 * 24))
                        if (daysLeft < 0) {
                          return <Tag color="error" style={{ marginLeft: 8 }}>Reached</Tag>
                        } else if (daysLeft <= 180) {
                          return <Tag color="warning" style={{ marginLeft: 8 }}>Approaching ({Math.ceil(daysLeft / 30)}mo)</Tag>
                        }
                        return null
                      })()}
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs sm:text-sm">End of Support (EOS):</Text>
                <div className="font-medium text-sm sm:text-base">
                  {viewingAsset.eos_date ? (
                    <>
                      {formatDateOnly(viewingAsset.eos_date)}
                      {(() => {
                        const eosDate = new Date(viewingAsset.eos_date)
                        const today = new Date()
                        const daysLeft = Math.ceil((eosDate - today) / (1000 * 60 * 60 * 24))
                        if (daysLeft < 0) {
                          return <Tag color="error" style={{ marginLeft: 8 }}>Reached</Tag>
                        } else if (daysLeft <= 90) {
                          return <Tag color="warning" style={{ marginLeft: 8 }}>Approaching ({Math.ceil(daysLeft / 30)}mo)</Tag>
                        }
                        return null
                      })()}
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              </Col>
            </Row>

            {viewingAsset.notes && (
              <>
                <Divider orientation="left"><span className="text-sm">Notes</span></Divider>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <Text className="text-xs sm:text-sm">{viewingAsset.notes}</Text>
                </div>
              </>
            )}

            <Divider orientation="left"><span className="text-sm">Software Installations</span></Divider>
            {viewingAsset.id ? (
              <AssetSoftwareView key={viewingAsset.id} assetId={viewingAsset.id} />
            ) : (
              <Alert message="Unable to load software installations" type="warning" />
            )}
          </div>
                )
              },
              {
                key: 'repair-history',
                label: (
                  <span>
                    <ToolOutlined />
                    Repair History
                  </span>
                ),
                children: (
                  <AssetRepairHistory
                    assetId={viewingAsset.id}
                    assetTag={viewingAsset.asset_tag}
                    viewMode="table"
                  />
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* Assign Asset Modal - Responsive */}
      <Modal
        title={
          <Space size="small" className="flex-wrap">
            <UserOutlined />
            <span className="text-sm sm:text-base">Assign Asset</span>
            {assigningAsset && <Tag color="blue" className="text-xs">{assigningAsset.asset_tag}</Tag>}
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false)
          assignForm.resetFields()
          setAssigningAsset(null)
        }}
        footer={null}
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '95vw' : 600}
        className="responsive-modal"
      >
        <div className="mb-4">
          {assigningAsset && (
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <Text type="secondary">Product:</Text>
                  <div className="font-medium">{assigningAsset.product_name}</div>
                </div>
                <div>
                  <Text type="secondary">Model:</Text>
                  <div className="font-medium">{assigningAsset.product_model || 'N/A'}</div>
                </div>
                <div>
                  <Text type="secondary">Category:</Text>
                  <div className="font-medium">
                    <Tag color="purple">{assigningAsset.category_name || 'N/A'}</Tag>
                  </div>
                </div>
                <div>
                  <Text type="secondary">Current Status:</Text>
                  <div>
                    <Tag color={assigningAsset.assigned_to ? 'blue' : 'green'}>
                      {assigningAsset.assigned_to ? 'Assigned' : 'Available'}
                    </Tag>
                  </div>
                </div>
                {assigningAsset.assigned_user_name && (
                  <div>
                    <Text type="secondary">Currently Assigned To:</Text>
                    <div className="font-medium">{assigningAsset.assigned_user_name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <InfoCircleOutlined className="mr-1" />
            <strong>Note:</strong> Users can only be assigned one asset per category/subcategory type unless the "Allow Multiple Assets" flag is enabled on their profile.
          </div>
        </div>

        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignAsset}
        >
          <Form.Item
            name="user_id"
            label="Assign To User"
            rules={[{ required: true, message: 'Please select a user!' }]}
          >
            <Select
              placeholder="Select user to assign"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.data?.map(user => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName}${user.employeeId ? ` (${user.employeeId})` : ''} (${user.email})`
              }))}
              loading={users.loading}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Assignment Notes (Optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter any notes about this assignment..."
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setAssignModalVisible(false)
              assignForm.resetFields()
              setAssigningAsset(null)
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={assignment.loading}>
              Assign Asset
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Add Assets Modal */}
      <BulkAddAssetsModal
        visible={bulkAddModalVisible}
        onClose={() => setBulkAddModalVisible(false)}
        onSuccess={() => {
          dispatch(fetchAssets({ page: 1, limit: 10 }))
          dispatch(fetchAssetStatistics())
        }}
        products={products.data || []}
        locations={locations.data || []}
        oems={oems.data || []}
        categories={categories.data || []}
      />

      {/* Legacy Import Modal */}
      <LegacyImportModal
        visible={legacyImportModalVisible}
        onClose={() => setLegacyImportModalVisible(false)}
        onSuccess={() => {
          dispatch(fetchAssets({ page: 1, limit: 10 }))
          dispatch(fetchAssetStatistics())
        }}
      />

      {/* Filter Drawer - Responsive */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-semibold">Filter Assets</span>
            <Badge count={Object.values(tempFilters).filter(v => v && v !== '').length} showZero={false} />
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '85vw' : typeof window !== 'undefined' && window.innerWidth < 768 ? 350 : 400}
        open={filterDrawerVisible}
        onClose={handleFilterDrawerClose}
        className="responsive-drawer"
        footer={
          <div className="flex justify-between">
            <Button onClick={handleClearFilters}>Clear All</Button>
            <Space>
              <Button onClick={handleFilterDrawerClose}>Cancel</Button>
              <Button type="primary" onClick={handleApplyFilters}>Apply Filters</Button>
            </Space>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <Input
              placeholder="Search by asset tag, product name, model..."
              value={tempFilters.search || ''}
              onChange={(e) => handleTempFilterChange('search', e.target.value)}
              allowClear
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
            <Select
              placeholder="Type to search serial number (min 2 chars)..."
              value={tempFilters.serial_number || undefined}
              onChange={(value) => handleTempFilterChange('serial_number', value)}
              onSearch={handleSerialNumberSearch}
              allowClear
              showSearch
              filterOption={false}
              loading={serialNumberSearching}
              notFoundContent={
                serialNumberSearching
                  ? 'Searching...'
                  : serialNumberOptions.length === 0
                    ? 'Type at least 2 characters to search'
                    : 'No serial numbers found'
              }
              style={{ width: '100%' }}
              options={serialNumberOptions}
            />
          </div>

          {/* Board */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Board</label>
            <Select
              placeholder="Select board"
              value={tempFilters.board_id || undefined}
              onChange={(value) => handleTempFilterChange('board_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={boards.data?.map(board => ({
                value: board.id,
                label: board.name
              }))}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select
              placeholder="Select status"
              value={tempFilters.status || undefined}
              onChange={(value) => handleTempFilterChange('status', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="available">Available</Option>
              <Option value="assigned">Assigned</Option>
              <Option value="in_use">In Use</Option>
              <Option value="under_repair">Under Repair</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="disposed">Disposed</Option>
            </Select>
          </div>

          {/* Condition Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <Select
              placeholder="Select condition"
              value={tempFilters.condition_status || undefined}
              onChange={(value) => handleTempFilterChange('condition_status', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
              <Option value="poor">Poor</Option>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <Select
              placeholder="Select category"
              value={tempFilters.category_id || undefined}
              onChange={(value) => handleTempFilterChange('category_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={categories.data?.map(category => ({
                value: category.id,
                label: category.name
              }))}
            />
          </div>

          {/* Sub-Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category</label>
            <Select
              placeholder="Select sub-category"
              value={tempFilters.subcategory_id || undefined}
              onChange={(value) => handleTempFilterChange('subcategory_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={subcategories.data?.map(subcat => ({
                value: subcat.id,
                label: subcat.name
              }))}
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <Select
              placeholder="Select product"
              value={tempFilters.product_id || undefined}
              onChange={(value) => handleTempFilterChange('product_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={products.data?.map(product => ({
                value: product.id,
                label: `${product.name}${product.model ? ` (${product.model})` : ''}`
              }))}
            />
          </div>

          {/* OEM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OEM/Manufacturer</label>
            <Select
              placeholder="Select OEM"
              value={tempFilters.oem_id || undefined}
              onChange={(value) => handleTempFilterChange('oem_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={oems.data?.map(oem => ({
                value: oem.id,
                label: oem.name
              }))}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Select
              placeholder="Select location"
              value={tempFilters.location_id || undefined}
              onChange={(value) => handleTempFilterChange('location_id', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={locations.data?.map(location => ({
                value: location.id,
                label: `${location.name}${location.building ? ` - ${location.building}` : ''}${location.floor ? ` (Floor: ${location.floor})` : ''}`
              }))}
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <Select
              placeholder="Select user"
              value={tempFilters.assigned_to || undefined}
              onChange={(value) => handleTempFilterChange('assigned_to', value)}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const searchText = `${option.label || ''}`.toLowerCase()
                return searchText.includes(input.toLowerCase())
              }}
              style={{ width: '100%' }}
              options={users.data?.map(user => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName} (${user.email})`
              }))}
            />
          </div>

          {/* Employee Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
            <Input
              placeholder="Search by employee code (e.g., T-12345)"
              value={tempFilters.employee_code || ''}
              onChange={(e) => handleTempFilterChange('employee_code', e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Drawer>

      {/* Component Manager Drawer - Responsive */}
      <Drawer
        title={
          <Space size="small" className="flex-wrap">
            <ApiOutlined className="text-blue-600" />
            <span className="text-sm sm:text-base">Component Manager</span>
            {managingComponentsAsset && (
              <Tag color="blue" className="text-xs">{managingComponentsAsset.asset_tag}</Tag>
            )}
          </Space>
        }
        open={componentDrawerVisible}
        onClose={() => {
          setComponentDrawerVisible(false)
          setManagingComponentsAsset(null)
        }}
        width={typeof window !== 'undefined' && window.innerWidth < 768 ? '95vw' : typeof window !== 'undefined' && window.innerWidth < 1200 ? '90vw' : 1200}
        destroyOnClose
        className="responsive-drawer"
      >
        {managingComponentsAsset && (
          <ComponentManager
            assetId={managingComponentsAsset.id}
            assetTag={managingComponentsAsset.asset_tag}
            assetType={managingComponentsAsset.asset_type}
          />
        )}
      </Drawer>

      {/* Asset Label Preview Modal */}
      <AssetLabelPreview
        visible={labelPreviewVisible}
        onClose={() => {
          setLabelPreviewVisible(false)
          setLabelAssetId(null)
        }}
        assetId={labelAssetId}
      />
    </div>
  )
}

export default AssetInventory
