import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Form, Input, Select, Card, Row, Col, message, Button, Divider, Alert } from 'antd';
import { UserAddOutlined, LaptopOutlined, ToolOutlined, AppstoreOutlined } from '@ant-design/icons';
import ticketService from '../../../services/ticket';
import AssetSelector from './AssetSelector';
import SoftwareSelector from './SoftwareSelector';

const { Option } = Select;
const { TextArea } = Input;

const CreateTicketModal = ({ visible, onClose, onSuccess, currentUser, preSelectedAsset }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedSoftware, setSelectedSoftware] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assetLocation, setAssetLocation] = useState('');
  const [assetDepartment, setAssetDepartment] = useState('');



  // Watch service_type to show alert for repair/replace
  const serviceType = Form.useWatch('service_type', form);

  // Check if current user is an engineer (not coordinator/admin)
  const isEngineerRole = currentUser?.role === 'engineer';

  // Check if current user is a regular employee (self-service mode)
  const isEmployeeSelfService = ['employee', 'dept_head', 'it_head'].includes(currentUser?.role);

  useEffect(() => {
    if (visible) {
      // For employee self-service, auto-select themselves
      if (isEmployeeSelfService) {
        setSelectedEmployee(currentUser?.id);
        setEmployeeInfo({
          name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email,
          email: currentUser?.email,
          department: currentUser?.department?.name || 'Not Assigned',
          location: currentUser?.location?.name || 'Not Assigned',
          employee_id: currentUser?.employeeId
        });
        // Pre-select asset if provided
        if (preSelectedAsset) {
          setSelectedAssets([preSelectedAsset.id]);
        }
      } else {
        fetchEmployees();
        // Only fetch engineers if user is coordinator/admin (not engineer)
        if (!isEngineerRole) {
          fetchEngineers();
        }
        form.resetFields();
        setEmployeeInfo(null);
        setSelectedEmployee(null);
        setIsGuestMode(false);
        setSearchText('');
        setSelectedAssets([]);
        setSelectedSoftware([]);
        setSelectedCategory(null);
      }
    }
  }, [visible, isEngineerRole, isEmployeeSelfService, currentUser, preSelectedAsset]);

  const fetchEmployees = async () => {
    try {
      const response = await ticketService.getEmployees();
      const data = response.data.data || response.data;
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error('Failed to load employees');
    }
  };

  const fetchEngineers = async () => {
    try {
      const response = await ticketService.getAvailableEngineers();
      const data = response.data.data || response.data;
      setEngineers(data.engineers || []);
    } catch (error) {
      console.error('Failed to fetch engineers:', error);
    }
  };

  const handleEmployeeChange = (userId) => {
    if (userId === 'GUEST') {
      handleGuestSelection();
      return;
    }

    const employee = employees.find((e) => e.user_id === userId);
    setSelectedEmployee(userId);
    setIsGuestMode(false);
    setSelectedAssets([]); // Reset asset selection when employee changes
    setSelectedSoftware([]); // Reset software selection when employee changes

    if (employee) {
      setEmployeeInfo({
        name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        department: employee.department_name || 'Not Assigned',
        location: employee.location_name || 'Not Assigned',
        employee_id: employee.employee_id
      });
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Reset selections when category changes
    setSelectedAssets([]);
    setSelectedSoftware([]);
  };

  const handleSearch = (value) => {
    setSearchText(value || '');
  };

  const handleGuestSelection = useCallback(() => {
    setIsGuestMode(true);
    setSelectedEmployee(null);
    setEmployeeInfo(null);
    setSelectedAssets([]); // Clear assets for guest tickets
    setSelectedSoftware([]); // Clear software for guest tickets
    form.setFieldsValue({ created_by_user_id: undefined });
    // Pre-fill guest name with search text if available
    if (searchText) {
      form.setFieldsValue({ guest_name: searchText });
    }
  }, [searchText, form]);

  const notFoundContent = useMemo(() => {
    if (searchText) {
      return (
        <div style={{ padding: '8px' }}>
          <Button
            type="link"
            icon={<UserAddOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleGuestSelection();
            }}
            block
          >
            Create Guest Ticket for "{searchText}"
          </Button>
        </div>
      );
    }
    return (
      <div style={{ padding: '12px 16px', textAlign: 'center', color: '#999' }}>
        No employees found
      </div>
    );
  }, [searchText, handleGuestSelection]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const ticketData = {
        is_guest: isGuestMode,
        title: values.title,
        description: values.description,
        priority: values.priority,
        category: values.category,
        // For employees, enforce service_request and general (backend also enforces this)
        ticket_type: isEmployeeSelfService ? 'service_request' : (values.ticket_type || 'incident'),
        service_type: isEmployeeSelfService ? 'general' : (values.service_type || 'general'),
        assigned_to_engineer_id: values.assigned_to_engineer_id || null,
        // Include asset_ids for Hardware category
        asset_ids: selectedCategory === 'Hardware' && selectedAssets.length > 0 ? selectedAssets : undefined,
        // Include software_installation_ids for Software category
        software_installation_ids: selectedCategory === 'Software' && selectedSoftware.length > 0 ? selectedSoftware : undefined
      };

      if (isGuestMode) {
        // Guest ticket
        ticketData.guest_name = values.guest_name;
        ticketData.guest_email = values.guest_email;
        ticketData.guest_phone = values.guest_phone || null;
        ticketData.created_by_user_id = null;
      } else if (isEmployeeSelfService) {
        // Employee self-service ticket (creating for themselves)
        ticketData.created_by_user_id = currentUser?.id;
      } else {
        // Coordinator/Admin/Engineer creating ticket for selected employee
        ticketData.created_by_user_id = values.created_by_user_id;
      }

      // Create ticket with assets (backend will link them before SLA initialization)
      const response = await ticketService.createTicket(ticketData);

      form.resetFields();
      setEmployeeInfo(null);
      setSelectedEmployee(null);
      setIsGuestMode(false);
      setSearchText('');
      setSelectedAssets([]);
      setSelectedSoftware([]);
      setSelectedCategory(null);
      onSuccess();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      message.error(
        error.response?.data?.message || 'Failed to create ticket'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEmployeeSelfService ? "Report an Issue" : "Create Support Ticket"}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEmployeeSelfService ? "Submit Issue" : "Create Ticket"}
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: 'medium',
          ticket_type: isEmployeeSelfService ? 'service_request' : 'incident',
          service_type: 'general'
        }}
      >
        {/* Employee/Guest Selection - Only for coordinators/admins/engineers */}
        {!isEmployeeSelfService && (
          <Form.Item
            name="created_by_user_id"
            label="Create Ticket For"
            rules={[
              {
                required: !isGuestMode,
                message: 'Please select an employee or choose guest'
              }
            ]}
          >
            <Select
              showSearch
              placeholder="Search by name, email, or employee ID"
              onChange={handleEmployeeChange}
              onSearch={handleSearch}
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return option.label.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={notFoundContent}
            >
              {employees.map((emp) => (
                <Option
                  key={emp.user_id}
                  value={emp.user_id}
                  label={`${emp.full_name || `${emp.first_name} ${emp.last_name}`} ${emp.email} ${emp.employee_id || ''}`}
                >
                  {emp.full_name || `${emp.first_name} ${emp.last_name}`} ({emp.employee_id || emp.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Display Employee Info (Inherited Data) */}
        {employeeInfo && !isGuestMode && (
          <Card size="small" className="mb-4" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
            <div className="text-sm">
              <div className="font-semibold mb-2" style={{ color: '#0050b3' }}>
                {isEmployeeSelfService ? 'Creating ticket for yourself:' : 'Ticket will be created for:'}
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: '#595959' }}>Employee:</div>
                  <div className="font-medium">{employeeInfo.name}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#595959' }}>Employee ID:</div>
                  <div className="font-medium">{employeeInfo.employee_id || 'N/A'}</div>
                </Col>
              </Row>
              <Row gutter={16} className="mt-2">
                <Col span={12}>
                  <div style={{ color: '#595959' }}>Department:</div>
                  <div className="font-medium">{employeeInfo.department}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#595959' }}>Location:</div>
                  <div className="font-medium">{employeeInfo.location}</div>
                </Col>
              </Row>
              <div className="mt-2 text-xs" style={{ color: '#8c8c8c' }}>
                Department and location will be automatically inherited from the employee
              </div>
            </div>
          </Card>
        )}

        {/* Guest Information Fields */}
        {isGuestMode && (
          <Card
            size="small"
            className="mb-4"
            style={{ backgroundColor: '#f0f5ff', borderColor: '#adc6ff' }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: '#1d39c4' }}>
              Guest Information
            </div>

            <Form.Item
              name="guest_name"
              label="Guest Name"
              rules={[
                { required: true, message: 'Please enter guest name' },
                { min: 2, message: 'Name must be at least 2 characters' }
              ]}
            >
              <Input placeholder="Full name of the guest" maxLength={100} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="guest_email"
                  label="Guest Email"
                  rules={[
                    { required: true, message: 'Please enter guest email' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input placeholder="guest@example.com" maxLength={255} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="guest_phone" label="Guest Phone (Optional)">
                  <Input placeholder="+1 234 567 8900" maxLength={20} />
                </Form.Item>
              </Col>
            </Row>

            <div className="text-xs" style={{ color: '#8c8c8c' }}>
              Guest tickets will not have department or location assigned
            </div>
          </Card>
        )}

        {/* Ticket Title */}
        <Form.Item
          name="title"
          label="Issue Title"
          rules={[
            { required: true, message: 'Please enter ticket title' },
            { min: 5, message: 'Title must be at least 5 characters' }
          ]}
        >
          <Input
            placeholder="Brief description of the issue"
            maxLength={200}
          />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Detailed Description"
          rules={[
            { required: true, message: 'Please enter description' },
            { min: 10, message: 'Description must be at least 10 characters' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Provide detailed information about the issue"
            maxLength={2000}
          />
        </Form.Item>

        {/* Issue Category - Moved before asset/software selection */}
        <Form.Item
          name="category"
          label="Issue Category"
          rules={[{ required: true, message: 'Please select an issue category' }]}
        >
          <Select
            placeholder="Select category to show related items"
            onChange={handleCategoryChange}
          >
            <Option value="Hardware">Hardware Issue</Option>
            <Option value="Software">Software Issue</Option>
            <Option value="Network">Network/Connectivity</Option>
            <Option value="Access">Access/Permission</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        {/* Asset/Software Selection - Only for employee tickets (not guests) and based on category */}
        {selectedEmployee && !isGuestMode && selectedCategory === 'Hardware' && (
          <>
            <Divider style={{ margin: '16px 0' }}>
              <LaptopOutlined /> Related Hardware Assets {isEmployeeSelfService ? '' : '(Optional)'}
            </Divider>
            {/* Show pre-selected asset info */}
            {preSelectedAsset && isEmployeeSelfService && (
              <Alert
                message={
                  <span>
                    <LaptopOutlined style={{ marginRight: 8 }} />
                    Reporting issue for: <strong>{preSelectedAsset.asset_tag}</strong> - {preSelectedAsset.product_name}
                  </span>
                }
                type="info"
                style={{ marginBottom: 12 }}
              />
            )}
            <AssetSelector
              userId={selectedEmployee}
              selectedAssets={selectedAssets}
              // onSelectionChange={setSelectedAssets}
             onSelectionChange={(assetIds, assetDetails) => {

  setSelectedAssets(assetIds);

  // Get first selected asset
  const asset = assetDetails?.[0];

  if (asset) {

setAssetLocation(
  asset.location_name ||
  asset.location_id ||
  ''
);

setAssetDepartment(
  asset.department_name ||
  asset.department_id ||
  ''
);


  } else {

    setAssetLocation('');
    setAssetDepartment('');
  }
}}
              disabled={loading}
              isSelfService={isEmployeeSelfService}
            />
            
{selectedAssets.length > 0 && (
  <Card
    size="small"
    style={{
      marginTop: 12,
      background: '#fafafa'
    }}
  >
    <Row gutter={16}>

      <Col span={12}>
        <strong>Location:</strong>

        <div>
          {assetLocation || 'N/A'}
        </div>
      </Col>

      <Col span={12}>
        <strong>Department:</strong>

        <div>
          {assetDepartment || 'N/A'}
        </div>
      </Col>

    </Row>
  </Card>
)}


            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                {isEmployeeSelfService
                  ? 'Select the hardware assets related to your issue.'
                  : 'Select hardware assets that are related to this issue. This helps engineers identify and track affected equipment.'}
              </span>
            </div>
          </>
        )}

        {/* Software Selection - Only for Software category */}
        {selectedEmployee && !isGuestMode && selectedCategory === 'Software' && (
          <>
            <Divider style={{ margin: '16px 0' }}>
              <AppstoreOutlined /> Related Software {isEmployeeSelfService ? '' : '(Optional)'}
            </Divider>
            <SoftwareSelector
              userId={selectedEmployee}
              selectedSoftware={selectedSoftware}
              onSelectionChange={setSelectedSoftware}
              disabled={loading}
              isSelfService={isEmployeeSelfService}
            />
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                {isEmployeeSelfService
                  ? 'Select the software installed on your assets that you are having issues with.'
                  : 'Select software installations that are related to this issue. This helps engineers identify affected applications.'}
              </span>
            </div>
          </>
        )}

        {/* Ticket Type and Service Type */}
        <Row gutter={16}>
          <Col span={12}>
            {/* Ticket Type */}
            <Form.Item
              name="ticket_type"
              label="Ticket Type"
              rules={[{ required: true, message: 'Please select ticket type' }]}
            >
              <Select
                placeholder="Select ticket type"
                disabled={isEmployeeSelfService}
              >
                <Option value="incident">Incident</Option>
                <Option value="service_request">Service Request</Option>
                <Option value="change_request">Change Request</Option>
                <Option value="problem">Problem</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Service Type */}
            <Form.Item
              name="service_type"
              label="Service Type"
              rules={[{ required: true, message: 'Please select service type' }]}
              tooltip={isEmployeeSelfService ? undefined : "Repair/Replace tickets will require a service report upon closure"}
            >
              <Select
                placeholder="Select service type"
                disabled={isEmployeeSelfService}
              >
                <Option value="general">General Support</Option>
                <Option value="repair">Repair Service</Option>
                <Option value="replace">Replacement Service</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Service Type Alert - Only shown for coordinators/admins/engineers */}
        {!isEmployeeSelfService && (serviceType === 'repair' || serviceType === 'replace') && (
          <Alert
            message={
              <span>
                <ToolOutlined style={{ marginRight: 8 }} />
                {serviceType === 'repair'
                  ? 'Repair Service Selected'
                  : 'Replacement Service Selected'}
              </span>
            }
            description={
              serviceType === 'repair'
                ? 'A service report will be required when closing this ticket. You can document spare parts used and repair details.'
                : 'A service report will be required when closing this ticket. You can document the replacement asset and any components transferred.'
            }
            type="info"
            showIcon={false}
            className="mb-4"
            style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}
          />
        )}

        {/* Priority */}
        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select placeholder="Select priority">
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="critical">Critical</Option>
            <Option value="emergency">Emergency</Option>
          </Select>
        </Form.Item>

        {/* Auto-Assign Engineer (Optional) - Only visible to coordinators/admins, hidden from employees */}
        {!isEngineerRole && !isEmployeeSelfService && (
          <Form.Item
            name="assigned_to_engineer_id"
            label="Assign to Engineer (Optional)"
            extra="Leave blank to assign later"
          >
            <Select
              allowClear
              placeholder="Search by name, email, or employee ID"
              showSearch
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return option.label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {engineers.map((eng) => (
                <Option
                  key={eng.user_id}
                  value={eng.user_id}
                  label={`${eng.full_name || `${eng.first_name || ''} ${eng.last_name || ''}`.trim()} ${eng.email || ''} ${eng.employee_id || ''}`}
                >
                  {eng.full_name || `${eng.first_name || ''} ${eng.last_name || ''}`.trim() || 'Unknown'} ({eng.employee_id || eng.department_name || 'No Dept'})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CreateTicketModal;
