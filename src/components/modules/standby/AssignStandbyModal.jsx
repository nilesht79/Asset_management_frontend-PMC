/**
 * Assign Standby Asset Modal
 * Form to assign a standby asset to a user
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  message,
  Row,
  Col,
  Card,
  Typography,
  Divider
} from 'antd';
import {
  assignStandbyAsset,
  selectAssignmentOperationLoading,
  clearOperationError
} from '../../../store/slices/standbyAssignmentSlice';
import { fetchUsers, selectUsers, fetchUserAssets, selectUserAssets } from '../../../store/slices/userSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

const AssignStandbyModal = ({ visible, onClose, standbyAsset, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Redux state
  const loading = useSelector(selectAssignmentOperationLoading);
  const usersState = useSelector(selectUsers);
  const userAssetsState = useSelector(selectUserAssets);

  // Use useMemo to prevent creating new empty arrays on every render
  const users = useMemo(() => usersState.data || [], [usersState.data]);
  const userAssets = useMemo(() => userAssetsState.data || [], [userAssetsState.data]);

  // Local state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOriginalAsset, setSelectedOriginalAsset] = useState(null);

  // Fetch users on modal open (fetch all users, no pagination limit)
  useEffect(() => {
    if (visible) {
      dispatch(fetchUsers({ limit: 5000, status: 'active' }));
      // dispatch(fetchUsers({}));
    }
  }, [visible, dispatch]);

  // Fetch user's assets when a user is selected
  useEffect(() => {
    if (selectedUser?.id) {
      dispatch(fetchUserAssets({ userId: selectedUser.id, params: { status: 'assigned' } }));
    }
  }, [selectedUser, dispatch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedUser(null);
      setSelectedOriginalAsset(null);
      dispatch(clearOperationError());
    }
  }, [visible, form, dispatch]);

  // Handle submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const assignmentData = {
        user_id: values.user_id,
        standby_asset_id: standbyAsset.id,
        original_asset_id: values.original_asset_id || null,
        reason: values.reason,
        reason_category: values.reason_category,
        expected_return_date: values.expected_return_date
          ? values.expected_return_date.format('YYYY-MM-DD')
          : null,
        notes: values.notes || ''
      };

      await dispatch(assignStandbyAsset(assignmentData)).unwrap();

      message.success('Standby asset assigned successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error.errors) {
        // Validation errors from backend
        message.error(error.errors[0]?.message || 'Validation failed');
      } else {
        message.error(error || 'Failed to assign standby asset');
      }
    }
  };

  // Memoize user options to prevent unnecessary re-renders
  // const userOptions = useMemo(() => {
  //   return users.map((user) => ({
  //     value: user.id,
  //     label: `${user.firstName} ${user.lastName} (${user.email})`
  //   }));
  // }, [users]);
  const userOptions = useMemo(() => {
  return users.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName} (${user.employeeId})`
  }));
}, [users]);

  // Memoize asset options to prevent unnecessary re-renders
  const assetOptions = useMemo(() => {
    return userAssets.map((asset) => ({
      value: asset.id,
      label: `${asset.asset_tag} - ${asset.product_name} (SN: ${asset.serial_number})`
    }));
  }, [userAssets]);

  return (
    <Modal
      title="Assign Standby Asset1"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Assign"
      cancelText="Cancel"
    >
      {/* Standby Asset Info */}
      {standbyAsset && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Asset Tag:</Text>
              <div>{standbyAsset.asset_tag}</div>
            </Col>
            <Col span={8}>
              <Text strong>Product:</Text>
              <div>{standbyAsset.product_name}</div>
            </Col>
            <Col span={8}>
              <Text strong>Serial Number:</Text>
              <div>{standbyAsset.serial_number}</div>
            </Col>
          </Row>
        </Card>
      )}

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changedValues) => {
          // Only track state changes, don't modify form values
          if (changedValues.user_id !== undefined) {
            const user = users.find((u) => u.id === changedValues.user_id);
            setSelectedUser(user || null);
            setSelectedOriginalAsset(null);
            // Clear the original asset field when user changes
            form.setFieldValue('original_asset_id', undefined);
          }
          if (changedValues.original_asset_id !== undefined) {
            if (changedValues.original_asset_id) {
              const asset = userAssets.find((a) => a.id === changedValues.original_asset_id);
              setSelectedOriginalAsset(asset || null);
            } else {
              setSelectedOriginalAsset(null);
            }
          }
        }}
      >
        {/* User Selection */}
        <Form.Item
          name="user_id"
          label="Assign to User"
          rules={[{ required: true, message: 'Please select a user' }]}
        >
          <Select
            showSearch
            placeholder="Select user"
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={userOptions}
          />
        </Form.Item>

        {/* Original Asset (Optional) */}
        <Form.Item
          name="original_asset_id"
          label="Original Asset (Under Repair/Maintenance)"
          tooltip="Select the user's asset that is being replaced temporarily. Leave empty if user has no asset."
        >
          <Select
            showSearch
            placeholder={
              !selectedUser
                ? 'First select a user'
                : userAssetsState.loading
                ? 'Loading assets...'
                : userAssets.length === 0
                ? 'No assets assigned to this user'
                : 'Select original asset (optional)'
            }
            disabled={!selectedUser}
            loading={userAssetsState.loading}
            allowClear
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={assetOptions}
            notFoundContent={
              userAssetsState.loading
                ? 'Loading assets...'
                : selectedUser && userAssets.length === 0
                ? 'This user has no assigned assets'
                : 'No matching assets found'
            }
          />
        </Form.Item>

        {/* Reason Category */}
        <Form.Item
          name="reason_category"
          label="Reason Category"
          rules={[{ required: true, message: 'Please select a reason category' }]}
        >
          <Select
            placeholder="Select reason category"
            options={[
              { value: 'repair', label: 'Repair' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'lost', label: 'Lost' },
              { value: 'stolen', label: 'Stolen' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </Form.Item>

        {/* Reason */}
        <Form.Item
          name="reason"
          label="Reason"
          rules={[
            { required: true, message: 'Please provide a reason' },
            { min: 5, message: 'Reason must be at least 5 characters' },
            { max: 500, message: 'Reason cannot exceed 500 characters' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Provide detailed reason for standby assignment..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* Expected Return Date */}
        <Form.Item
          name="expected_return_date"
          label="Expected Return Date"
          tooltip="When do you expect the original asset to be repaired/returned?"
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        {/* Notes */}
        <Form.Item name="notes" label="Additional Notes">
          <TextArea
            rows={2}
            placeholder="Any additional notes..."
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>

      {/* Info Box */}
      <Card size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
        <Text type="secondary">
          <strong>What happens next:</strong>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>The standby asset will be assigned to the selected user</li>
            <li>If an original asset is selected, it will be marked as under maintenance</li>
            <li>When the original asset is repaired, you can swap it back</li>
            <li>
              If the original never returns, the assignment will auto-convert to permanent after 30
              days past expected return date
            </li>
          </ul>
        </Text>
      </Card>
    </Modal>
  );
};

export default AssignStandbyModal;
