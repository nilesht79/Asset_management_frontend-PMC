import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Modal, Form, Input, Select, Row, Col, message, Spin } from 'antd'
import { EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons'
import { createLocation, updateLocation } from '../../../../store/slices/masterSlice'
import masterService from '../../../../services/master'

const { TextArea } = Input
const { Option } = Select

const LocationMainForm = ({ open, mode, location, onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  
  // State for dropdown data
  const [clients, setClients] = useState([])
  const [locationTypes, setLocationTypes] = useState([])
  
  // State for pincode lookup
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeData, setPincodeData] = useState(null)
  
  // Load initial dropdown data
  useEffect(() => {
    if (open) {
      loadDropdownData()
    }
  }, [open])

  const loadDropdownData = async () => {
    try {
      // Load all dropdown data in parallel
      const [clientsRes, typesRes] = await Promise.all([
        masterService.getClientsDropdown(),
        masterService.getLocationTypesDropdown()
      ])
      
      setClients(clientsRes.data.data || [])
      setLocationTypes(typesRes.data.data || [])
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      message.error('Failed to load form data')
    }
  }

  // Handle pincode lookup
  const handlePincodeChange = async (event) => {
    const pincode = event.target.value.trim()
    
    // Reset location data when pincode changes
    setPincodeData(null)
    
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return
    }
    
    try {
      setPincodeLoading(true)
      const response = await masterService.lookupPincode(pincode)
      
      if (response.data.success) {
        const locationData = response.data.data
        setPincodeData(locationData)
        
        // Auto-fill city and state fields
        form.setFieldsValue({
          city_name: locationData.city,
          state_name: locationData.state,
          area_name: locationData.area
        })
        
        message.success('Location details loaded successfully')
      }
    } catch (error) {
      console.error('Pincode lookup error:', error)
      if (error.response?.status === 404) {
        message.warning('No data found for this pincode')
      } else if (error.response?.status === 400) {
        message.error('Invalid pincode format')
      } else {
        message.error('Failed to lookup pincode details')
      }
    } finally {
      setPincodeLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && location) {
        form.setFieldsValue({
          name: location.name,
          address: location.address,
          client_id: location.client_id,
          location_type_id: location.location_type_id,
          pincode: location.pincode,
          state_name: location.state_name,
          city_name: location.city_name,
          area_name: location.area_name,
          building: location.building,
          floor: location.floor,
          contact_person: location.contact_person,
          contact_email: location.contact_email,
          contact_phone: location.contact_phone
        })
      } else {
        form.resetFields()
        setPincodeData(null)
      }
    }
  }, [open, mode, location, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      const payload = {
        name: values.name,
        address: values.address,
        client_id: values.client_id || null,
        location_type_id: values.location_type_id,
        pincode: values.pincode,
        state_name: values.state_name,
        city_name: values.city_name,
        area_name: values.area_name,
        building: values.building || '',
        floor: values.floor || '',
        contact_person: values.contact_person || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || ''
      }
      
      if (mode === 'edit') {
        await dispatch(updateLocation({ 
          id: location.id, 
          data: payload 
        })).unwrap()
        message.success('Location updated successfully')
      } else {
        await dispatch(createLocation(payload)).unwrap()
        message.success('Location created successfully')
      }
      
      onSuccess()
    } catch (error) {
      console.error('Form submission error:', error)
      message.error(error.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} location`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <EnvironmentOutlined className="text-white text-sm" />
          </div>
          <span className="text-xl font-semibold">
            {mode === 'edit' ? 'Edit Location' : 'Create New Location'}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      width={800}
      okText={mode === 'edit' ? 'Update Location' : 'Create Location'}
      cancelText="Cancel"
      confirmLoading={loading}
    >
      <div className="py-4">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Location Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter location name' },
                  { min: 2, max: 100, message: 'Name must be between 2-100 characters' }
                ]}
              >
                <Input placeholder="Enter location name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Select Client"
                name="client_id"
              >
                <Select
                  placeholder="Select client (optional)"
                  loading={!Array.isArray(clients) || clients.length === 0}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {Array.isArray(clients) && clients.map(client => (
                    <Option key={client.value} value={client.value}>
                      {client.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Location Type"
                name="location_type_id"
                rules={[{ required: true, message: 'Please select location type' }]}
              >
                <Select 
                  placeholder="Select location type"
                  loading={locationTypes.length === 0}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {locationTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contact Person"
                name="contact_person"
                rules={[
                  { min: 2, max: 100, message: 'Name must be between 2-100 characters' }
                ]}
              >
                <Input placeholder="Enter contact person name (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Contact Email"
                name="contact_email"
                rules={[
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter contact email (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contact Phone"
                name="contact_phone"
              >
                <Input placeholder="Enter contact phone (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Location Address"
                name="address"
                rules={[
                  { required: true, message: 'Please enter location address' },
                  { max: 500, message: 'Address cannot exceed 500 characters' }
                ]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter complete address"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="PinCode"
                name="pincode">
                <Input
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  onChange={handlePincodeChange}
                  suffix={pincodeLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="State"
                name="state_name">
                <Input
                  placeholder="State (auto-filled)"
                  readOnly={!!pincodeData}
                  style={{ backgroundColor: pincodeData ? '#f6f6f6' : 'white' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="City"
                name="city_name">
                <Input
                  placeholder="City (auto-filled)"
                  readOnly={!!pincodeData}
                  style={{ backgroundColor: pincodeData ? '#f6f6f6' : 'white' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Area"
                name="area_name"
              >
                <Input
                  placeholder="Area (auto-filled)"
                  readOnly={!!pincodeData}
                  style={{ backgroundColor: pincodeData ? '#f6f6f6' : 'white' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Building"
                name="building"
              >
                <Input placeholder="Enter building name/number (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Floor"
                name="floor"
              >
                <Input placeholder="Enter floor number (optional)" />
              </Form.Item>
            </Col>
          </Row>

          {pincodeData && (
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)', 
                  borderRadius: '10px', 
                  border: '1px solid #2563eb',
                  marginBottom: '16px',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    borderRadius: '0 0 0 100px'
                  }} />
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '16px', 
                    color: '#ffffff', 
                    marginBottom: '16px', 
                    fontWeight: 700,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <EnvironmentOutlined style={{ marginRight: '12px', fontSize: '20px', color: '#60a5fa' }} />
                    Location Details Verified
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.95)', lineHeight: '1.7', position: 'relative', zIndex: 1 }}>
                    {pincodeData.postOffices?.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, minWidth: '150px', color: '#bfdbfe', fontSize: '13px' }}>Available Post Offices:</span>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{pincodeData.postOffices.map(po => po.name).join(', ')}</span>
                      </div>
                    )}
                    {pincodeData.alternativeStates?.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, minWidth: '150px', color: '#bfdbfe', fontSize: '13px' }}>Alternative States:</span>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>{pincodeData.alternativeStates.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Form>
      </div>
    </Modal>
  )
}

export default LocationMainForm
