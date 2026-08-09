import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  InputNumber,
  Tag,
  message,
  Tooltip,
  Typography,
  Tabs,
  Popconfirm,
  Badge,
  Transfer
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  WarningOutlined,
  LinkOutlined
} from '@ant-design/icons'
import consumableService from '../../../services/consumable'
import masterService from '../../../services/master'

const { Search } = Input
const { Option } = Select
const { confirm } = Modal
const { Title, Text } = Typography

const ConsumableMaster = () => {
  const [activeTab, setActiveTab] = useState('consumables')

  // Consumables state
  const [consumables, setConsumables] = useState([])
  const [consumableLoading, setConsumableLoading] = useState(false)
  const [consumablePagination, setConsumablePagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [consumableFilters, setConsumableFilters] = useState({ search: '', category_id: '', status: '' })

  // Categories state
  const [categories, setCategories] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Vendors for dropdown
  const [vendors, setVendors] = useState([])

  // Products for compatibility
  const [products, setProducts] = useState([])

  // Modal state
  const [consumableModalOpen, setConsumableModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [compatibilityModalOpen, setCompatibilityModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)

  // Forms
  const [consumableForm] = Form.useForm()
  const [categoryForm] = Form.useForm()

  // Low stock items
  const [lowStockCount, setLowStockCount] = useState(0)

  // Transfer component state for compatibility
  const [targetKeys, setTargetKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])

  useEffect(() => {
    loadCategories()
    loadVendors()
    loadProducts()
    loadLowStockCount()
  }, [])

  useEffect(() => {
    if (activeTab === 'consumables') {
      loadConsumables()
    }
  }, [activeTab, consumablePagination.current, consumablePagination.pageSize, consumableFilters])

  const loadConsumables = async () => {
    setConsumableLoading(true)
    try {
      const response = await consumableService.getConsumables({
        page: consumablePagination.current,
        limit: consumablePagination.pageSize,
        ...consumableFilters
      })
      if (response.data.success) {
        setConsumables(response.data.data.consumables)
        setConsumablePagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }))
      }
    } catch (error) {
      message.error('Failed to load consumables')
    } finally {
      setConsumableLoading(false)
    }
  }

  const loadCategories = async () => {
    setCategoryLoading(true)
    try {
      const response = await consumableService.getCategories()
      if (response.data.success) {
        setCategories(response.data.data.categories || response.data.data || [])
      }
    } catch (error) {
      message.error('Failed to load categories')
    } finally {
      setCategoryLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await masterService.getVendors({ limit: 1000 })
      if (response.data.success) {
        setVendors(response.data.data.vendors || [])
      }
    } catch (error) {
      console.error('Failed to load vendors:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await masterService.getProducts({ limit: 1000 })
      if (response.data.success) {
        setProducts(response.data.data.products || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadLowStockCount = async () => {
    try {
      const response = await consumableService.getLowStock()
      if (response.data.success) {
        setLowStockCount(response.data.data?.length || 0)
      }
    } catch (error) {
      console.error('Failed to load low stock count:', error)
    }
  }

  // Consumable handlers
  const handleCreateConsumable = () => {
    setSelectedItem(null)
    setModalMode('create')
    consumableForm.resetFields()
    consumableForm.setFieldsValue({ is_active: true, reorder_level: 10 })
    setConsumableModalOpen(true)
  }

  const handleEditConsumable = (record) => {
    setSelectedItem(record)
    setModalMode('edit')
    consumableForm.setFieldsValue({
      name: record.name,
      sku: record.sku,
      category_id: record.category_id,
      vendor_id: record.vendor_id,
      unit_of_measure: record.unit_of_measure,
      reorder_level: record.reorder_level,
      description: record.description,
      is_active: record.is_active
    })
    setConsumableModalOpen(true)
  }

  const handleDeleteConsumable = (record) => {
    confirm({
      title: 'Delete Consumable',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${record.name}"?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await consumableService.deleteConsumable(record.id)
          message.success('Consumable deleted successfully')
          loadConsumables()
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete consumable')
        }
      }
    })
  }

  const handleConsumableSubmit = async () => {
    try {
      const values = await consumableForm.validateFields()

      if (modalMode === 'create') {
        await consumableService.createConsumable(values)
        message.success('Consumable created successfully')
      } else {
        await consumableService.updateConsumable(selectedItem.id, values)
        message.success('Consumable updated successfully')
      }

      setConsumableModalOpen(false)
      consumableForm.resetFields()
      loadConsumables()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || 'Operation failed')
    }
  }

  // Category handlers
  const handleCreateCategory = () => {
    setSelectedItem(null)
    setModalMode('create')
    categoryForm.resetFields()
    categoryForm.setFieldsValue({ is_active: true })
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (record) => {
    setSelectedItem(record)
    setModalMode('edit')
    categoryForm.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      is_active: record.is_active
    })
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (record) => {
    try {
      await consumableService.deleteCategory(record.id)
      message.success('Category deleted successfully')
      loadCategories()
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields()

      if (modalMode === 'create') {
        await consumableService.createCategory(values)
        message.success('Category created successfully')
      } else {
        await consumableService.updateCategory(selectedItem.id, values)
        message.success('Category updated successfully')
      }

      setCategoryModalOpen(false)
      categoryForm.resetFields()
      loadCategories()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || 'Operation failed')
    }
  }

  // Compatibility handlers
  const handleManageCompatibility = async (record) => {
    setSelectedItem(record)
    setSelectedKeys([])
    try {
      const response = await consumableService.getCompatibility(record.id)
      if (response.data.success) {
        // Handle both single product_id and array (corrupted data fix)
        const compatibleIds = (response.data.data || []).flatMap(p => {
          if (Array.isArray(p.product_id)) {
            return p.product_id
          }
          return p.product_id
        }).filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
        setTargetKeys(compatibleIds)
      } else {
        setTargetKeys([])
      }
    } catch (error) {
      setTargetKeys([])
    }
    setCompatibilityModalOpen(true)
  }

  const handleCompatibilitySubmit = async () => {
    try {
      await consumableService.addCompatibility(selectedItem.id, targetKeys)
      message.success('Compatibility updated successfully')
      setCompatibilityModalOpen(false)
      setTargetKeys([])
      setSelectedKeys([])
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed')
    }
  }

  // Transfer component handlers
  const handleTransferChange = (newTargetKeys) => {
    setTargetKeys(newTargetKeys)
  }

  const handleTransferSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])
  }

  // Filter function for Transfer search
  const filterOption = (inputValue, option) => {
    const searchText = inputValue.toLowerCase()
    return (
      option.title?.toLowerCase().includes(searchText) ||
      option.description?.toLowerCase().includes(searchText) ||
      option.oem?.toLowerCase().includes(searchText)
    )
  }

  // Transform products for Transfer component
  const getTransferDataSource = () => {
    return products.map(p => ({
      key: p.id,
      title: p.name,
      description: p.model || p.model_number || '',
      oem: p.oem_name || ''
    }))
  }

  // Table columns
  const consumableColumns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => (consumablePagination.current - 1) * consumablePagination.pageSize + index + 1
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>}
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Unit',
      dataIndex: 'unit_of_measure',
      key: 'unit_of_measure',
      width: 80,
      render: (text) => text || '-'
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorder_level',
      key: 'reorder_level',
      width: 120,
      render: (val) => val || 0
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Manage Compatibility">
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleManageCompatibility(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditConsumable(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteConsumable(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const categoryColumns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDeleteCategory(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const tabItems = [
    {
      key: 'consumables',
      label: (
        <span>
          <InboxOutlined /> Consumables
        </span>
      ),
      children: (
        <>
          {/* Search and Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space>
              <Search
                placeholder="Search consumables..."
                allowClear
                style={{ width: 300 }}
                onSearch={(value) => setConsumableFilters(prev => ({ ...prev, search: value }))}
              />
              <Select
                placeholder="Category"
                allowClear
                style={{ width: 150 }}
                onChange={(value) => setConsumableFilters(prev => ({ ...prev, category_id: value || '' }))}
              >
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => setConsumableFilters(prev => ({ ...prev, status: value || '' }))}
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateConsumable}>
              Add Consumable
            </Button>
          </div>

          <Table
            columns={consumableColumns}
            dataSource={consumables}
            rowKey="id"
            loading={consumableLoading}
            pagination={{
              ...consumablePagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} consumables`
            }}
            onChange={(pagination) => {
              setConsumablePagination(prev => ({
                ...prev,
                current: pagination.current,
                pageSize: pagination.pageSize
              }))
            }}
            size="middle"
          />
        </>
      )
    },
    {
      key: 'categories',
      label: 'Categories',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCategory}>
              Add Category
            </Button>
          </div>

          <Table
            columns={categoryColumns}
            dataSource={categories}
            rowKey="id"
            loading={categoryLoading}
            pagination={false}
            size="middle"
          />
        </>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <InboxOutlined style={{ marginRight: 8 }} />
              Consumable Master
            </Title>
            <Text type="secondary">Manage consumables, categories, and product compatibility</Text>
          </div>
          {lowStockCount > 0 && (
            <Badge count={lowStockCount} overflowCount={99}>
              <Tag icon={<WarningOutlined />} color="warning">
                Low Stock Items
              </Tag>
            </Badge>
          )}
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Consumable Modal */}
      <Modal
        title={modalMode === 'create' ? 'Add Consumable' : 'Edit Consumable'}
        open={consumableModalOpen}
        onCancel={() => {
          setConsumableModalOpen(false)
          consumableForm.resetFields()
        }}
        onOk={handleConsumableSubmit}
        okText={modalMode === 'create' ? 'Create' : 'Update'}
        width={600}
      >
        <Form form={consumableForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter consumable name' }]}
          >
            <Input placeholder="e.g., HP 78A Toner Cartridge" />
          </Form.Item>

          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please enter SKU' }]}
          >
            <Input placeholder="e.g., HP-78A" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="vendor_id" label="Vendor">
            <Select placeholder="Select vendor" allowClear>
              {vendors.map(v => (
                <Option key={v.id} value={v.id}>{v.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="unit_of_measure" label="Unit">
            <Input placeholder="e.g., Piece, Pack, Box" />
          </Form.Item>

          <Form.Item name="reorder_level" label="Reorder Level">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Minimum stock before alert" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          {modalMode === 'edit' && (
            <Form.Item name="is_active" label="Status" valuePropName="checked">
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={modalMode === 'create' ? 'Add Category' : 'Edit Category'}
        open={categoryModalOpen}
        onCancel={() => {
          setCategoryModalOpen(false)
          categoryForm.resetFields()
        }}
        onOk={handleCategorySubmit}
        okText={modalMode === 'create' ? 'Create' : 'Update'}
        width={500}
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="e.g., Printer Toner" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder="e.g., TONER" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>

          {modalMode === 'edit' && (
            <Form.Item name="is_active" label="Status" valuePropName="checked">
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Compatibility Modal */}
      <Modal
        title={`Manage Compatibility - ${selectedItem?.name || ''}`}
        open={compatibilityModalOpen}
        onCancel={() => {
          setCompatibilityModalOpen(false)
          setTargetKeys([])
          setSelectedKeys([])
        }}
        onOk={handleCompatibilitySubmit}
        okText="Save"
        width={800}
        styles={{ body: { paddingTop: 16 } }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            Move products from left (Available) to right (Compatible) to set compatibility.
            Use search to filter products by name, model, or manufacturer.
          </Text>
        </div>
        <Transfer
          dataSource={getTransferDataSource()}
          titles={['Available Products', 'Compatible Products']}
          targetKeys={targetKeys}
          selectedKeys={selectedKeys}
          onChange={handleTransferChange}
          onSelectChange={handleTransferSelectChange}
          filterOption={filterOption}
          showSearch
          showSelectAll
          listStyle={{
            width: 340,
            height: 400,
          }}
          render={(item) => (
            <span>
              <Text strong>{item.title}</Text>
              {(item.description || item.oem) && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {[item.oem, item.description].filter(Boolean).join(' • ')}
                </Text>
              )}
            </span>
          )}
          locale={{
            itemUnit: 'product',
            itemsUnit: 'products',
            searchPlaceholder: 'Search by name, model, or OEM...'
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">
            {targetKeys.length} product{targetKeys.length !== 1 ? 's' : ''} selected as compatible
          </Text>
        </div>
      </Modal>
    </div>
  )
}

export default ConsumableMaster
