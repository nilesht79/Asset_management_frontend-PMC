import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Card,
  Row,
  Col,
  message,
  Tag,
  Alert,
  Select,
  InputNumber,
  Divider,
  Table,
  Button,
  Typography
} from 'antd';
import {
  SendOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  SwapOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ticketService from '../../../services/ticket';
import serviceReportService from '../../../services/serviceReport';
import repairHistoryService from '../../../services/repairHistory';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const RequestCloseTicketModal = ({ visible, ticket, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [linkedAssets, setLinkedAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [availableParts, setAvailableParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [availableReplacementAssets, setAvailableReplacementAssets] = useState([]);
  const [loadingReplacementAssets, setLoadingReplacementAssets] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [faultTypes, setFaultTypes] = useState([]);
  const [loadingFaultTypes, setLoadingFaultTypes] = useState(false);

  const serviceType = ticket?.service_type;
  const isRepair = serviceType === 'repair';
  const isReplace = serviceType === 'replace';
  const requiresServiceReport = isRepair || isReplace;

  useEffect(() => {
    if (visible && ticket) {
      form.resetFields();
      setSelectedParts([]);
      setLinkedAssets([]);

      // Fetch linked assets for repair/replace tickets
      // if (requiresServiceReport) {
        fetchLinkedAssets();
      // }

      // Fetch available spare parts and fault types for repair
      if (isRepair) {
        fetchAvailableParts();
        fetchFaultTypes();
      }

      // Fetch available replacement assets for replace
      if (isReplace) {
        fetchReplacementAssets();
      }
    }
  }, [visible, ticket]);

  const fetchLinkedAssets = async () => {
    if (!ticket?.ticket_id) return;
    setLoadingAssets(true);
    try {
  console.log('FETCH LINKED ASSETS START');

  const response = await ticketService.getTicketAssets(ticket.ticket_id);

  console.log('TICKET ASSETS RESPONSE:', response);
  console.log('TICKET ASSETS RESPONSE DATA:', response.data);

  const assets = response.data?.data?.assets || [];

  console.log('ASSETS ARRAY:', assets);

  setLinkedAssets(assets);
} catch (err) {
  console.error('FETCH LINKED ASSETS ERROR:', err);
    }
    finally {
      setLoadingAssets(false);
    }
  };

  const fetchAvailableParts = async () => {
    setLoadingParts(true);
    try {
      const response = await serviceReportService.getAvailableSpareParts();
      setAvailableParts(response.data?.data?.parts || []);
    } catch (error) {
      console.error('Failed to fetch spare parts:', error);
    } finally {
      setLoadingParts(false);
    }
  };

  const fetchReplacementAssets = async () => {
    setLoadingReplacementAssets(true);
    try {
      const response = await serviceReportService.getAvailableReplacementAssets();
      setAvailableReplacementAssets(response.data?.data?.assets || []);
    } catch (error) {
      console.error('Failed to fetch replacement assets:', error);
    } finally {
      setLoadingReplacementAssets(false);
    }
  };

  const fetchFaultTypes = async () => {
    setLoadingFaultTypes(true);
    try {
      const response = await repairHistoryService.getFaultTypes({ is_active: true });
      const data = response.data?.data || response.data;
      const faultTypesData = data?.fault_types || data?.faultTypes || data;
      setFaultTypes(Array.isArray(faultTypesData) ? faultTypesData : []);
    } catch (error) {
      console.error('Failed to fetch fault types:', error);
      setFaultTypes([]);
    } finally {
      setLoadingFaultTypes(false);
    }
  };

  const handleAddPart = () => {
    setSelectedParts([
      ...selectedParts,
      {
        key: Date.now(),
        asset_id: null,
        quantity: 1,
        unit_cost: 0,
        notes: ''
      }
    ]);
  };

  const handleRemovePart = (key) => {
    setSelectedParts(selectedParts.filter(p => p.key !== key));
  };

  const handlePartChange = (key, field, value) => {
    setSelectedParts(selectedParts.map(p => {
      if (p.key === key) {
        const updated = { ...p, [field]: value };
        if (field === 'asset_id' && value) {
          const part = availableParts.find(ap => ap.asset_id === value);
          if (part?.purchase_cost) {
            updated.unit_cost = part.purchase_cost;
          }
        }
        return updated;
      }
      return p;
    }));
  };

  const calculateTotalPartsCost = () => {
    return selectedParts.reduce((sum, p) => sum + (p.quantity * (p.unit_cost || 0)), 0);
  };

  const handleSubmit = async (values) => {
    if (!ticket) return;

    // Validate parts selection for repair
    if (isRepair && selectedParts.length > 0) {
      const invalidParts = selectedParts.filter(p => !p.asset_id);
      if (invalidParts.length > 0) {
        message.error('Please select all spare parts or remove empty entries');
        return;
      }
    }

    setLoading(true);
    try {
      let serviceReportId = null;

      // Create draft service report for repair/replace tickets
      if (requiresServiceReport) {
        const reportData = {
          ticket_id: ticket.ticket_id,
          service_type: serviceType,
          asset_id: values.asset_id,
          replacement_asset_id: isReplace ? values.replacement_asset_id : null,
          fault_type_id: isRepair ? values.fault_type_id : null,
          diagnosis: values.diagnosis,
          work_performed: values.work_performed,
          condition_before: isRepair ? values.condition_before : null,
          condition_after: isRepair ? values.condition_after : null,
          total_parts_cost: calculateTotalPartsCost(),
          labor_cost: values.labor_cost || 0,
          engineer_notes: values.engineer_notes,
          parts_used: selectedParts.filter(p => p.asset_id).map(p => ({
            asset_id: p.asset_id,
            quantity: p.quantity,
            unit_cost: p.unit_cost,
            notes: p.notes
          }))
        };

        const reportResponse = await serviceReportService.createDraftReport(reportData);
        serviceReportId = reportResponse.data?.data?.report_id;
      }

      // Submit close request with service_report_id
      await ticketService.requestTicketClose(
        ticket.ticket_id,
        values.request_notes,
        serviceReportId
      );

      form.resetFields();
      setSelectedParts([]);
      message.success('Close request submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to request ticket close:', error);
      message.error(
        error.response?.data?.message || 'Failed to submit close request'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  const calculateDuration = () => {
    if (!ticket.created_at) return 'N/A';
    const created = new Date(ticket.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  };

  const partsColumns = [
    {
      title: 'Spare Part',
      dataIndex: 'asset_id',
      key: 'asset_id',
      width: '40%',
      render: (value, record) => (
        <Select
          value={value}
          onChange={(v) => handlePartChange(record.key, 'asset_id', v)}
          placeholder="Select spare part"
          loading={loadingParts}
          showSearch
          optionFilterProp="children"
          style={{ width: '100%' }}
          size="small"
        >
          {availableParts
            .filter(p => !selectedParts.find(sp => sp.asset_id === p.asset_id && sp.key !== record.key))
            .map(p => (
              <Option key={p.asset_id} value={p.asset_id}>
                {p.product_name} - {p.asset_tag}
              </Option>
            ))}
        </Select>
      )
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(v) => handlePartChange(record.key, 'quantity', v)}
          style={{ width: '100%' }}
          size="small"
        />
      )
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      width: '20%',
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(v) => handlePartChange(record.key, 'unit_cost', v)}
          style={{ width: '100%' }}
          size="small"
          prefix="₹"
        />
      )
    },
    {
      title: 'Total',
      key: 'total',
      width: '15%',
      render: (_, record) => (
        <Text>₹{((record.quantity || 0) * (record.unit_cost || 0)).toFixed(2)}</Text>
      )
    },
    {
      title: '',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemovePart(record.key)}
        />
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          {requiresServiceReport ? (
            isRepair ? (
              <ToolOutlined style={{ color: '#fa8c16' }} />
            ) : (
              <SwapOutlined style={{ color: '#722ed1' }} />
            )
          ) : (
            <SendOutlined style={{ color: '#1890ff' }} />
          )}
          <span>
            {requiresServiceReport
              ? `Request Close - ${isRepair ? 'Repair' : 'Replacement'} Service Report`
              : 'Request Ticket Closure'}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Submit Close Request"
      okButtonProps={{ type: 'primary' }}
      confirmLoading={loading}
      width={requiresServiceReport ? 900 : 650}
      destroyOnClose
    >
      {/* Info Alert */}
      <Alert
        message={requiresServiceReport ? "Service Report Required" : "Submit Close Request"}
        description={
          requiresServiceReport
            ? `This is a ${isRepair ? 'repair' : 'replacement'} ticket. Please fill in the service report details below. Your coordinator will review the service report along with the close request.`
            : "Your coordinator will review your request and can approve or reject it. Provide detailed resolution notes explaining what was done to resolve the ticket."
        }
        type={requiresServiceReport ? 'warning' : 'info'}
        showIcon
        className="mb-4"
      />

      {/* Ticket Info */}
      <Card size="small" className="mb-4" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold">Ticket1:</span>{' '}
              <Tag color="blue">{ticket.ticket_number}</Tag>
              {requiresServiceReport && (
                <Tag color={isRepair ? 'orange' : 'purple'}>
                  {isRepair ? 'REPAIR' : 'REPLACEMENT'}
                </Tag>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                <ClockCircleOutlined /> Duration
              </div>
              <div className="font-semibold">{calculateDuration()}</div>
            </div>
          </div>

          <div>
            <span className="font-semibold">Title:</span> {ticket.title}
          </div>

          <Row gutter={16} className="mt-2">
            <Col span={8}>
              <div className="text-xs text-gray-500">Priority</div>
              <Tag color={ticketService.getPriorityColor(ticket.priority)}>
                {ticketService.getPriorityDisplayName(ticket.priority).toUpperCase()}
              </Tag>
            </Col>
            <Col span={8}>
              <div className="text-xs text-gray-500">Status</div>
              <Tag color={ticketService.getStatusColor(ticket.status)}>
                {ticketService.getStatusDisplayName(ticket.status).toUpperCase()}
              </Tag>
            </Col>
            <Col span={8}>
              <div className="text-xs text-gray-500">Department</div>
              <div className="font-medium">{ticket.department_name || 'N/A'}</div>
            </Col>
            <Col span={24} style={{ marginTop: 8 }}>
              <div className="text-xs text-gray-500">Serial Number</div>
              <div className="font-medium">
                {linkedAssets.length > 0
                  ? linkedAssets.map(a => a.serial_number).filter(Boolean).join(', ')
                  : 'N/A'}
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{
          condition_before: 'poor',
          condition_after: 'good'
        }}
      >
        {/* Service Report Section - Only for repair/replace */}
        {requiresServiceReport && (
          <>
            <Divider>
              {isRepair ? <ToolOutlined /> : <SwapOutlined />} Service Report Details
            </Divider>

            {/* Asset Selection */}
            <Row gutter={16}>
              <Col span={isReplace ? 12 : 24}>
                <Form.Item
                  name="asset_id"
                  label="Asset Being Serviced"
                  rules={[{ required: true, message: 'Please select the asset' }]}
                >
                  <Select
                    placeholder="Select asset"
                    loading={loadingAssets}
                    disabled={linkedAssets.length === 1}
                  >
                    {linkedAssets.map(asset => (
                      <Option key={asset.asset_id} value={asset.asset_id}>
                        {asset.product_name || 'Asset'} - {asset.asset_tag}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {isReplace && (
                <Col span={12}>
                  <Form.Item
                    name="replacement_asset_id"
                    label="Replacement Asset"
                    rules={[{ required: true, message: 'Please select replacement asset' }]}
                  >
                    <Select
                      placeholder="Select replacement asset"
                      loading={loadingReplacementAssets}
                      showSearch
                      optionFilterProp="children"
                    >
                      {availableReplacementAssets.map(asset => (
                        <Option key={asset.asset_id} value={asset.asset_id}>
                          {asset.product_name} - {asset.asset_tag}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>

            {/* Fault Type - Only for Repair */}
            {isRepair && (
              <Form.Item
                name="fault_type_id"
                label="Fault Type"
                rules={[{ required: true, message: 'Please select fault type' }]}
              >
                <Select
                  placeholder="Select fault type"
                  loading={loadingFaultTypes}
                  showSearch
                  optionFilterProp="children"
                >
                  {faultTypes.map(ft => (
                    <Option key={ft.fault_type_id} value={ft.fault_type_id}>
                      {ft.category ? `[${ft.category}] ` : ''}{ft.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* Diagnosis */}
            <Form.Item
              name="diagnosis"
              label="Diagnosis / Problem Found"
              rules={[
                { required: true, message: 'Please enter diagnosis' },
                { min: 10, message: 'Diagnosis must be at least 10 characters' }
              ]}
            >
              <TextArea
                rows={2}
                placeholder="Describe the problem found during inspection..."
                maxLength={5000}
                showCount
              />
            </Form.Item>

            {/* Work Performed */}
            <Form.Item
              name="work_performed"
              label="Work Performed"
              rules={[
                { required: true, message: 'Please describe work performed' },
                { min: 10, message: 'Work description must be at least 10 characters' }
              ]}
            >
              <TextArea
                rows={2}
                placeholder="Describe the repair/replacement work performed..."
                maxLength={5000}
                showCount
              />
            </Form.Item>

            {/* Condition Before/After - Only for Repair */}
            {isRepair && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="condition_before"
                    label="Condition Before Service"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Select placeholder="Select condition">
                      <Option value="excellent">Excellent</Option>
                      <Option value="good">Good</Option>
                      <Option value="fair">Fair</Option>
                      <Option value="poor">Poor</Option>
                      <Option value="damaged">Damaged</Option>
                      <Option value="non_functional">Non-Functional</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="condition_after"
                    label="Condition After Service"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Select placeholder="Select condition">
                      <Option value="excellent">Excellent</Option>
                      <Option value="good">Good</Option>
                      <Option value="fair">Fair</Option>
                      <Option value="new">New (Replaced)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}

            {/* Spare Parts - Only for Repair */}
            {isRepair && (
              <>
                <Divider orientation="left" plain>
                  <ToolOutlined /> Spare Parts Used (Optional)
                </Divider>

                <Card size="small" className="mb-4">
                  <Table
                    dataSource={selectedParts}
                    columns={partsColumns}
                    pagination={false}
                    size="small"
                    locale={{ emptyText: 'No spare parts added' }}
                  />
                  <Button
                    type="dashed"
                    onClick={handleAddPart}
                    icon={<PlusOutlined />}
                    style={{ width: '100%', marginTop: 8 }}
                    size="small"
                  >
                    Add Spare Part
                  </Button>

                  {selectedParts.length > 0 && (
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <Text strong>Total Parts Cost: ₹{calculateTotalPartsCost().toFixed(2)}</Text>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Labor Cost */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="labor_cost"
                  label="Labor Cost (Optional)"
                >
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                    prefix="₹"
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="engineer_notes"
                  label="Additional Notes (Optional)"
                >
                  <Input placeholder="Any additional notes..." />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Resolution Summary</Divider>
          </>
        )}

        {/* Resolution Notes - Always Required */}
        <Form.Item
          name="request_notes"
          label="Resolution Notes"
          rules={[
            { required: true, message: 'Please provide resolution notes' },
            { min: 20, message: 'Please provide at least 20 characters describing the resolution' }
          ]}
        >
          <TextArea
            rows={requiresServiceReport ? 3 : 6}
            placeholder={requiresServiceReport
              ? "Summary of work completed and any recommendations..."
              : `Describe what was done to resolve this ticket... (minimum 20 characters)

Example:
- Diagnosed the issue as a faulty network cable
- Replaced the cable with a new one
- Tested the connection and verified internet access
- Issue is now resolved and user can access the network`}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Alert
          message="Important"
          description="After submitting, the ticket status will change to 'Pending Closure' and await coordinator approval."
          type="warning"
          showIcon
          className="mt-2"
        />
      </Form>
    </Modal>
  );
};

export default RequestCloseTicketModal;
