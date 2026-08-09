/**
 * Standby Pool Management Page
 * Lists all standby assets with statistics and filtering
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  message,
  Tooltip,
  Popconfirm,
  Modal
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  UserAddOutlined,
  EyeOutlined,
  SwapOutlined,
  DisconnectOutlined,
  UserOutlined 
} from '@ant-design/icons';
import {
  fetchStandbyAssets,
  fetchStandbyStatistics,
  removeFromStandbyPool,
  setFilters,
  clearFilters,
  setPagination,
  selectStandbyAssets,
  selectStandbyStatistics,
  selectStandbyPagination,
  selectStandbyFilters,
  selectStandbyLoading,
  selectStandbyOperationLoading
} from '../store/slices/standbySlice';
import {
  fetchCategories,
  fetchProductTypes,
  selectCategories,
  selectProductTypes
} from '../store/slices/masterSlice';
import AddToStandbyPoolModal from '../components/modules/standby/AddToStandbyPoolModal';
import AssignStandbyModal from '../components/modules/standby/AssignStandbyModal';
import ViewAssetDetailsModal from '../components/modules/standby/ViewAssetDetailsModal';
import { formatDateOnly } from '../utils/dateUtils';
import {
    unassignStandbyAsset
} from '../store/slices/standbyAssignmentSlice';


const { Search } = Input;

const StandbyPool = () => {
  const dispatch = useDispatch();

  // Redux state
  const assets = useSelector(selectStandbyAssets);
  const statistics = useSelector(selectStandbyStatistics);
  const pagination = useSelector(selectStandbyPagination);
  const filters = useSelector(selectStandbyFilters);
  const loading = useSelector(selectStandbyLoading);
  const operationLoading = useSelector(selectStandbyOperationLoading);
  const categoriesState = useSelector(selectCategories);
  const categories = categoriesState.data || [];
  const productTypesState = useSelector(selectProductTypes);
  const productTypes = productTypesState.data || [];

  // Local state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalMode, setModalMode] = useState("assign");

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchStandbyAssets({ ...filters, ...pagination }));
    dispatch(fetchStandbyStatistics());
    dispatch(fetchCategories());
    dispatch(fetchProductTypes());
  }, []);

  // Fetch when filters or pagination change
  useEffect(() => {
    dispatch(fetchStandbyAssets({ ...filters, page: pagination.page, limit: pagination.limit }));
  }, [filters, pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPagination({ page: 1 })); // Reset to first page
  };

  // Handle search
  const handleSearch = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ page: 1 }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    dispatch(setPagination({ page: 1 }));
  };

  // Handle refresh
  const handleRefresh = async () => {

    await dispatch(
        fetchStandbyAssets({
            page: pagination.page,
            limit: pagination.limit,
            ...filters
        })
    );

    await dispatch(fetchStandbyStatistics());

};

  const handleUnassignStandby = (asset) => {
    Modal.confirm({
        title: "Unassign Standby Asset",

        content: (
            <div>
                <p>
                    Are you sure you want to unassign this standby asset?
                </p>

                <p>
                    Asset:
                    <strong> {asset.asset_tag}</strong>
                </p>

                {asset.current_assignment?.name && (
                    <p>
                        Currently assigned to:
                        <strong> {asset.current_assignment.name}</strong>
                    </p>
                )}

                <p className="text-gray-500 mt-2">
                    The standby asset will become available for a new assignment.
                </p>
            </div>
        ),

        icon: <UserOutlined className="text-blue-500" />,

        okText: "Yes, Unassign",

        okType: "primary",

        cancelText: "Cancel",

        onOk: async () => {

    try {

        if (!asset.current_assignment?.id) {
            message.error("No standby assignment found.");
            return;
        }

        await dispatch(
            unassignStandbyAsset({
                assignmentId: asset.current_assignment.id
            })
        ).unwrap();

        message.success("Standby asset unassigned successfully");

        await handleRefresh();

    } catch (error) {

        message.error(
            error.message || "Failed to unassign standby asset"
        );

    }

}

    });
};

  // Handle remove from pool
  const handleRemoveFromPool = async (assetId) => {
    try {
      await dispatch(removeFromStandbyPool(assetId)).unwrap();
      message.success('Asset removed from standby pool successfully');
      handleRefresh();
    } catch (error) {
      message.error(error || 'Failed to remove asset from standby pool');
    }
  };

  // Handle assign
  // const handleAssignClick = (asset) => {
  //   setSelectedAsset(asset);
  //   setAssignModalVisible(true);
  // };
  const handleAssignClick = (asset) => {
  setModalMode("assign");
  setSelectedAsset(asset);
  setAssignModalVisible(true);
};


const handleReassignClick = (asset) => {

    console.log(asset);

    console.log(asset.current_assignment);

    setModalMode("reassign");
    setSelectedAsset(asset);
    setAssignModalVisible(true);

};

const handleUnassignClick = (asset) => {
    handleUnassignStandby(asset);
}

  // Handle view details
  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    setViewDetailsModalVisible(true);
  };

  // Handle pagination change
  const handleTableChange = (newPagination) => {
    dispatch(setPagination({
      page: newPagination.current,
      limit: newPagination.pageSize
    }));
  };

  // Table columns
  const columns = [
    {
      title: 'Asset Tag',
      dataIndex: 'asset_tag',
      key: 'asset_tag',
      width: 150,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 150
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.product_model && (
            <div style={{ fontSize: '12px', color: '#888' }}>{record.product_model}</div>
          )}
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 130
    },
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          available: 'green',
          assigned: 'blue',
          maintenance: 'orange',
          retired: 'red'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Availability',
      dataIndex: 'standby_available',
      key: 'standby_available',
      width: 130,
      render: (available, record) => {
        if (available && !record.assigned_to) {
          return <Tag color="green">AVAILABLE</Tag>;
        }
        return <Tag color="orange">ASSIGNED</Tag>;
      }
    },
    {
      title: 'Current Assignment',
      dataIndex: 'current_assignment',
      key: 'current_assignment',
      width: 200,
      render: (assignment) => {
        if (!assignment) return '-';
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{assignment.name}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Since: {formatDateOnly(assignment.assigned_date)}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
  <Space size="small">
    {/* View */}
    <Tooltip title="View Details">
      <Button
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetails(record)}
      />
    </Tooltip>

    {/* Always keep Assign button */}
    <Tooltip title="Assign User">
      <Button
        type="link"
        size="small"
        icon={<UserAddOutlined />}
        onClick={() => handleAssignClick(record)}
      />
    </Tooltip>

    {/* Show only if already assigned */}
    {record.current_assignment && (
      <>
        <Tooltip title="Reassign">
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleReassignClick(record)}
          />
        </Tooltip>

        <Tooltip title="Unassign">
          <Button
            type="link"
            size="small"
            danger
            icon={<DisconnectOutlined />}
            onClick={() => handleUnassignStandby(record)}
          />
        </Tooltip>
      </>
    )}

    {/* Remove from Pool */}
    <Popconfirm
      title="Remove from standby pool?"
      description="This asset will no longer be available as a standby asset."
      onConfirm={() => handleRemoveFromPool(record.id)}
      okText="Yes"
      cancelText="No"
    >
      <Tooltip title="Remove from Pool">
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          loading={operationLoading}
        />
      </Tooltip>
    </Popconfirm>
  </Space>
)
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Standby Assets"
              value={statistics.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available"
              value={statistics.available}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Currently Assigned"
              value={statistics.assigned}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Under Repair"
              value={statistics.under_repair}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title="Standby Asset Pool"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              Add to Pool
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Search by asset tag, serial, product..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
            defaultValue={filters.search}
          />

          <Select
            placeholder="Availability"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('availability', value)}
            value={filters.availability}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'assigned', label: 'Assigned' }
            ]}
          />

          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('status', value)}
            value={filters.status}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'retired', label: 'Retired' }
            ]}
          />

          <Select
            placeholder="Category"
            allowClear
            showSearch
            style={{ width: 200 }}
            onChange={(value) => handleFilterChange('category_id', value)}
            value={filters.category_id}
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name
            }))}
          />

          <Select
            placeholder="Product Type"
            allowClear
            showSearch
            style={{ width: 200 }}
            onChange={(value) => handleFilterChange('product_type_id', value)}
            value={filters.product_type_id}
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={productTypes.map((type) => ({
              value: type.id,
              label: type.name
            }))}
          />

          <Button onClick={handleClearFilters}>Clear Filters</Button>
        </Space>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} assets`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modals */}
      <AddToStandbyPoolModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={handleRefresh}
      />

      <AssignStandbyModal mode={modalMode}
        key={selectedAsset?.id || 'assign-modal'}
        visible={assignModalVisible}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedAsset(null);
        }}
        standbyAsset={selectedAsset}
        onSuccess={handleRefresh}
      />

      <ViewAssetDetailsModal
        visible={viewDetailsModalVisible}
        onClose={() => {
          setViewDetailsModalVisible(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
      />
    </div>
  );
};

export default StandbyPool;
