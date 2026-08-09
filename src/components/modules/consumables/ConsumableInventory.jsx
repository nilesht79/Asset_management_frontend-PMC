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
  Alert,
  Progress,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  WarningOutlined,
  InboxOutlined,
  SearchOutlined
} from '@ant-design/icons'
import consumableService from '../../../services/consumable'
import masterService from '../../../services/master'
import { formatLocalDateTime } from '../../../utils/dateUtils'

const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography

const ConsumableInventory = () => {
  const [activeTab, setActiveTab] = useState('inventory')

  // Inventory state
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryPagination, setInventoryPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [inventoryFilters, setInventoryFilters] = useState({ search: '', location_id: '' })

  // Low stock state
  const [lowStock, setLowStock] = useState([])
  const [lowStockLoading, setLowStockLoading] = useState(false)

  // Transactions state
  const [transactions, setTransactions] = useState([])
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [transactionPagination, setTransactionPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  // Modal states
  const [stockInModalOpen, setStockInModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Forms
  const [stockInForm] = Form.useForm()
  const [adjustForm] = Form.useForm()

  // Dropdowns
  const [consumables, setConsumables] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    loadConsumables()
    loadLocations()
    loadLowStock()
  }, [])

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory()
    } else if (activeTab === 'transactions') {
      loadTransactions()
    }
  }, [activeTab, inventoryPagination.current, inventoryPagination.pageSize, inventoryFilters, transactionPagination.current])

  const loadInventory = async () => {
    setInventoryLoading(true)
    try {
      const response = await consumableService.getInventory({
        page: inventoryPagination.current,
        limit: inventoryPagination.pageSize,
        ...inventoryFilters
      })
      if (response.data.success) {
        setInventory(response.data.data.inventory || [])
        setInventoryPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }))
      }
    } catch (error) {
      message.error('Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }

  const loadLowStock = async () => {
    setLowStockLoading(true)
    try {
      const response = await consumableService.getLowStock()
      if (response.data.success) {
        setLowStock(response.data.data.low_stock_items || [])
      }
    } catch (error) {
      console.error('Failed to load low stock:', error)
    } finally {
      setLowStockLoading(false)
    }
  }

  const loadTransactions = async () => {
    setTransactionLoading(true)
    try {
      const response = await consumableService.getTransactions({
        page: transactionPagination.current,
        limit: transactionPagination.pageSize
      })
      if (response.data.success) {
        setTransactions(response.data.data.transactions || [])
        setTransactionPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }))
      }
    } catch (error) {
      message.error('Failed to load transactions')
    } finally {
      setTransactionLoading(false)
    }
  }

  const loadConsumables = async () => {
    try {
      const response = await consumableService.getConsumables({ limit: 1000 })
      if (response.data.success) {
        setConsumables(response.data.data.consumables || [])
      }
    } catch (error) {
      console.error('Failed to load consumables:', error)
    }
  }

  const loadLocations = async () => {
    try {
      const response = await masterService.getLocations({ limit: 1000 })
      if (response.data.success) {
        setLocations(response.data.data.locations || [])
      }
    } catch (error) {
      console.error('Failed to load locations:', error)
    }
  }

  const handleStockIn = () => {
    stockInForm.resetFields()
    setStockInModalOpen(true)
  }

  const handleStockInSubmit = async () => {
    try {
      const values = await stockInForm.validateFields()
      await consumableService.stockIn(values)
      message.success('Stock added successfully')
      setStockInModalOpen(false)
      stockInForm.resetFields()
      loadInventory()
      loadLowStock()
      if (activeTab === 'transactions') loadTransactions()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || 'Failed to add stock')
    }
  }

  const handleAdjust = (record) => {
    setSelectedItem(record)
    adjustForm.resetFields()
    adjustForm.setFieldsValue({
      consumable_id: record.id,
      location_id: record.location_id || null
    })
    setAdjustModalOpen(true)
  }

  const handleAdjustSubmit = async () => {
    try {
      const values = await adjustForm.validateFields()
      await consumableService.adjustStock(values)
      message.success('Stock adjusted successfully')
      setAdjustModalOpen(false)
      adjustForm.resetFields()
      loadInventory()
      loadLowStock()
      if (activeTab === 'transactions') loadTransactions()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || 'Failed to adjust stock')
    }
  }

  const inventoryColumns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => (inventoryPagination.current - 1) * inventoryPagination.pageSize + index + 1
    },
    {
      title: 'Consumable',
      key: 'consumable',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" code style={{ fontSize: 11 }}>{record.sku}</Text>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text) => text || '-'
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (text) => text || 'Main Store'
    },
    {
      title: 'Current Stock',
      dataIndex: 'total_stock',
      key: 'total_stock',
      width: 120,
      render: (qty, record) => {
        const reorderLevel = record.reorder_level || 0
        const isLow = qty <= reorderLevel
        return (
          <Space>
            <Text strong style={{ color: isLow ? '#ff4d4f' : '#52c41a' }}>{qty}</Text>
            {isLow && <WarningOutlined style={{ color: '#faad14' }} />}
          </Space>
        )
      }
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorder_level',
      key: 'reorder_level',
      width: 120,
      render: (val) => val || 0
    },
    {
      title: 'Stock Status',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const qty = record.total_stock || 0
        const reorderLevel = record.reorder_level || 10
        const percent = Math.min((qty / (reorderLevel * 2)) * 100, 100)
        const status = qty === 0 ? 'exception' : qty <= reorderLevel ? 'normal' : 'success'
        return (
          <Progress
            percent={percent}
            size="small"
            status={status}
            format={() => qty <= reorderLevel ? 'Low' : 'OK'}
          />
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Adjust Stock">
          <Button
            type="text"
            size="small"
            icon={<MinusOutlined />}
            onClick={() => handleAdjust(record)}
          />
        </Tooltip>
      )
    }
  ]

  const lowStockColumns = [
    {
      title: 'Consumable',
      key: 'consumable',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" code style={{ fontSize: 11 }}>{record.sku}</Text>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (text) => text || '-'
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (text) => text || 'Main Store'
    },
    {
      title: 'Current Stock',
      dataIndex: 'total_stock',
      key: 'total_stock',
      width: 120,
      render: (qty) => <Text type="danger" strong>{qty}</Text>
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorder_level',
      key: 'reorder_level',
      width: 120
    },
    {
      title: 'Shortage',
      dataIndex: 'shortage',
      key: 'shortage',
      width: 100,
      render: (shortage) => <Tag color="red">-{shortage}</Tag>
    }
  ]

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => formatLocalDateTime(date)
    },
    {
      title: 'Consumable',
      dataIndex: 'consumable_name',
      key: 'consumable_name'
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 160,
      render: (type) => {
        const config = {
          stock_in: { color: 'green', label: 'Stock In' },
          stock_out: { color: 'red', label: 'Stock Out' },
          adjustment: { color: 'blue', label: 'Adjustment' },
          issued: { color: 'purple', label: 'Issued' },
          request_fulfillment: { color: 'orange', label: 'Request Fulfillment' }
        }
        const { color, label } = config[type] || { color: 'default', label: type?.replace('_', ' ').toUpperCase() }
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty, record) => {
        // Stock in is always positive, request_fulfillment/stock_out/issued are always negative
        // Adjustment uses actual qty value (can be + or -)
        let displayQty = qty
        if (record.transaction_type === 'stock_in') {
          displayQty = Math.abs(qty)
        } else if (['stock_out', 'issued', 'request_fulfillment'].includes(record.transaction_type)) {
          displayQty = -Math.abs(qty)
        }
        // For 'adjustment', keep the original qty sign as-is
        const isPositive = displayQty > 0
        return (
          <Text strong style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
            {isPositive ? '+' : ''}{displayQty}
          </Text>
        )
      }
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (text) => text || 'Main Store'
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (text) => text ? (
        <Tooltip title={text} placement="topLeft">
          <span style={{ cursor: 'pointer' }}>{text}</span>
        </Tooltip>
      ) : '-'
    },
    {
      title: 'By',
      dataIndex: 'performed_by_name',
      key: 'performed_by_name'
    }
  ]

  const tabItems = [
    {
      key: 'inventory',
      label: (
        <span>
          <InboxOutlined /> Stock Levels
        </span>
      ),
      children: (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space>
              <Search
                placeholder="Search consumables..."
                allowClear
                style={{ width: 300 }}
                onSearch={(value) => setInventoryFilters(prev => ({ ...prev, search: value }))}
              />
              <Select
                placeholder="Location"
                allowClear
                style={{ width: 180 }}
                onChange={(value) => setInventoryFilters(prev => ({ ...prev, location_id: value || '' }))}
              >
                {locations.map(loc => (
                  <Option key={loc.id} value={loc.id}>{loc.name}</Option>
                ))}
              </Select>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleStockIn}>
              Stock In
            </Button>
          </div>

          <Table
            columns={inventoryColumns}
            dataSource={inventory}
            rowKey={(r) => `${r.id}-${r.location_id || 'main'}`}
            loading={inventoryLoading}
            pagination={{
              ...inventoryPagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`
            }}
            onChange={(pag) => setInventoryPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))}
            size="middle"
          />
        </>
      )
    },
    {
      key: 'lowstock',
      label: (
        <span>
          <WarningOutlined style={{ color: lowStock.length > 0 ? '#faad14' : undefined }} />
          Low Stock {lowStock.length > 0 && `(${lowStock.length})`}
        </span>
      ),
      children: (
        <>
          {lowStock.length === 0 ? (
            <Alert
              message="All Good!"
              description="No items are below reorder level."
              type="success"
              showIcon
            />
          ) : (
            <>
              <Alert
                message={`${lowStock.length} items need attention`}
                description="The following items are at or below their reorder level."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={lowStockColumns}
                dataSource={lowStock}
                rowKey={(r) => `${r.id}-${r.location_id || 'main'}`}
                loading={lowStockLoading}
                pagination={false}
                size="middle"
              />
            </>
          )}
        </>
      )
    },
    {
      key: 'transactions',
      label: (
        <span>
          <HistoryOutlined /> Transaction History
        </span>
      ),
      children: (
        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey="id"
          loading={transactionLoading}
          pagination={{
            ...transactionPagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`
          }}
          onChange={(pag) => setTransactionPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))}
          size="middle"
        />
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            <InboxOutlined style={{ marginRight: 8 }} />
            Consumable Inventory
          </Title>
          <Text type="secondary">Manage stock levels, track transactions, and monitor low stock items</Text>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Stock In Modal */}
      <Modal
        title="Add Stock"
        open={stockInModalOpen}
        onCancel={() => {
          setStockInModalOpen(false)
          stockInForm.resetFields()
        }}
        onOk={handleStockInSubmit}
        okText="Add Stock"
        width={500}
      >
        <Form form={stockInForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="consumable_id"
            label="Consumable"
            rules={[{ required: true, message: 'Please select consumable' }]}
          >
            <Select
              placeholder="Select consumable"
              showSearch
              filterOption={(input, option) => {
              const text = String(option?.children?.props?.children || option?.label || '');
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            >
              
              {consumables.map(c => (
                <Option
                key={c.id}
                value={c.id}
                label={`${c.name} ${c.sku || c.code || ''}`}
              >
                {c.name} ({c.sku || c.code || ''})
              </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location_id"
            label="Location"
            rules={[{ required: true, message: 'Please select location' }]}
          >
            <Select placeholder="Select location">
              {locations.map(loc => (
                <Option key={loc.id} value={loc.id}>{loc.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Quantity to add" />
          </Form.Item>

          <Form.Item name="reference_number" label="Reference Number">
            <Input placeholder="Invoice/PO number (optional)" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        title="Adjust Stock"
        open={adjustModalOpen}
        onCancel={() => {
          setAdjustModalOpen(false)
          adjustForm.resetFields()
        }}
        onOk={handleAdjustSubmit}
        okText="Adjust"
        width={500}
      >
        <Form form={adjustForm} layout="vertical" style={{ marginTop: 16 }}>
          <Alert
            message={`Adjusting: ${selectedItem?.name} at ${selectedItem?.location_name || 'Main Store'}`}
            description={`Current stock: ${selectedItem?.total_stock || 0} ${selectedItem?.unit_of_measure || 'units'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="consumable_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="location_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="new_quantity"
            label="New Quantity"
            rules={[{ required: true, message: 'Please enter new quantity' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Set new stock level" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please provide reason for adjustment' }]}
          >
            <Input.TextArea rows={2} placeholder="Reason for stock adjustment" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ConsumableInventory
