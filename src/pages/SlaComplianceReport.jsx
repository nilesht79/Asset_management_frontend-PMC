import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Statistic,
  Tag,
  Typography,
  Space,
  Progress,
  Radio,
  Tabs,
  message,
  Empty,
  Spin,
  Tooltip,
  Divider,
  Flex
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  PieChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  TagsOutlined
} from '@ant-design/icons';
import slaService from '../services/sla';
import masterService from '../services/master';
import departmentService from '../services/department';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SlaComplianceReport = () => {
  const [loading, setLoading] = useState(false);
  const [ticketPagination, setTicketPagination] = useState({
  current: 1,
  pageSize: 20,
});
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    departments: [],
    categories: [],
    subCategories: [],
    oems: [],
    products: []
  });

  // Filters
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [frequency, setFrequency] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [assetCategoryId, setAssetCategoryId] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [oemId, setOemId] = useState(null);
  const [productModel, setProductModel] = useState(null);
  const [slaMet, setSlaMet] = useState(null);

  useEffect(() => {
    loadFilterOptions();
    fetchReport();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load locations
      const locationsRes = await masterService.getLocations();
      const locations = locationsRes.data?.data?.locations || locationsRes.data?.data || [];

      // Load departments
      const deptsRes = await departmentService.getDepartments();
      const departments = deptsRes.data?.data?.departments || deptsRes.data?.data || [];

      // Load asset categories
      const categoriesRes = await masterService.getCategories();
      const categories = categoriesRes.data?.data?.categories || categoriesRes.data?.data || [];

      // const subCategoriesRes = await masterService.getSubCategories();
      const subCategoriesRes = await masterService.getProductSubCategories({
          limit: 1000
      });
      const subCategories = subCategoriesRes.data?.data?.subcategories || subCategoriesRes.data?.data || [];

      // Load OEMs
      const oemsRes = await masterService.getOEMs();
      const oems = oemsRes.data?.data?.oems || oemsRes.data?.data || [];

      // Load Products
      const productsRes = await masterService.getProducts({ limit: 500 });
      const products = productsRes.data?.data?.products || productsRes.data?.data || [];

      setFilterOptions({
        locations,
        departments,
        categories,
        subCategories,
        oems,
        products
      });
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const fetchReport = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD')
      };

      if (frequency) params.frequency = frequency;
      if (locationId) params.location_id = locationId;
      if (departmentId) params.department_id = departmentId;
      if (assetCategoryId) params.asset_category_id = assetCategoryId;
      if (subCategoryId) params.sub_category_id = subCategoryId;
      if (oemId) params.oem_id = oemId;
      if (productModel) params.product_model = productModel;
      if (slaMet !== null) params.met_sla = slaMet;

      const response = await slaService.getComplianceReport(params);
      setReportData(response.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      message.error('Failed to load SLA compliance report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Please select a date range');
      return;
    }

    setExporting(true);
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD')
      };

      if (frequency) params.frequency = frequency;
      if (locationId) params.location_id = locationId;
      if (departmentId) params.department_id = departmentId;
      if (assetCategoryId) params.asset_category_id = assetCategoryId;
      if (oemId) params.oem_id = oemId;
      if (productModel) params.product_model = productModel;
      if (slaMet !== null) params.met_sla = slaMet;

      await slaService.exportComplianceReport(params);
      message.success('Report exported successfully');
    } catch (error) {
      console.error('Failed to export report:', error);
      message.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleFrequencyPreset = (preset) => {
    const today = dayjs();
    let start, end;

    switch (preset) {
      case 'today':
        start = today.startOf('day');
        end = today.endOf('day');
        setFrequency('daily');
        break;
      case 'week':
        start = today.startOf('week');
        end = today.endOf('week');
        setFrequency('daily');
        break;
      case 'month':
        start = today.startOf('month');
        end = today.endOf('month');
        setFrequency('weekly');
        break;
      case 'quarter':
        start = today.startOf('quarter');
        end = today.endOf('quarter');
        setFrequency('monthly');
        break;
      case 'year':
        start = today.startOf('year');
        end = today;
        setFrequency('monthly');
        break;
      default:
        return;
    }

    setDateRange([start, end]);
  };

  const handleResetFilters = () => {
    setDateRange([dayjs().subtract(30, 'day'), dayjs()]);
    setFrequency(null);
    setLocationId(null);
    setDepartmentId(null);
    setAssetCategoryId(null);
    setSubCategoryId(null);
    setOemId(null);
    setProductModel(null);
    setSlaMet(null);
  };

  // Table columns for period breakdown
  const periodColumns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 120
    },
    {
      title: 'Total Tickets',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      width: 120,
      align: 'center'
    },
    {
      title: 'Within SLA',
      dataIndex: 'resolved_within_sla',
      key: 'resolved_within_sla',
      width: 120,
      align: 'center',
      render: (val) => <Tag color="green">{val}</Tag>
    },
    {
      title: 'Breached',
      dataIndex: 'resolved_breached',
      key: 'resolved_breached',
      width: 100,
      align: 'center',
      render: (val) => <Tag color="red">{val}</Tag>
    },
    {
      title: 'Compliance Rate',
      dataIndex: 'compliance_rate',
      key: 'compliance_rate',
      width: 150,
      align: 'center',
      render: (val) => (
        <Progress
          percent={val || 0}
          size="small"
          status={val >= 80 ? 'success' : val >= 60 ? 'normal' : 'exception'}
          format={(p) => `${p}%`}
        />
      )
    },
    {
      title: 'Avg Resolution',
      dataIndex: 'avg_resolution_minutes',
      key: 'avg_resolution_minutes',
      width: 130,
      align: 'center',
      render: (val) => slaService.formatDuration(val)
    }
  ];

  // Table columns for location/department breakdown
  const breakdownColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => record.location_name || record.department_name || '-'
    },
    {
      title: 'Total Tickets',
      dataIndex: 'total_tickets',
      key: 'total_tickets',
      width: 120,
      align: 'center'
    },
    {
      title: 'Within SLA',
      dataIndex: 'resolved_within_sla',
      key: 'resolved_within_sla',
      width: 120,
      align: 'center',
      render: (val) => <Tag color="green">{val}</Tag>
    },
    {
      title: 'Compliance Rate',
      dataIndex: 'compliance_rate',
      key: 'compliance_rate',
      width: 150,
      align: 'center',
      render: (val) => (
        <Progress
          percent={val || 0}
          size="small"
          status={val >= 80 ? 'success' : val >= 60 ? 'normal' : 'exception'}
          format={(p) => `${p}%`}
        />
      )
    }
  ];

  const subCategoryColumns = [
  {
    title: 'Sub Category',
    dataIndex: 'sub_category_name',
    key: 'sub_category_name'
  },
  {
    title: 'Total Tickets',
    dataIndex: 'total_tickets',
    key: 'total_tickets',
    align: 'center'
  },
  {
    title: 'Within SLA',
    dataIndex: 'resolved_within_sla',
    key: 'resolved_within_sla',
    align: 'center',
    render: (val) => <Tag color="green">{val}</Tag>
  },
  {
    title: 'Compliance Rate',
    dataIndex: 'compliance_rate',
    key: 'compliance_rate',
    align: 'center',
    render: (val) => (
      <Progress percent={val || 0} size="small" />
    )
  }
];

  // Table columns for ticket details
  const detailColumns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 120,
      fixed: 'left'
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
    title: 'Sub Category',
    dataIndex: 'sub_category_name',
    key: 'sub_category_name',
    width: 180
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => (
        <Tag color={slaService.getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      width: 120
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120
    },
    {
      title: 'Engineer',
      dataIndex: 'engineer_name',
      key: 'engineer_name',
      width: 120
    },
    {
      title: 'SLA Rule',
      dataIndex: 'rule_name',
      key: 'rule_name',
      width: 150
    },
    {
      title: 'Resolution Time',
      dataIndex: 'business_elapsed_minutes',
      key: 'business_elapsed_minutes',
      width: 130,
      align: 'center',
      render: (val) => slaService.formatDuration(val)
    },
    {
      title: 'Max TAT',
      dataIndex: 'max_tat_minutes',
      key: 'max_tat_minutes',
      width: 100,
      align: 'center',
      render: (val) => slaService.formatDuration(val)
    },
    {
      title: 'SLA Met',
      dataIndex: 'met_sla',
      key: 'met_sla',
      width: 100,
      align: 'center',
      render: (val) => (
        val ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Yes</Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>No</Tag>
        )
      )
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolved_at',
      key: 'resolved_at',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  const summary = reportData?.summary || {};
  const complianceRate = summary.compliance_rate || 0;

  // Tab items configuration
  const tabItems = [
    ...(reportData?.by_period && reportData.by_period.length > 0 ? [{
      key: 'period',
      label: <span><BarChartOutlined /> By Period</span>,
      children: (
        <Card title="Period Breakdown">
          <Table
            dataSource={reportData.by_period}
            columns={periodColumns}
            rowKey="period"
            pagination={false}
            size="middle"
          />
        </Card>
      )
    }] : []),
    {
      key: 'location',
      label: <span><EnvironmentOutlined /> By Location</span>,
      children: (
        <Card title="Location Breakdown">
          {reportData?.by_location && reportData.by_location.length > 0 ? (
            <Table
              dataSource={reportData.by_location}
              columns={breakdownColumns}
              rowKey="location_id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="No location data available" />
          )}
        </Card>
      )
    },
    {
      key: 'department',
      label: <span><TeamOutlined /> By Department</span>,
      children: (
        <Card title="Department Breakdown">
          {reportData?.by_department && reportData.by_department.length > 0 ? (
            <Table
              dataSource={reportData.by_department}
              columns={breakdownColumns}
              rowKey="department_id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="No department data available" />
          )}
        </Card>
      )
    },
    {
      key: 'details',
      label: <span><ClockCircleOutlined /> Ticket Details</span>,
      children: (
        <Card title="Detailed Ticket List">
          {reportData?.details && reportData.details.length > 0 ? (
            <Table
              dataSource={reportData.details}
              columns={detailColumns}
              rowKey="ticket_id"
              pagination={{
                  current: ticketPagination.current,
                  pageSize: ticketPagination.pageSize,
                  total: reportData?.details?.length || 0,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: (page, pageSize) => {
                    setTicketPagination({
                      current: page,
                      pageSize,
                    });
                  },
                }}
              size="small"
              scroll={{ x: 1600 }}
            />
          ) : (
            <Empty description="No ticket data available" />
          )}
        </Card>
      )
    },
    {
      key: 'subcategory',
      label: <span><TagsOutlined />By Sub Category</span>,
      children: (
        <Card title="Sub Category Breakdown">
          {reportData?.by_sub_category &&
          reportData.by_sub_category.length > 0 ? (
            <Table
              dataSource={reportData.by_sub_category}
              columns={subCategoryColumns}
              rowKey="sub_category_id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="No sub category data available" />
          )}
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <PieChartOutlined style={{ marginRight: 8 }} />
            SLA Compliance Report
          </Title>
          <Text type="secondary">
            Track SLA performance: (Tickets Resolved Within SLA) / (Total Tickets Due Within SLA)
          </Text>
        </div>
        {reportData && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            Export to Excel
          </Button>
        )}
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        {/* Date & Time Filters */}
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} lg={6}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Date Range</Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={10}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Quick Presets</Text>
            <Space.Compact>
              <Button onClick={() => handleFrequencyPreset('today')}>Today</Button>
              <Button onClick={() => handleFrequencyPreset('week')}>This Week</Button>
              <Button onClick={() => handleFrequencyPreset('month')}>This Month</Button>
              <Button onClick={() => handleFrequencyPreset('quarter')}>This Quarter</Button>
              <Button onClick={() => handleFrequencyPreset('year')}>This Year</Button>
            </Space.Compact>
          </Col>
          <Col xs={24} lg={8}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Group By</Text>
            <Radio.Group
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              style={{ display: 'flex', flexWrap: 'wrap' }}
            >
              <Radio.Button value={null}>None</Radio.Button>
              <Radio.Button value="daily">Daily</Radio.Button>
              <Radio.Button value="weekly">Weekly</Radio.Button>
              <Radio.Button value="monthly">Monthly</Radio.Button>
              <Radio.Button value="quarterly">Quarterly</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* Entity Filters */}
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Location</Text>
            <Select
              value={locationId}
              onChange={setLocationId}
              placeholder="All Locations"
              allowClear
              showSearch
              optionFilterProp="label"
              optionLabelProp="label"
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
            >
              {filterOptions.locations.map(loc => {
                const isValidValue = (val) => val && !['NA', 'N/A', 'NULL', 'null', '-'].includes(String(val).trim().toUpperCase());
                const details = [loc.building, loc.floor].filter(isValidValue).join(', ');
                const displayText = details ? `${loc.name} (${details})` : loc.name;
                return (
                  <Option key={loc.id} value={loc.id} label={displayText}>
                    <Tooltip title={displayText} placement="right">
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayText}
                      </div>
                    </Tooltip>
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Department</Text>
            <Select
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="All Departments"
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {filterOptions.departments
                .filter(dept => dept.id || dept.department_id)
                .map(dept => (
                  <Option key={dept.id || dept.department_id} value={dept.id || dept.department_id}>
                    {dept.name || dept.department_name}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Asset Category</Text>
            <Select
              value={assetCategoryId}
              onChange={setAssetCategoryId}
              placeholder="All Categories"
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong>Sub Category</Text>
          
            <Select
              value={subCategoryId}
              onChange={setSubCategoryId}
              placeholder="All Sub Categories"
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.subCategories.map(sub => (
                <Option key={sub.id} value={sub.id}>
                  {sub.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>OEM</Text>
            <Select
              value={oemId}
              onChange={setOemId}
              placeholder="All OEMs"
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.oems.map(oem => (
                <Option key={oem.id} value={oem.id}>{oem.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Product Model</Text>
            <Select
              value={productModel}
              onChange={setProductModel}
              placeholder="Search Model"
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {filterOptions.products
                .filter(prod => prod.id)
                .map(prod => (
                  <Option key={prod.id} value={prod.id}>
                    {prod.name}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                SLA Met
            </Text>
        
            <Select
                value={slaMet}
                onChange={setSlaMet}
                placeholder="All"
                allowClear
                style={{ width: '100%' }}
            >
                <Option value={1}>Yes</Option>
                <Option value={0}>No</Option>
            </Select>
        </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Space>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={fetchReport}
                loading={loading}
              >
                Apply
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="Loading report..." />
        </Card>
      ) : reportData ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Tickets Resolved"
                  value={summary.total_tickets || 0}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Resolved Within SLA"
                  value={summary.resolved_within_sla || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="SLA Breached"
                  value={summary.resolved_breached || 0}
                  prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Compliance Rate"
                  value={complianceRate}
                  suffix="%"
                  prefix={
                    <Progress
                      type="circle"
                      percent={complianceRate}
                      size={40}
                      status={complianceRate >= 80 ? 'success' : complianceRate >= 60 ? 'normal' : 'exception'}
                      showInfo={false}
                    />
                  }
                  valueStyle={{
                    color: complianceRate >= 80 ? '#52c41a' : complianceRate >= 60 ? '#1890ff' : '#ff4d4f'
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabs for different views */}
          <Tabs defaultActiveKey="period" items={tabItems} />
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Empty
            description="No data available. Please select filters and click Apply."
          />
        </Card>
      )}
    </div>
  );
};

export default SlaComplianceReport;
