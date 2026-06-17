import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Card, Row, Col, message, Divider, Alert, Spin } from 'antd';
import { LaptopOutlined, AppstoreOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import ticketService from '../../../services/ticket';
import AssetSelector from './AssetSelector';
import SoftwareSelector from './SoftwareSelector';

const { Option } = Select;
const { TextArea } = Input;

/**
 * EditTicketModal Component
 * Allows coordinators to edit ticket details including title, description,
 * category, priority, ticket_type, service_type, and linked assets/software
 */
const EditTicketModal = ({ visible, ticket, onClose, onSuccess, currentUser }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedSoftware, setSelectedSoftware] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [originalCategory, setOriginalCategory] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState(null);

  useEffect(() => {
    if (visible && ticket) {
      initializeForm();
    }
  }, [visible, ticket]);

  const initializeForm = async () => {
    setInitialLoading(true);
    try {
      // Fetch engineers
      await fetchEngineers();

      // Set form values from ticket
      form.setFieldsValue({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        ticket_type: ticket.ticket_type,
        service_type: ticket.service_type,
        assigned_to_engineer_id: ticket.assigned_to_engineer_id
      });

      setSelectedCategory(ticket.category);
      setOriginalCategory(ticket.category);
      setSelectedServiceType(ticket.service_type);

      // Fetch current linked assets/software based on category
      if (ticket.category === 'Hardware') {
        await fetchCurrentAssets();
      } else if (ticket.category === 'Software') {
        await fetchCurrentSoftware();
      }
    } catch (error) {
      console.error('Error initializing edit form:', error);
      message.error('Failed to load ticket data');
    } finally {
      setInitialLoading(false);
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

  const fetchCurrentAssets = async () => {
    try {
      const response = await ticketService.getTicketAssets(ticket.ticket_id);
      const data = response.data?.data || response.data;
      const assets = data.assets || [];
      setSelectedAssets(assets.map(a => a.asset_id));
    } catch (error) {
      console.error('Failed to fetch current assets:', error);
      setSelectedAssets([]);
    }
  };

  const fetchCurrentSoftware = async () => {
    try {
      const response = await ticketService.getTicketSoftware(ticket.ticket_id);
      const data = response.data?.data || response.data;
      const software = data.software || [];
      setSelectedSoftware(software.map(s => s.software_installation_id));
    } catch (error) {
      console.error('Failed to fetch current software:', error);
      setSelectedSoftware([]);
    }
  };

  const handleCategoryChange = async (category) => {
    const previousCategory = selectedCategory;
    setSelectedCategory(category);

    // When category changes, reset the appropriate selections
    if (previousCategory !== category) {
      if (category === 'Hardware') {
        setSelectedSoftware([]);
        // If switching TO Hardware, try to load existing assets
        if (originalCategory === 'Hardware') {
          await fetchCurrentAssets();
        } else {
          setSelectedAssets([]);
        }
      } else if (category === 'Software') {
        setSelectedAssets([]);
        // If switching TO Software, try to load existing software
        if (originalCategory === 'Software') {
          await fetchCurrentSoftware();
        } else {
          setSelectedSoftware([]);
        }
      } else {
        // Network, Access, Other - clear both
        setSelectedAssets([]);
        setSelectedSoftware([]);
      }
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const updateData = {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        ticket_type: values.ticket_type,
        service_type: values.service_type,
        assigned_to_engineer_id: values.assigned_to_engineer_id || null
      };

      // Include asset_ids for Hardware category
      if (selectedCategory === 'Hardware') {
        updateData.asset_ids = selectedAssets;
      }

      // Include software_installation_ids for Software category
      if (selectedCategory === 'Software') {
        updateData.software_installation_ids = selectedSoftware;
      }

      await ticketService.updateTicket(ticket.ticket_id, updateData);

      message.success('Ticket updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to update ticket:', error);
      message.error(error.response?.data?.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedAssets([]);
    setSelectedSoftware([]);
    setSelectedCategory(null);
    setOriginalCategory(null);
    setSelectedServiceType(null);
    onClose();
  };

  // Get employee/creator info from ticket
  const getCreatorInfo = () => {
    if (ticket?.is_guest) {
      return {
        name: ticket.guest_name || 'Guest',
        email: ticket.guest_email,
        isGuest: true
      };
    }
    return {
      name: ticket?.created_by_user_name || 'Unknown',
      email: ticket?.created_by_user_email,
      department: ticket?.department_name,
      location: ticket?.location_name,
      isGuest: false
    };
  };

  const creatorInfo = ticket ? getCreatorInfo() : null;

  return (
    <Modal
      title={
        <span>
          <EditOutlined style={{ marginRight: 8 }} />
          Edit Ticket: {ticket?.ticket_number}
        </span>
      }
      open={visible}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="Save Changes"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      {initialLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin tip="Loading ticket data..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Creator Info (Read-only) */}
          {creatorInfo && (
            <Card
              size="small"
              className="mb-4"
              style={{
                backgroundColor: creatorInfo.isGuest ? '#f0f5ff' : '#e6f7ff',
                borderColor: creatorInfo.isGuest ? '#adc6ff' : '#91d5ff'
              }}
            >
              <div className="text-sm">
                <div className="font-semibold mb-2" style={{ color: '#0050b3' }}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  {creatorInfo.isGuest ? 'Guest Ticket' : 'Ticket Created By'}
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ color: '#595959' }}>Name:</div>
                    <div className="font-medium">{creatorInfo.name}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#595959' }}>Email:</div>
                    <div className="font-medium">{creatorInfo.email || 'N/A'}</div>
                  </Col>
                </Row>
                {!creatorInfo.isGuest && (
                  <Row gutter={16} className="mt-2">
                    <Col span={12}>
                      <div style={{ color: '#595959' }}>Department:</div>
                      <div className="font-medium">{creatorInfo.department || 'Not Assigned'}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#595959' }}>Location:</div>
                      <div className="font-medium">{creatorInfo.location || 'Not Assigned'}</div>
                    </Col>
                  </Row>
                )}
              </div>
            </Card>
          )}

          
          {/* Issue Category */}
          <Form.Item
            name="category"
            label="Issue Category"
            rules={[{ required: true, message: 'Please select an issue category' }]}
          >
            <Select
              placeholder="Select category"
              onChange={handleCategoryChange}
            >
              <Option value="Hardware">Hardware Issue</Option>
              <Option value="Software">Software Issue</Option>
              <Option value="Network">Network/Connectivity</Option>
              <Option value="Access">Access/Permission</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          {/* Ticket Title */}
          <Form.Item
            name="title"
            label="Issue Title"
            rules={[
              { required: true, message: 'Please enter ticket title' },
              { min: 5, message: 'Title must be at least 5 characters' }
            ]}
          >
            <Input placeholder="Brief description of the issue" maxLength={200} />
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


          {/* Category Change Warning */}
          {originalCategory && selectedCategory && originalCategory !== selectedCategory && (
            <Alert
              message="Category Changed"
              description={
                originalCategory === 'Hardware' && selectedCategory !== 'Hardware'
                  ? 'Changing from Hardware will remove all linked assets.'
                  : originalCategory === 'Software' && selectedCategory !== 'Software'
                  ? 'Changing from Software will remove all linked software.'
                  : 'You can now select new related items for this category.'
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Asset Selection - Only for Hardware category */}
          {selectedCategory === 'Hardware' && ticket?.created_by_user_id && (
            <>
              <Divider style={{ margin: '16px 0' }}>
                <LaptopOutlined /> Related Hardware Assets (Optional)
              </Divider>
              <AssetSelector
                userId={ticket.created_by_user_id}
                selectedAssets={selectedAssets}
                onSelectionChange={setSelectedAssets}
                disabled={loading}
                isSelfService={false}
              />
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  Select hardware assets related to this issue.
                </span>
              </div>
            </>
          )}

          {/* Software Selection - Only for Software category */}
          {selectedCategory === 'Software' && ticket?.created_by_user_id && (
            <>
              <Divider style={{ margin: '16px 0' }}>
                <AppstoreOutlined /> Related Software (Optional)
              </Divider>
              <SoftwareSelector
                userId={ticket.created_by_user_id}
                selectedSoftware={selectedSoftware}
                onSelectionChange={setSelectedSoftware}
                disabled={loading}
                isSelfService={false}
              />
              <div style={{ marginTop: 8, marginBottom: 16 }}>
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  Select software installations related to this issue.
                </span>
              </div>
            </>
          )}

          {/* Ticket Type and Service Type */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ticket_type"
                label="Ticket Type"
                rules={[{ required: true, message: 'Please select ticket type' }]}
              >
                <Select placeholder="Select ticket type">
                  <Option value="incident">Incident</Option>
                  <Option value="service_request">Service Request</Option>
                  <Option value="change_request">Change Request</Option>
                  <Option value="problem">Problem</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="service_type"
                label="Service Type"
                rules={[{ required: true, message: 'Please select service type' }]}
                tooltip="Repair/Replace tickets require a service report upon closure"
              >
                <Select placeholder="Select service type" onChange={(value) => setSelectedServiceType(value)}>
                  <Option value="general">General Support</Option>
                  <Option value="repair">Repair Service</Option>
                  <Option value="replace">Replacement Service</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {(selectedServiceType === 'repair' || selectedServiceType === 'replace') && (
            <Alert
              message="Service Report Required"
              description={`Selecting ${selectedServiceType === 'repair' ? 'Repair' : 'Replacement'} service type will auto-generate a draft service report. The engineer must complete the service report details when requesting ticket closure.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
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

          {/* Assign Engineer */}
          <Form.Item
            name="assigned_to_engineer_id"
            label="Assigned Engineer"
            extra="Leave blank to unassign"
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
        </Form>
      )}
    </Modal>
  );
};

export default EditTicketModal;
