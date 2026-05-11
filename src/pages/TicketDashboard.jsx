import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Space,
  Tag,
  Modal,
  message,
  Dropdown,
  Tooltip,
  Row,
  Col,
  Statistic,
  Badge,
  FloatButton
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  EyeOutlined,
  FilterOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  IssuesCloseOutlined,
  DownloadOutlined,
  CloseOutlined,
  EditOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import ticketService from '../services/ticket';
import CreateTicketModal from '../components/modules/tickets/CreateTicketModal';
import AssignEngineerModal from '../components/modules/tickets/AssignEngineerModal';
import CloseTicketModal from '../components/modules/tickets/CloseTicketModal';
import TicketDetailsDrawer from '../components/modules/tickets/TicketDetailsDrawer';
import EditTicketModal from '../components/modules/tickets/EditTicketModal';
import TicketFilterDrawer from '../components/modules/tickets/TicketFilterDrawer';
import ReviewCloseRequestModal from '../components/modules/tickets/ReviewCloseRequestModal';
import ReviewServiceTypeModal from '../components/modules/tickets/ReviewServiceTypeModal';
import PendingCloseRequestsDrawer from '../components/modules/tickets/PendingCloseRequestsDrawer';
import PendingServiceTypeRequestsDrawer from '../components/modules/tickets/PendingServiceTypeRequestsDrawer';
import ReopenTicketModal from '../components/modules/tickets/ReopenTicketModal';
import useResponsive from '../hooks/useResponsive';
// for date formatting in filter tags
import dayjs from 'dayjs';

const { Search } = Input;
const { confirm } = Modal;

const TicketDashboard = () => {
  //  Clear filter function 
  const [filterForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    assigned_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    critical_tickets: 0,
    overdue_tickets: 0,
    closed_today: 0,
    today_tickets: 0
  });
  const [closeRequestCount, setCloseRequestCount] = useState(0);
  const [pendingCloseRequests, setPendingCloseRequests] = useState([]);
  const [pendingServiceTypeRequests, setPendingServiceTypeRequests] = useState([]);
  const [serviceTypeRequestsDrawerVisible, setServiceTypeRequestsDrawerVisible] = useState(false);
  const [reviewServiceTypeVisible, setReviewServiceTypeVisible] = useState(false);
  const [selectedServiceTypeRequest, setSelectedServiceTypeRequest] = useState(null);
  const [selectedServiceTypeTicket, setSelectedServiceTypeTicket] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    department_id: '',
    location_id: '',
    assigned_to_engineer_id: '',
    is_guest: undefined
  });

  // Modal and Drawer states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [reviewCloseRequestModalVisible, setReviewCloseRequestModalVisible] = useState(false);
  const [pendingCloseRequestsDrawerVisible, setPendingCloseRequestsDrawerVisible] = useState(false);
  const [reopenModalVisible, setReopenModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedCloseRequest, setSelectedCloseRequest] = useState(null);
  const [linkedAssets, setLinkedAssets] = useState([]);

  const { user: currentUser } = useSelector((state) => state.auth);
  const { isMobile, isTablet } = useResponsive();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchCloseRequestCount();
    fetchPendingServiceTypeRequests();
  }, [pagination.current, pagination.pageSize, filters]);

  // Auto-open ticket drawer when navigated via notification with ?viewTicket=<id>
  const openTicketFromUrl = useCallback(async () => {
    const ticketId = searchParams.get('viewTicket');
    if (ticketId) {
      try {
        const response = await ticketService.getTicketById(ticketId);
        const data = response.data?.data || response.data;
        const ticket = data?.ticket || data;
        if (ticket?.ticket_id) {
          setSelectedTicket(ticket);
          setDetailsDrawerVisible(true);
        }
      } catch (error) {
        console.error('Failed to load ticket from URL:', error);
        message.error('Failed to load ticket details');
      }
      // Clear the query param so it doesn't re-open on refresh
      searchParams.delete('viewTicket');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    openTicketFromUrl();
  }, [openTicketFromUrl]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = ticketService.buildSearchParams(filters, {
        page: pagination.current,
        limit: pagination.pageSize
      });

      const response = await ticketService.getTickets(params);
      const data = response.data.data || response.data;

      setTickets(data.tickets || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ticketService.getTicketStats();
      const data = response.data.data || response.data;
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCloseRequestCount = async () => {
    try {
      const response = await ticketService.getCloseRequestCount();
      const data = response.data.data || response.data;
      setCloseRequestCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch close request count:', error);
    }
  };

  const fetchPendingCloseRequests = async () => {
    try {
      const response = await ticketService.getPendingCloseRequests();
      const data = response.data.data || response.data;
      setPendingCloseRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch pending close requests:', error);
      message.error('Failed to load close requests');
    }
  };

  const handleShowCloseRequests = async () => {
    await fetchPendingCloseRequests();
    setPendingCloseRequestsDrawerVisible(true);
  };

  const fetchPendingServiceTypeRequests = async () => {
    try {
      const response = await ticketService.getPendingServiceTypeRequests();
      const data = response.data.data || response.data;
      setPendingServiceTypeRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch pending service type requests:', error);
    }
  };

  const handleShowServiceTypeRequests = async () => {
    await fetchPendingServiceTypeRequests();
    setServiceTypeRequestsDrawerVisible(true);
  };

  const handleReviewServiceTypeRequest = (request) => {
    setSelectedServiceTypeRequest(request);
    setSelectedServiceTypeTicket({
      ticket_id: request.ticket_id,
      ticket_number: request.ticket_number,
      title: request.title
    });
    setReviewServiceTypeVisible(true);
  };

  const handleServiceTypeReviewSuccess = async () => {
    setReviewServiceTypeVisible(false);
    setSelectedServiceTypeRequest(null);
    setSelectedServiceTypeTicket(null);
    await Promise.all([
      fetchTickets(),
      fetchStats(),
      fetchPendingServiceTypeRequests()
    ]);

    setTimeout(() => {
      if (pendingServiceTypeRequests.length === 0) {
        setServiceTypeRequestsDrawerVisible(false);
      }
    }, 500);
  };

  const handleReviewCloseRequest = (closeRequest) => {
    setSelectedCloseRequest(closeRequest);
    setReviewCloseRequestModalVisible(true);
  };

  const handleReviewSuccess = async (action) => {
    setReviewCloseRequestModalVisible(false);
    setSelectedCloseRequest(null);

    // Refresh data
    await Promise.all([
      fetchTickets(),
      fetchStats(),
      fetchCloseRequestCount(),
      fetchPendingCloseRequests()
    ]);

    const actionMessage = action === 'approved'
      ? 'Close request approved and ticket closed successfully'
      : 'Close request rejected and returned to engineer';
    message.success(actionMessage);

    // Auto-close drawer if no more pending requests
    setTimeout(() => {
      if (pendingCloseRequests.length === 0) {
        setPendingCloseRequestsDrawerVisible(false);
      }
    }, 500);
  };

  const handleTableChange = (paginationInfo) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
    setPagination((prev) => ({
      ...prev,
      current: 1
    }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({
      ...prev,
      current: 1
    }));
  };

  // Clear all filters and reset form fields OLD CODE
  // const handleClearFilters = () => {
  //   const clearedFilters = {
  //     search: '',
  //     status: '',
  //     priority: '',
  //     category: '',
  //     department_id: '',
  //     location_id: '',
  //     assigned_to_engineer_id: '',
  //     is_guest: undefined,
  //     // clear date range fields
  //     start_date: '',
  //     end_date: '',
  //   };
  //   setFilters(clearedFilters);
  //   setPagination((prev) => ({
  //     ...prev,
  //     current: 1
  //   }));
  // };

    const handleClearFilters = () => {
        const clearedFilters = {
          search: '',
          status: '',
          priority: '',
          category: '',
          department_id: '',
          location_id: '',
          assigned_to_engineer_id: '',
          is_guest: undefined,
          start_date: '',
          end_date: '',
        };

        // Clear filter state
        setFilters(clearedFilters);

        // Reset pagination
        setPagination((prev) => ({
          ...prev,
          current: 1
        }));

        // Clear drawer form fields
        filterForm.resetFields();

        // Fetch all tickets again
        fetchTickets();
      };
  const handleRemoveFilter = (filterKey) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: filterKey === 'is_guest' ? undefined : ''
    }));
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return false; // Don't count search
      if (key === 'is_guest') return value !== undefined;
      return value !== '';
    }).length;
  };

  // Generate tags for active filters
  // const getActiveFilterTags = () => {
  //   const tags = [];
  //   Object.entries(filters).forEach(([key, value]) => {
  //     if (!value || (key === 'is_guest' && value === undefined)) return;
  //     if (key === 'search') return; // Don't show search as tag

  //     let label = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  //     let displayValue = value;

  //     // Customize labels
  //     if (key === 'is_guest') {
  //       label = 'Type';
  //       displayValue = value === '1' ? 'Guest' : 'Employee';
  //     }

  //     tags.push({ key, label, value: displayValue });
  //   });
  //   return tags;
  // };

    // Enhanced version with date formatting 
      const getActiveFilterTags = () => {
        const tags = [];

        Object.entries(filters).forEach(([key, value]) => {
          if (!value || (key === 'is_guest' && value === undefined)) return;
          if (key === 'search') return;

          let label = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
          let displayValue = value;

          // Date formatting
          if (key === 'start_date' || key === 'end_date') {
            displayValue = dayjs(value).format('DD-MM-YYYY');
          }

          // Guest / Employee label
          if (key === 'is_guest') {
            label = 'Type';
            displayValue = value === '1' ? 'Guest' : 'Employee';
          }

          tags.push({ key, label, value: displayValue });
        });

        return tags;
      };

  const handleCreateTicket = () => {
    setCreateModalVisible(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchTickets();
    fetchStats();
    message.success('Ticket created successfully');
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsDrawerVisible(true);
  };

  const handleAssignEngineer = (ticket) => {
    setSelectedTicket(ticket);
    setAssignModalVisible(true);
  };

  const handleAssignSuccess = () => {
    setAssignModalVisible(false);
    setSelectedTicket(null);
    fetchTickets();
    fetchStats();
    message.success('Engineer assigned successfully');
  };

  const handleCloseTicket = async (ticket) => {
    setSelectedTicket(ticket);
    // Fetch linked assets for service report
    try {
      const response = await ticketService.getTicketAssets(ticket.ticket_id);
      const assets = response.data?.data?.assets || response.data?.assets || [];
      setLinkedAssets(assets);
    } catch (error) {
      console.error('Failed to fetch ticket assets:', error);
      setLinkedAssets([]);
    }
    setCloseModalVisible(true);
  };

  const handleCloseSuccess = () => {
    setCloseModalVisible(false);
    setSelectedTicket(null);
    setLinkedAssets([]);
    fetchTickets();
    fetchStats();
    message.success('Ticket closed successfully');
  };

  const handleReopenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReopenModalVisible(true);
  };

  const handleReopenSuccess = () => {
    setReopenModalVisible(false);
    setSelectedTicket(null);
    fetchTickets();
    fetchStats();
  };

  const handleExport = async () => {
    try {
      message.loading({ content: 'Exporting tickets...', key: 'export' });

      const params = ticketService.buildSearchParams(filters, {});
      const response = await ticketService.exportTickets(params);

      // Create blob and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: 'Export completed successfully', key: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      message.error({ content: error.message || 'Failed to export tickets', key: 'export' });
    }
  };

  // Check if user can edit tickets (coordinators and admins only)
  const canEditTickets = currentUser && (
    ['coordinator', 'admin', 'superadmin', 'it_head', 'department_coordinator'].includes(currentUser.role)
  );

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedTicket(null);
    fetchTickets();
    fetchStats();
    message.success('Ticket updated successfully');
  };

  const getActionMenu = (ticket) => {
    const items = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => handleViewTicket(ticket)
      }
    ];

    // Add Edit action for coordinators (only for non-closed/cancelled tickets)
    if (canEditTickets && ticket.status !== 'closed' && ticket.status !== 'cancelled') {
      items.push({
        key: 'edit',
        label: 'Edit Ticket',
        icon: <EditOutlined />,
        onClick: () => handleEditTicket(ticket)
      });
    }

    items.push({
      key: 'assign',
      label: 'Assign Engineer',
      icon: <UserAddOutlined />,
      onClick: () => handleAssignEngineer(ticket),
      disabled: ticket.status === 'closed' || ticket.status === 'pending_closure'
    });

    // Only show "Close Ticket" if status is NOT pending_closure or closed
    if (ticket.status !== 'pending_closure' && ticket.status !== 'closed') {
      items.push({
        key: 'close',
        label: 'Close Ticket',
        icon: <CheckCircleOutlined />,
        onClick: () => handleCloseTicket(ticket)
      });
    }

    // Show "Reopen Ticket" only for closed tickets
    if (ticket.status === 'closed') {
      items.push({
        key: 'reopen',
        label: 'Reopen Ticket',
        icon: <ReloadOutlined />,
        onClick: () => handleReopenTicket(ticket)
      });
    }

    return { items };
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 130,
      fixed: !isMobile ? 'left' : false,
      responsive: ['sm'],
      render: (text) => (
        <span className="font-mono font-semibold text-blue-600">{text}</span>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={ticketService.getStatusColor(status)}>
          {ticketService.getStatusDisplayName(status).toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Open', value: 'open' },
        { text: 'Assigned', value: 'assigned' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Pending Closure', value: 'pending_closure' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Closed', value: 'closed' }
      ]
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority) => (
        <Tag color={ticketService.getPriorityColor(priority)}>
          {ticketService.getPriorityDisplayName(priority).toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Critical', value: 'critical' },
        { text: 'Emergency', value: 'emergency' }
      ]
    },
    {
      title: 'Created For',
      key: 'created_by_user',
      width: 220,
      render: (_, record) => (
        record.is_guest ? (
          <div>
            <Tag color="purple" icon={<UserAddOutlined />} style={{ marginBottom: 4 }}>
              GUEST
            </Tag>
            <div className="font-medium">{record.guest_name}</div>
            <div className="text-xs text-gray-500">{record.guest_email}</div>
          </div>
        ) : (
          <div>
            <div className="font-medium">{record.created_by_user_name}</div>
            <div className="text-xs text-gray-500">{record.created_by_user_email}</div>
          </div>
        )
      )
    },
    {
      title: 'Assigned To',
      key: 'engineer',
      width: 180,
      render: (_, record) =>
        record.engineer_name ? (
          <div>
            <div className="font-medium">{record.engineer_name}</div>
            <div className="text-xs text-gray-500">{record.engineer_email}</div>
          </div>
        ) : (
          <Tag color="default">Unassigned</Tag>
        )
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => ticketService.formatRelativeTime(date),
      sorter: true
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={getActionMenu(record)}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
          <p className="text-gray-600">
            Manage support tickets and assign engineers
          </p>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <Row gutter={[16, 16]}>
          <Col flex="1">
            <Card>
              <Statistic title="Total Tickets" value={stats.total_tickets} prefix={<IssuesCloseOutlined />} />
            </Card>
          </Col>
        
          <Col flex="1">
            <Card>
              <Statistic title="Open Tickets" value={stats.open_tickets} valueStyle={{ color: '#1890ff' }} prefix={<AlertOutlined />} />
            </Card>
          </Col>
        
          <Col flex="1">
            <Card>
              <Statistic title="Today's Tickets" value={stats.today_tickets} valueStyle={{ color: '#fa8c16' }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        
          <Col flex="1">
            <Card>
              <Statistic title="In Progress" value={stats.in_progress_tickets} valueStyle={{ color: '#722ed1' }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        
          <Col flex="1">
            <Card>
              <Badge count={stats.overdue_tickets} offset={[10, 0]}>
                <Statistic title="Closed Today" value={stats.closed_today} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
              </Badge>
            </Card>
          </Col>
        </Row>

      {/* Filters and Actions */}
      <Card>
        {/* Search and Actions Bar */}
        <Space wrap style={{ width: '100%', marginBottom: 16 }}>
          <Search
            placeholder="Search tickets..."
            allowClear
            style={{ width: isMobile ? '100%' : 300 }}
            onSearch={(value) => handleFilterChange('search', value)}
            enterButton={<SearchOutlined />}
          />

          <Badge count={getActiveFilterCount()} offset={[0, 0]}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            >
              {!isMobile && 'Filters'}
            </Button>
          </Badge>

          <Badge count={closeRequestCount} offset={[0, 0]}>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleShowCloseRequests}
              type={closeRequestCount > 0 ? 'primary' : 'default'}
            >
              {!isMobile && 'Close Requests'}
            </Button>
          </Badge>

          <Badge count={pendingServiceTypeRequests.length} offset={[0, 0]}>
            <Button
              icon={<ToolOutlined />}
              onClick={handleShowServiceTypeRequests}
              type={pendingServiceTypeRequests.length > 0 ? 'primary' : 'default'}
            >
              {!isMobile && 'Service Type Requests'}
            </Button>
          </Badge>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={loading}
          >
            {!isMobile && 'Export'}
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchTickets();
              fetchStats();
              fetchCloseRequestCount();
              fetchPendingServiceTypeRequests();
            }}
            disabled={loading}
          >
            {!isMobile && 'Refresh'}
          </Button>

          {!isMobile && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTicket}
            >
              Create Ticket
            </Button>
          )}
        </Space>

        {/* Active Filter Tags */}
        {getActiveFilterCount() > 0 && (
          <Space wrap style={{ marginBottom: 16 }}>
            {getActiveFilterTags().map((tag) => (
              <Tag
                key={tag.key}
                closable
                onClose={() => handleRemoveFilter(tag.key)}
                color="blue"
              >
                {tag.label}: {tag.value}
              </Tag>
            ))}
            <Button
              size="small"
              type="link"
              icon={<CloseOutlined />}
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          </Space>
        )}

        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="ticket_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          sticky
        />
      </Card>

      {/* Modals */}
      <CreateTicketModal
        visible={createModalVisible}
        currentUser={currentUser}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <AssignEngineerModal
        visible={assignModalVisible}
        ticket={selectedTicket}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedTicket(null);
        }}
        onSuccess={handleAssignSuccess}
      />

      <CloseTicketModal
        visible={closeModalVisible}
        ticket={selectedTicket}
        linkedAssets={linkedAssets}
        onClose={() => {
          setCloseModalVisible(false);
          setSelectedTicket(null);
          setLinkedAssets([]);
        }}
        onSuccess={handleCloseSuccess}
      />

      <PendingCloseRequestsDrawer
        visible={pendingCloseRequestsDrawerVisible}
        requests={pendingCloseRequests}
        onClose={() => setPendingCloseRequestsDrawerVisible(false)}
        onReviewRequest={handleReviewCloseRequest}
        onUpdate={() => {
          fetchPendingCloseRequests();
          fetchCloseRequestCount();
        }}
      />

      <ReviewCloseRequestModal
        visible={reviewCloseRequestModalVisible}
        closeRequest={selectedCloseRequest}
        onClose={() => {
          setReviewCloseRequestModalVisible(false);
          setSelectedCloseRequest(null);
        }}
        onSuccess={handleReviewSuccess}
      />

      <ReopenTicketModal
        visible={reopenModalVisible}
        ticket={selectedTicket}
        onClose={() => {
          setReopenModalVisible(false);
          setSelectedTicket(null);
        }}
        onSuccess={handleReopenSuccess}
      />

      <EditTicketModal
        visible={editModalVisible}
        ticket={selectedTicket}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTicket(null);
        }}
        onSuccess={handleEditSuccess}
        currentUser={currentUser}
      />

      <TicketDetailsDrawer
        visible={detailsDrawerVisible}
        ticket={selectedTicket}
        onClose={() => {
          setDetailsDrawerVisible(false);
          setSelectedTicket(null);
        }}
        onUpdate={() => {
          fetchTickets();
          fetchStats();
          fetchCloseRequestCount();
          fetchPendingServiceTypeRequests();
        }}
      />

      <PendingServiceTypeRequestsDrawer
        visible={serviceTypeRequestsDrawerVisible}
        requests={pendingServiceTypeRequests}
        onClose={() => setServiceTypeRequestsDrawerVisible(false)}
        onReviewRequest={handleReviewServiceTypeRequest}
      />

      <ReviewServiceTypeModal
        visible={reviewServiceTypeVisible}
        ticket={selectedServiceTypeTicket}
        request={selectedServiceTypeRequest}
        onClose={() => {
          setReviewServiceTypeVisible(false);
          setSelectedServiceTypeRequest(null);
          setSelectedServiceTypeTicket(null);
        }}
        onSuccess={handleServiceTypeReviewSuccess}
      />

      {/* Filter Drawer */}
      <TicketFilterDrawer
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          onClick={handleCreateTicket}
          tooltip="Create Ticket"
        />
      )}
    </div>
  );
};

export default TicketDashboard;
