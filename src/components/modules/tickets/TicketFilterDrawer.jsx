import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Select,
  Radio,
  Button,
  Space,
  Divider,
  Spin,
  message,
  Badge
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  CheckOutlined
} from '@ant-design/icons';
import ticketService from '../../../services/ticket';
import useResponsive from '../../../hooks/useResponsive';
import { DatePicker } from 'antd'
const { RangePicker } = DatePicker

const { Option } = Select;

const TicketFilterDrawer = ({ visible, onClose, filters, onApplyFilters, form }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    priorities: [],
    categories: [],
    departments: [],
    locations: [],
    engineers: []
  });
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (visible) {
      fetchFilterOptions();
      // Set current filter values in form
      form.setFieldsValue(filters);
    }
  }, [visible, filters, form]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const response = await ticketService.getFilterOptions();
      const data = response.data.data || response.data;
      setFilterOptions(data);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      message.error('Failed to load filter options');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
  const values = form.getFieldsValue();

  if (values.date_range && values.date_range.length === 2) {
    // Convert date range to start_date and end_date in ISO format
    // values.start_date = values.date_range[0]
    //   .startOf('day')
    //   .toISOString();

    // values.end_date = values.date_range[1]
    //   .endOf('day')
    //   .toISOString();

    // for API, we need it in YYYY-MM-DD format
    values.start_date = values.date_range[0]
  .format('YYYY-MM-DD');

  values.end_date = values.date_range[1]
    .format('YYYY-MM-DD');
  }

  delete values.date_range;

  onApplyFilters(values);
  onClose();
};

  const handleReset = () => {
    form.resetFields();
    onApplyFilters({
      status: '',
      priority: '',
      category: '',
      department_id: '',
      location_id: '',
      assigned_to_engineer_id: '',
      is_guest: undefined,
      // clear date range fields
      date_range: null,
      start_date: '',
      end_date: ''
    });
    onClose();
  };

  const handleClear = () => {
    const clearedValues = {
      status: '',
      priority: '',
      category: '',
      department_id: '',
      location_id: '',
      assigned_to_engineer_id: '',
      is_guest: undefined
    };
    form.setFieldsValue(clearedValues);
  };

  return (
    <Drawer
      title={
        <Space>
          <FilterOutlined />
          <span>Filter Tickets</span>
        </Space>
      }
      placement="right"
      width={isMobile ? '100%' : 400}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Space>
            <Button onClick={handleReset}>
              Reset All
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </Space>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={filters}
        >
          {/* Status Filter */}
          <Form.Item
            name="status"
            label="Status"
          >
            <Select
              placeholder="Select status"
              allowClear
              showSearch
            >
              {filterOptions.statuses.map((status) => (
                <Option key={status} value={status}>
                  {ticketService.getStatusDisplayName(status)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* ✅ ADD THIS */}
            <Form.Item
              name="date_range"
              label="Date Range"
            >
              <RangePicker
                style={{ width: '100%' }}
                format="DD-MM-YYYY"
              />
            </Form.Item>

          {/* Priority Filter */}
          <Form.Item
            name="priority"
            label="Priority"
          >
            <Select
              placeholder="Select priority"
              allowClear
              showSearch
            >
              {filterOptions.priorities.map((priority) => (
                <Option key={priority} value={priority}>
                  {ticketService.getPriorityDisplayName(priority)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Category Filter */}
          <Form.Item
            name="category"
            label="Category"
          >
            <Select
              placeholder="Select category"
              allowClear
              showSearch
            >
              {filterOptions.categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Department Filter */}
          <Form.Item
            name="department_id"
            label="Department"
          >
            <Select
              placeholder="Select department"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {filterOptions.departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Location Filter */}
          <Form.Item
            name="location_id"
            label="Location"
          >
            <Select
              placeholder="Select location"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {filterOptions.locations.map((location) => (
                <Option key={location.id} value={location.id}>
                  {location.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Engineer Filter */}
          <Form.Item
            name="assigned_to_engineer_id"
            label="Assigned Engineer"
          >
            <Select
              placeholder="Select engineer"
              allowClear
              showSearch
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return option.label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {filterOptions.engineers.map((engineer) => (
                <Option
                  key={engineer.id}
                  value={engineer.id}
                  label={`${engineer.name} ${engineer.employee_id || ''} ${engineer.department || ''}`}
                >
                  {engineer.name} {engineer.employee_id && `(${engineer.employee_id})`} {engineer.department && `- ${engineer.department}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Ticket Type Filter */}
          <Form.Item
            name="is_guest"
            label="Ticket Type"
          >
            <Radio.Group>
              <Radio value={undefined}>All Tickets</Radio>
              <Radio value="0">Employee Tickets</Radio>
              <Radio value="1">Guest Tickets</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default TicketFilterDrawer;
