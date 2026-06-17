import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tree,
  Input,
  Empty,
  Spin,
  Tag,
  Badge,
  Tooltip,
  Space,
  Typography,
  Checkbox
} from 'antd';
import {
  LaptopOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  SearchOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ticketService from '../../../services/ticket';

const { Text } = Typography;
const { Search } = Input;

/**
 * AssetSelector Component
 * Allows users to select their assigned assets when creating a ticket
 * Shows standalone assets, parent assets, and their components in a tree structure
 */
const AssetSelector = ({
  userId,
  selectedAssets = [],
  onSelectionChange,
  disabled = false,
  maxSelections = null,
  isSelfService = false // When true, uses /my-assets endpoint for current user
}) => {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    if (isSelfService) {
      // Employee self-service: fetch their own assets
      fetchAssets();
    } else if (userId) {
      // Coordinator mode: fetch specific employee's assets
      fetchAssets(userId);
    }
  }, [userId, isSelfService]);

  const fetchAssets = async (uid = null) => {
    setLoading(true);
    try {
      // Use appropriate endpoint based on mode
      const response = isSelfService
        ? await ticketService.getMyAssets()
        : await ticketService.getEmployeeAssets(uid);

      const data = response.data?.data || response.data;
      setAssets(data.assets || []);

      // Auto-expand parent assets
      const parentKeys = (data.assets || [])
        .filter(a => a.asset_type === 'parent')
        .map(a => a.id);
      setExpandedKeys(parentKeys);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter assets based on search
  const filteredAssets = useMemo(() => {
    if (!searchText) return assets;

    const search = searchText.toLowerCase();
    return assets.filter(asset =>
      asset.asset_tag?.toLowerCase().includes(search) ||
      asset.serial_number?.toLowerCase().includes(search) ||
      asset.product_name?.toLowerCase().includes(search) ||
      asset.oem_name?.toLowerCase().includes(search)
    );
  }, [assets, searchText]);

  const getStatusColor = (status) => {
    const colors = {
      available: 'green',
      assigned: 'blue',
      in_repair: 'orange',
      reserved: 'gold',
      disposed: 'red'
    };
    return colors[status] || 'default';
  };

  // Build tree data structure
  const treeData = useMemo(() => {
    const standalone = filteredAssets.filter(a => a.asset_type === 'standalone');
    const parents = filteredAssets.filter(a => a.asset_type === 'parent');
    const components = filteredAssets.filter(a => a.asset_type === 'component');

    const renderTitle = (asset, isComponent = false) => {
      const isSelected = selectedAssets.includes(asset.id);

      return (
        <Space size="small">
          {isComponent && (
            <Tag color="cyan" style={{ fontSize: '10px' }}>COMPONENT</Tag>
          )}
          {asset.asset_type === 'parent' && (
            <Tag color="blue" style={{ fontSize: '10px' }}>PARENT</Tag>
          )}
          <Text strong={!isComponent}>
            {asset.asset_tag}
          </Text>
          {/* <Text type="secondary" style={{ fontSize: '12px' }}>
            {asset.product_name} {asset.product_model && `(${asset.product_model})`}
          </Text> */}
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {asset.product_name}
            {asset.product_model && ` (${asset.product_model})`}
            {asset.serial_number && ` | SN: ${asset.serial_number}`}
          </Text>
          {isComponent && asset.parent_asset_tag && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              (of {asset.parent_asset_tag})
            </Text>
          )}
          {asset.oem_name && (
            <Tag color="purple" style={{ fontSize: '10px' }}>
              {asset.oem_name}
            </Tag>
          )}
          <Tag
            color={getStatusColor(asset.status)}
            style={{ fontSize: '10px' }}
          >
            {asset.status}
          </Tag>
          {isSelected && (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          )}
        </Space>
      );
    };

    const treeNodes = [];

    // Add standalone assets
    standalone.forEach(asset => {
      treeNodes.push({
        key: asset.id,
        title: renderTitle(asset),
        icon: <LaptopOutlined />,
        isLeaf: true,
        asset
      });
    });

    // Add parent assets with their components
    parents.forEach(parent => {
      const childComponents = components.filter(c => c.parent_asset_id === parent.id);

      treeNodes.push({
        key: parent.id,
        title: renderTitle(parent),
        icon: <DesktopOutlined />,
        asset: parent,
        children: childComponents.map(comp => ({
          key: comp.id,
          title: renderTitle(comp, true),
          icon: <AppstoreOutlined />,
          isLeaf: true,
          asset: comp
        }))
      });
    });

    return treeNodes;
  }, [filteredAssets, selectedAssets]);

  // const handleCheck = (checkedKeys) => {
  //   // Filter out non-leaf keys (parent nodes without actual selection)
  //   const leafKeys = checkedKeys.filter(key => {
  //     const asset = assets.find(a => a.id === key);
  //     return asset !== undefined;
  //   });

  //   if (maxSelections && leafKeys.length > maxSelections) {
  //     return; // Don't allow more than max selections
  //   }

  //   onSelectionChange(leafKeys);
  // };

const handleCheck = (checkedKeys) => {

  const leafKeys = checkedKeys.filter(key => {
    const asset = assets.find(a => a.id === key);
    return asset !== undefined;
  });

  if (maxSelections && leafKeys.length > maxSelections) {
    return;
  }

  // Get selected asset objects
  const selectedAssetObjects = assets.filter(
    asset => leafKeys.includes(asset.id)
  );

  // Send both ids and asset details
  onSelectionChange(
    leafKeys,
    selectedAssetObjects
  );
};



  const handleSelect = (selectedKeys, { node }) => {
    if (disabled) return;

    const assetId = node.key;
    const asset = assets.find(a => a.id === assetId);

    if (!asset) return; // Don't allow selecting non-asset nodes

    const newSelection = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];

    if (maxSelections && newSelection.length > maxSelections) {
      return;
    }

    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Loading assets..." />
        </div>
      </Card>
    );
  }

  if (!isSelfService && !userId) {
    return (
      <Card size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Select an employee to see their assets"
        />
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No assets assigned to this employee"
        />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <LaptopOutlined />
          <span>Select Related Assets</span>
          {selectedAssets.length > 0 && (
            <Badge
              count={selectedAssets.length}
              style={{ backgroundColor: '#52c41a' }}
            />
          )}
        </Space>
      }
      extra={
        maxSelections && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {selectedAssets.length}/{maxSelections} selected
          </Text>
        )
      }
    >
      <Search
        placeholder="Search assets by tag, serial, or product..."
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 12 }}
        prefix={<SearchOutlined />}
      />

      {treeData.length > 0 ? (
        <Tree
          checkable
          disabled={disabled}
          checkedKeys={selectedAssets}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          onCheck={handleCheck}
          treeData={treeData}
          style={{ maxHeight: '300px', overflow: 'auto' }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No assets match your search"
        />
      )}
{/* 
      {selectedAssets.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Selected assets:
          </Text>
          <div style={{ marginTop: 4 }}>
            {selectedAssets.map(assetId => {
              const asset = assets.find(a => a.id === assetId);
              return asset ? (
                <Tag
                  key={assetId}
                  closable={!disabled}
                  onClose={() => {
                    onSelectionChange(selectedAssets.filter(id => id !== assetId));
                  }}
                  style={{ marginBottom: 4 }}
                >
                  {asset.asset_tag}
                </Tag>
              ) : null;
            })}
          </div>
        </div>
      )} */}

    
{selectedAssets.length > 0 && (
  <div
    style={{
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid #f0f0f0'
    }}
  >

    {/* Header Row */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        marginBottom: 10,
        padding: '0 8px'
      }}
    >

      <Text
        type="secondary"
        style={{
          fontSize: '12px',
          minWidth: 140
        }}
      >
        Selected assets:
      </Text>

      <Text
        type="secondary"
        style={{
          fontSize: '12px',
          minWidth: 160
        }}
      >
        Location:
      </Text>

      <Text
        type="secondary"
        style={{
          fontSize: '12px',
          minWidth: 160
        }}
      >
        Department:
      </Text>

    </div>

    {/* Asset Rows */}
    <div style={{ marginTop: 6 }}>

      {selectedAssets.map(assetId => {

        const asset = assets.find(
          a => a.id === assetId
        );

        return asset ? (

          <div
            key={assetId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              marginBottom: 10,
              padding: 10,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              background: '#fafafa'
            }}
          >

            {/* Asset Tag */}
            <div style={{ minWidth: 140 }}>
              <Tag
                closable={!disabled}
                onClose={() => {
                  onSelectionChange(
                    selectedAssets.filter(
                      id => id !== assetId
                    )
                  );
                }}
                style={{ marginBottom: 0 }}
              >
                {asset.asset_tag}
              </Tag>
            </div>

            {/* Location */}
            <div style={{ minWidth: 160 }}>
              <Text style={{ fontSize: '12px' }}>
                {asset.location_name || 'N/A'}
              </Text>
            </div>

            {/* Department */}
            <div style={{ minWidth: 160 }}>
              <Text style={{ fontSize: '12px' }}>
                {asset.department_name || 'N/A'}
              </Text>
            </div>

          </div>

        ) : null;
      })}

    </div>

  </div>
)}


    </Card>
  );
};

export default AssetSelector;
