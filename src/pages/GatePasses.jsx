import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Tag,
  Typography,
  Space,
  message,
  Input,
  Drawer,
  Descriptions,
  Divider,
  Statistic,
  Tabs,
  Tooltip,
  Modal,
  Form,
  Checkbox,
  List,
  Empty,
  Popconfirm,
  Badge
} from 'antd';
import {
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  FilePdfOutlined,
  PlusOutlined,
  DeleteOutlined,
  ToolOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  DesktopOutlined,
  ClearOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import gatePassService from '../services/gatePass';
import masterService from '../services/master';
import userService from '../services/user';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const GatePasses = () => {
  // Data states
  const [loading, setLoading] = useState(false);
  const [gatePasses, setGatePasses] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Filter states
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [serialNumberSearch, setSerialNumberSearch] = useState('');

  // Dropdown data
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);

  // Detail drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [createType, setCreateType] = useState('disposal_service');

  // Asset search states
  const [assetSearchText, setAssetSearchText] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState([]);
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  // State to track selected asset in search dropdown (to handle "Others" selection)
  const [selectedAsset, setSelectedAsset] = useState(null);
  // State to track if "Others" option is selected in asset search
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [vendorsRes, usersRes] = await Promise.all([
          masterService.getVendors().catch(() => ({ data: { data: [] } })),
          userService.getUsers({ limit: 5000 }).catch(() => ({ data: { data: [] } }))
        ]);

        const vendorData = vendorsRes.data?.data?.vendors || vendorsRes.data?.data || [];
        setVendors(Array.isArray(vendorData) ? vendorData : []);

        const userData = usersRes.data?.data?.users || usersRes.data?.data || [];
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch gate passes
  const fetchGatePasses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit
      };

      if (activeTab !== 'all') {
        params.gate_pass_type = activeTab;
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      }
      if (searchText) params.search = searchText;
      if (serialNumberSearch) params.serial_number = serialNumberSearch;

      const response = await gatePassService.getGatePasses(params);
      const data = response.data?.data || response.data || {};

      setGatePasses(data.gate_passes || []);
      setStatistics(data.statistics || {});
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch gate passes:', error);
      message.error('Failed to load gate passes');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, searchText, serialNumberSearch, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchGatePasses();
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    fetchGatePasses(1);
  }, [activeTab]);

  // Apply filters
  const handleApplyFilter = () => {
    fetchGatePasses(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setDateRange(null);
    setSearchText('');
    setSerialNumberSearch('');
    setTimeout(() => fetchGatePasses(1), 0);
  };

  // View gate pass details
  const handleViewDetails = async (record) => {
    setSelectedGatePass(record);
    setDrawerVisible(true);
    setLoadingDetail(true);

    try {
      const response = await gatePassService.getGatePassById(record.id);
      const fullData = response.data?.data || response.data;
      setSelectedGatePass({ ...record, ...fullData });
    } catch (error) {
      console.error('Failed to fetch gate pass details:', error);
      message.error('Failed to load gate pass details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (record) => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      await gatePassService.downloadPDF(record.id, record.gate_pass_number);
      message.success({ content: 'PDF downloaded successfully', key: 'pdf' });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      message.error({ content: 'Failed to download PDF', key: 'pdf' });
    }
  };

  // Delete gate pass
  const handleDelete = async (id) => {
    try {
      await gatePassService.deleteGatePass(id);
      message.success('Gate pass deleted successfully');
      fetchGatePasses(pagination.page);
    } catch (error) {
      console.error('Failed to delete gate pass:', error);
      message.error('Failed to delete gate pass');
    }
  };

  // Asset search
  const handleAssetSearch = async (value) => {
    setAssetSearchText(value);
    if (!value || value.length < 2) {
      setAssetSearchResults([]);
      return;
    }

    setAssetSearchLoading(true);
    try {
      const response = await gatePassService.searchAssets(value);
      const assets = response.data?.data || [];
      setAssetSearchResults(assets);
    } catch (error) {
      console.error('Failed to search assets:', error);
    } finally {
      setAssetSearchLoading(false);
    }
  };

  // Add asset to selection
  const handleAddAsset = async (asset) => {
    // Check if already added
    if (selectedAssets.find(a => a.id === asset.id)) {
      message.warning('Asset already added');
      return;
    }

    // If parent asset, fetch components
    if (asset.component_count > 0) {
      try {
        const response = await gatePassService.getAssetWithComponents(asset.id);
        const data = response.data?.data || {};

        setSelectedAssets(prev => [
          ...prev,
          {
            ...asset,
            include_components: true,
            components: data.components || [],
            condition_out: 'working',
            remarks: ''
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch components:', error);
        setSelectedAssets(prev => [
          ...prev,
          { ...asset, include_components: false, components: [], condition_out: 'working', remarks: '' }
        ]);
      }
    } else {
      setSelectedAssets(prev => [
        ...prev,
        { ...asset, include_components: false, components: [], condition_out: 'working', remarks: '' }
      ]);
    }

    setAssetSearchText('');
    setAssetSearchResults([]);
  };

  // Remove asset from selection
  const handleRemoveAsset = (assetId) => {
    setSelectedAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // Update asset condition
  const handleUpdateAssetCondition = (assetId, field, value) => {
    setSelectedAssets(prev =>
      prev.map(a => a.id === assetId ? { ...a, [field]: value } : a)
    );
  };

  // Open create modal
  const handleOpenCreateModal = (type) => {
    setCreateType(type);
    setCreateModalVisible(true);
    setSelectedAssets([]);
    createForm.resetFields();
    createForm.setFieldsValue({
      purpose: type === 'disposal_service' ? 'repair' : 'new_assignment',
      issue_date: dayjs(),
      valid_until: dayjs().add(7, 'day')
    });
  };

  // Create gate pass
  const handleCreateGatePass = async () => {
    try {
      const values = await createForm.validateFields();

      // old code: For all types, asset is mandatory. But now, for some types, we allow proceed without asset, so we check if "Others" is selected in asset search. If "Others" is selected, then asset is not mandatory
      // if (selectedAssets.length === 0) {
      //   message.error('Please add at least one asset');
      //   return;
      // }

      // for other option, asset is not mandatory
      if (selectedAssets.length === 0 && !isOtherSelected) {
          message.error('Please add at least one asset');
          return;
        }

      setCreateLoading(true);

      const payload = {
        gate_pass_type: createType,
        purpose: values.purpose,
        assets: selectedAssets.map(a => ({
          asset_id: a.id,
          condition_out: a.condition_out || 'working',
          remarks: a.remarks || null,
          include_components: a.include_components || false
        })),
        authorized_by: values.authorized_by,
        issue_date: values.issue_date?.format('YYYY-MM-DD'),
        valid_until: values.valid_until?.format('YYYY-MM-DD'),
        remarks: values.remarks
      };

      if (createType === 'disposal_service') {
        payload.vendor_id = values.vendor_id;
        payload.destination_address = values.destination_address;
        payload.service_description = values.service_description;
        payload.carrier_name = values.carrier_name || null;
        if (values.purpose === 'repair') {
          payload.expected_return_date = values.expected_return_date?.format('YYYY-MM-DD');
        }
      } else {
        payload.recipient_user_id = values.recipient_user_id;
      }

      const response = await gatePassService.createGatePass(payload);
      const result = response.data?.data || response.data;

      message.success(`Gate Pass ${result.gate_pass_number} created successfully`);
      setCreateModalVisible(false);
      fetchGatePasses(1);

      // Auto download PDF
      if (result.id) {
        setTimeout(() => {
          handleDownloadPDF({ id: result.id, gate_pass_number: result.gate_pass_number });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to create gate pass:', error);
      message.error(error.response?.data?.message || 'Failed to create gate pass');
    } finally {
      setCreateLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Gate Pass No.',
      dataIndex: 'gate_pass_number',
      key: 'gate_pass_number',
      width: 160,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => handleViewDetails(record)}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(record.created_at).format('DD-MMM-YYYY')}
          </Text>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'gate_pass_type',
      key: 'gate_pass_type',
      width: 130,
      render: (type) => (
        <Tag color={gatePassService.getTypeColor(type)} icon={type === 'disposal_service' ? <ToolOutlined /> : <UserOutlined />}>
          {gatePassService.getTypeDisplayName(type)}
        </Tag>
      )
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 140,
      render: (purpose, record) => gatePassService.getPurposeDisplayName(record.gate_pass_type, purpose)
    },
    {
      title: 'From',
      dataIndex: 'from_location_name',
      key: 'from_location_name',
      width: 150,
      ellipsis: true,
      render: (text) => text || 'N/A'
    },
    {
      title: 'To',
      key: 'to',
      width: 150,
      ellipsis: true,
      render: (_, record) => (
        record.gate_pass_type === 'disposal_service'
          ? record.vendor_name || 'External'
          : record.recipient_name || 'N/A'
      )
    },
    {
      title: 'Assets',
      dataIndex: 'asset_count',
      key: 'asset_count',
      width: 80,
      align: 'center',
      render: (count) => <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button type="text" size="small" icon={<FilePdfOutlined />} onClick={() => handleDownloadPDF(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this gate pass?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Tab items
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <FileTextOutlined /> All ({statistics.total || 0})
        </span>
      )
    },
    {
      key: 'disposal_service',
      label: (
        <span>
          <ToolOutlined /> Disposal / Service ({statistics.disposal_service_count || 0})
        </span>
      )
    },
    {
      key: 'end_user',
      label: (
        <span>
          <UserOutlined /> End User ({statistics.end_user_count || 0})
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined /> Gate Pass Management
          </Title>
          <Text type="secondary">Create and manage gate passes for asset movement</Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenCreateModal('disposal_service')}
              style={{ background: '#fa8c16' }}
            >
              Disposal / Service
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenCreateModal('end_user')}
            >
              End User
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Total Gate Passes" value={statistics.total || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Disposal / Service" value={statistics.disposal_service_count || 0} valueStyle={{ color: '#fa8c16' }} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="End User" value={statistics.end_user_count || 0} valueStyle={{ color: '#1890ff' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Tabs and Filters */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['From Date', 'To Date']}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search gate pass, asset tag..."
              prefix={<SearchOutlined />}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              value={serialNumberSearch}
              onChange={e => setSerialNumberSearch(e.target.value)}
              placeholder="Search by serial number..."
              prefix={<SearchOutlined />}
              onPressEnter={handleApplyFilter}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilter}>
                Filter
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                Clear
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => fetchGatePasses(pagination.page)}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={gatePasses}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} gate passes`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, limit: pageSize }));
              fetchGatePasses(page);
            }
          }}
          scroll={{ x: 1100 }}
          size="small"
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={`Gate Pass: ${selectedGatePass?.gate_pass_number || ''}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={700}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => selectedGatePass && handleDownloadPDF(selectedGatePass)}
            >
              Download PDF
            </Button>
          </Space>
        }
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>
        ) : selectedGatePass ? (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Gate Pass No." span={2}>
                <Text strong>{selectedGatePass.gate_pass_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type" span={2}>
                <Tag color={gatePassService.getTypeColor(selectedGatePass.gate_pass_type)}>
                  {gatePassService.getTypeDisplayName(selectedGatePass.gate_pass_type)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>
                {gatePassService.getPurposeDisplayName(selectedGatePass.gate_pass_type, selectedGatePass.purpose)}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {selectedGatePass.issue_date ? dayjs(selectedGatePass.issue_date).format('DD-MMM-YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Valid Until">
                {selectedGatePass.valid_until ? dayjs(selectedGatePass.valid_until).format('DD-MMM-YYYY') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">From / To</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title={<><EnvironmentOutlined /> From</>}>
                  <Text strong>{selectedGatePass.from_location_name || 'N/A'}</Text>
                  {selectedGatePass.from_location_address && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {selectedGatePass.from_location_address}
                    </Text>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={
                  selectedGatePass.gate_pass_type === 'disposal_service'
                    ? <><ShopOutlined /> To (Vendor)</>
                    : <><UserOutlined /> To (User)</>
                }>
                  {selectedGatePass.gate_pass_type === 'disposal_service' ? (
                    <>
                      <Text strong>{selectedGatePass.vendor_name || 'External'}</Text>
                      {selectedGatePass.destination_address && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {selectedGatePass.destination_address}
                        </Text>
                      )}
                      {selectedGatePass.carrier_name && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                          Carrier: {selectedGatePass.carrier_name}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text strong>{selectedGatePass.recipient_name || 'N/A'}</Text>
                      {selectedGatePass.recipient_employee_id && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          Emp ID: {selectedGatePass.recipient_employee_id}
                        </Text>
                      )}
                      {selectedGatePass.recipient_department && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {selectedGatePass.recipient_department}
                        </Text>
                      )}
                    </>
                  )}
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">Assets ({selectedGatePass.assets?.length || 0})</Divider>
            <Table
              dataSource={selectedGatePass.assets || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Asset Tag',
                  dataIndex: 'asset_tag',
                  render: (tag, record) => (
                    <Space>
                      {record.parent_asset_id && <BranchesOutlined style={{ color: '#8c8c8c' }} />}
                      <Text>{tag}</Text>
                    </Space>
                  )
                },
                { title: 'Product', dataIndex: 'product_name', ellipsis: true },
                { title: 'Serial', dataIndex: 'serial_number' },
                {
                  title: 'Condition',
                  dataIndex: 'condition_out',
                  render: (cond) => (
                    <Tag color={gatePassService.getConditionColor(cond)}>
                      {cond || 'N/A'}
                    </Tag>
                  )
                }
              ]}
            />

            {selectedGatePass.remarks && (
              <>
                <Divider orientation="left">Remarks</Divider>
                <Text>{selectedGatePass.remarks}</Text>
              </>
            )}

            <Divider orientation="left">Authorization</Divider>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Created By">{selectedGatePass.created_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Authorized By">{selectedGatePass.authorized_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(selectedGatePass.created_at).format('DD-MMM-YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : null}
      </Drawer>

      {/* Create Modal */}
      <Modal
        title={
          createType === 'disposal_service'
            ? 'Create Gate Pass - Disposal / Service'
            : 'Create Gate Pass - End User'
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateGatePass}
        confirmLoading={createLoading}
        width={800}
        okText="Create Gate Pass"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: 'Please select purpose' }]}
          >
            <Select placeholder="Select purpose">
              {gatePassService.getPurposeOptions(createType).map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {createType === 'disposal_service' ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="vendor_id" label="Vendor / Service Center">
                    <Select placeholder="Select vendor" allowClear showSearch optionFilterProp="children">
                      {vendors.map(v => (
                        <Option key={v.id} value={v.id}>{v.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.purpose !== curr.purpose}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('purpose') === 'repair' && (
                        <Form.Item name="expected_return_date" label="Expected Return Date">
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="destination_address" label="Destination Address">
                <TextArea rows={2} placeholder="Enter destination address" />
              </Form.Item>
              <Form.Item name="service_description" label="Service Description">
                <TextArea rows={2} placeholder="Describe the service/repair required" />
              </Form.Item>
              <Form.Item name="carrier_name" label="Carrier Name">
                <Input placeholder="Enter carrier/transporter name" maxLength={200} />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="recipient_user_id"
              label="Recipient User"
              rules={[{ required: true, message: 'Please select recipient' }]}
            >
              <Select placeholder="Select recipient" showSearch optionFilterProp="children">
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.employeeId || user.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="issue_date" label="Issue Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_until" label="Valid Until">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Assets</Divider>

           {/* OLD CODE: Asset Search */}
          {/* <Form.Item label="Search and Add Assets">
            <Select
              showSearch
              placeholder="Search by asset tag, serial number, or product name..."
              value={null}
              searchValue={assetSearchText}
              onSearch={handleAssetSearch}
              onSelect={(value) => {
                const asset = assetSearchResults.find(a => a.id === value);
                if (asset) handleAddAsset(asset);
              }}
              filterOption={false}
              loading={assetSearchLoading}
              notFoundContent={assetSearchLoading ? 'Searching...' : (assetSearchText.length < 2 ? 'Type at least 2 characters' : 'No assets found')}
              style={{ width: '100%' }}
            >
              {assetSearchResults.map(asset => (
                <Option key={asset.id} value={asset.id}>
                  <Space>
                    <DesktopOutlined />
                    <Text strong>{asset.asset_tag}</Text>
                    <Text type="secondary">|</Text>
                    <Text>{asset.product_name}</Text>
                    {asset.component_count > 0 && (
                      <Tag color="purple" size="small">+{asset.component_count} components</Tag>
                    )}
                  </Space>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    Serial: {asset.serial_number || '-'} | Location: {asset.location_name || '-'}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item> */}

          {/* Asset Search */}
              <Form.Item label="Search and Add Assets">
                <Select
                showSearch
                placeholder="Search by asset tag, serial number, or product name..."
                value={selectedAsset}
                searchValue={assetSearchText}
                onSearch={handleAssetSearch}
                filterOption={false}
                loading={assetSearchLoading}
                style={{ width: '100%' }}
                notFoundContent={
                  assetSearchLoading
                    ? 'Searching...'
                    : assetSearchText.length < 2
                    ? 'Type at least 2 characters'
                    : 'No assets found'
                }
                onSelect={(value) => {

                  // Proceed without asset
                  if (value === 'other') {
                    setSelectedAsset('other');
                    setIsOtherSelected(true);

                    console.log('Proceed without asset');

                    return;
                  }

                  // Normal asset selection
                  setSelectedAsset(value);

                  const asset = assetSearchResults.find(
                    (a) => a.id === value
                  );

                  if (asset) {
                    handleAddAsset(asset);
                  }
                }}
              >
                {/* Other Option */}
                <Option value="other">
                  Others
                </Option>

                {/* Asset List */}
                {assetSearchResults.map((asset) => (
                  <Option key={asset.id} value={asset.id}>
                    <Space>
                      <DesktopOutlined />

                      <Text strong>
                        {asset.asset_tag}
                      </Text>

                      <Text type="secondary">|</Text>

                      <Text>
                        {asset.product_name}
                      </Text>
                    </Space>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#8c8c8c',
                      }}
                    >
                      Serial: {asset.serial_number || '-'} |
                      Location: {asset.location_name || '-'}
                    </div>
                  </Option>
                ))}
              </Select>
              </Form.Item>

          {/* Selected Assets */}
          {selectedAssets.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={selectedAssets}
              renderItem={asset => (
                <List.Item
                  actions={[
                    <Select
                      key="condition"
                      size="small"
                      value={asset.condition_out}
                      onChange={v => handleUpdateAssetCondition(asset.id, 'condition_out', v)}
                      style={{ width: 100 }}
                    >
                      {gatePassService.conditionOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>,
                    <Button
                      key="remove"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveAsset(asset.id)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<DesktopOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text strong>{asset.asset_tag}</Text>
                        {asset.component_count > 0 && (
                          <Checkbox
                            checked={asset.include_components}
                            onChange={e => handleUpdateAssetCondition(asset.id, 'include_components', e.target.checked)}
                          >
                            Include {asset.component_count} components
                          </Checkbox>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{asset.product_name} | {asset.serial_number || 'No Serial'}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Location: {asset.location_name || 'N/A'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No assets added" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}

          <Form.Item name="remarks" label="Remarks" style={{ marginTop: 16 }}>
            <TextArea rows={2} placeholder="Any additional remarks" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GatePasses;
