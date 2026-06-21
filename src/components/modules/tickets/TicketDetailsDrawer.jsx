import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Tag,
  Row,
  Col,
  Descriptions,
  Timeline,
  Input,
  Button,
  Avatar,
  Divider,
  message,
  Empty,
  Spin,
  Modal
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CommentOutlined,
  LinkOutlined,
  EditOutlined,
  ToolOutlined,
  SwapOutlined
} from '@ant-design/icons';
import ticketService from '../../../services/ticket';
import { useSelector } from 'react-redux';
import LinkedAssets from './LinkedAssets';
import LinkedSoftware from './LinkedSoftware';
import EditTicketModal from './EditTicketModal';
import FlagServiceTypeModal from './FlagServiceTypeModal';
import ReviewServiceTypeModal from './ReviewServiceTypeModal';
import AssetRepairHistory from '../assets/AssetRepairHistory';
import { SlaStatusBadge } from '../sla';
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';






const { TextArea } = Input;

const TicketDetailsDrawer = ({ visible, ticket, onClose, onUpdate }) => {
  useEffect(() => {
    console.log("UPDATED TICKET:", ticket);
  }, [ticket]);


  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [fileList, setFileList] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [closeRequestHistory, setCloseRequestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [repairHistoryModal, setRepairHistoryModal] = useState({ visible: false, assetId: null, assetTag: null });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [serviceTypeRequests, setServiceTypeRequests] = useState([]);
  const [flagServiceTypeVisible, setFlagServiceTypeVisible] = useState(false);
  const [reviewServiceTypeVisible, setReviewServiceTypeVisible] = useState(false);
  const [pendingServiceTypeRequest, setPendingServiceTypeRequest] = useState(null);
  const { Dragger } = Upload;
  const [attachments, setAttachments] = useState([]);
  const BASE_URL = "https://itsm.mmrdaindia.com";
  
  const fetchAttachments = async () => {
  try {
    const res = await ticketService.getAttachments(ticket.ticket_id);

    console.log("ATTACHMENTS API:", res.data); // 🔍 debug

    const data = res.data?.data || res.data;

    setAttachments(Array.isArray(data) ? data : []);

  } catch (err) {
    console.error("Failed to fetch attachments", err);
  }
};
  const { user: currentUser } = useSelector((state) => state.auth);
  const userRole = currentUser?.role;

  const handleUploadFile = async () => {
  if (fileList.length === 0 || !ticket) return;

  try {
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj);
    // console.log("Uploading file:", fileList[0].originFileObj);

    await ticketService.uploadAttachment(ticket.ticket_id, formData);

    setFileList([]);
    await fetchAttachments();

    message.success('File uploaded successfully');
  } catch (error) {
    console.error(error);
    message.error('Upload failed');
  }
};

  const formatDateTime = (date) => {
  const d = new Date(date);

  const day = d.getDate();

  const getSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const suffix = getSuffix(day);

  

  const month = d.toLocaleString('en-IN', { month: 'long' });
  const year = d.getFullYear();

  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${day}${suffix} ${month} ${year}, ${time}`;
};

  console.log("initial data; ", { ticket, currentUser });
  // Check if user can edit linked assets (coordinators, admins, or assigned engineer)
  const canEditLinkedAssets = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'coordinator' ||
    (currentUser.role === 'engineer' && ticket?.assigned_to_engineer_id === currentUser.user_id)
  ) && ticket?.status !== 'closed';

  // Check if user can edit ticket (coordinators and admins only, not closed tickets)
  const canEditTicket = currentUser && (
    ['coordinator', 'admin', 'superadmin', 'it_head', 'department_coordinator'].includes(currentUser.role)
  ) && ticket?.status !== 'closed' && ticket?.status !== 'cancelled';

  // Check if engineer can flag service type
  const isAssignedEngineer = currentUser?.role === 'engineer' &&
    ticket?.assigned_to_engineer_id === currentUser.user_id;
  const canFlagServiceType = isAssignedEngineer &&
    ['open', 'assigned', 'in_progress'].includes(ticket?.status) &&
    ticket?.service_type === 'general' &&
    ticket?.ticket_type === 'service_request' &&
    !pendingServiceTypeRequest;

  // Check if coordinator can review service type requests
  const isCoordinator = currentUser &&
    ['coordinator', 'admin', 'superadmin', 'it_head', 'department_coordinator'].includes(currentUser.role);

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    if (onUpdate) {
      onUpdate();
    }
    message.success('Ticket updated successfully');
  };

  useEffect(() => {
  if (visible && ticket) {
    fetchComments();
    fetchCloseRequestHistory();
    fetchServiceTypeRequests();
    fetchAttachments(); // ✅ ADD HERE
  }
}, [visible, ticket]);

  const fetchComments = async () => {
    if (!ticket) return;

    setLoadingComments(true);
    try {
      const response = await ticketService.getComments(ticket.ticket_id);
      const data = response.data.data || response.data;
      // setComments(data.comments || []);
      setComments(Array.isArray(data) ? data : data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchCloseRequestHistory = async () => {
    if (!ticket) return;

    setLoadingHistory(true);
    try {
      const response = await ticketService.getCloseRequestHistory(ticket.ticket_id);
      const data = response.data.data || response.data;
      setCloseRequestHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch close request history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchServiceTypeRequests = async () => {
    if (!ticket) return;
    try {
      const response = await ticketService.getServiceTypeRequests(ticket.ticket_id);
      const data = response.data.data || response.data;
      const requests = Array.isArray(data) ? data : [];
      setServiceTypeRequests(requests);
      const pending = requests.find(r => r.request_status === 'pending');
      setPendingServiceTypeRequest(pending || null);
    } catch (error) {
      console.error('Failed to fetch service type requests:', error);
    }
  };

  const handleServiceTypeSuccess = () => {
    fetchServiceTypeRequests();
    if (onUpdate) onUpdate();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;

    setSubmittingComment(true);
    try {
      await ticketService.addComment(ticket.ticket_id, {
        comment_text: newComment,
        is_internal: false
      });
      setNewComment('');
      await fetchComments();
      message.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleViewRepairHistory = (assetId, assetTag) => {
    setRepairHistoryModal({ visible: true, assetId, assetTag });
  };

  const handleCloseRepairHistory = () => {
    setRepairHistoryModal({ visible: false, assetId: null, assetTag: null });
  };

  if (!ticket) return null;

  console.log("this is ticket data:", ticket);

  return (
    <Drawer
      title="Ticket Details"
      placement="right"
      onClose={onClose}
      open={visible}
      width={700}
      destroyOnClose
      extra={
        canEditTicket && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditModalVisible(true)}
          >
            Edit Ticket
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {/* Ticket Header */}
        <Card size="small">
          <div className="flex justify-between items-start mb-3">
            <div>
              <Tag color="blue" className="text-base px-3 py-1">
                {ticket.ticket_number}
              </Tag>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Tag color={ticketService.getStatusColor(ticket.status)}>
                  {ticketService.getStatusDisplayName(ticket.status)}
                </Tag>
                <Tag color={ticketService.getPriorityColor(ticket.priority)}>
                  {ticketService.getPriorityDisplayName(ticket.priority)}
                </Tag>
                {ticket.category && (
                  <Tag>{ticket.category}</Tag>
                )}
                {/* {ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                  <SlaStatusBadge ticketId={ticket.ticket_id} compact />
                )} */}
                {userRole !== 'employee' &&
 ticket.status !== 'closed' &&
 ticket.status !== 'cancelled' && (
  <SlaStatusBadge ticketId={ticket.ticket_id} compact />
)}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>
                <ClockCircleOutlined /> Created
              </div>
              <div>{ticketService.formatDate(ticket.created_at)}</div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">{ticket.title}</h3>
          <p className="text-gray-700">{ticket.description}</p>
        </Card>

        {/* SLA Status - Show for all tickets (active and closed) */}
        {userRole !== 'employee' && (
        <Card
          title={
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined />
              <span>SLA Status</span>
              {(ticket.status === 'closed' || ticket.status === 'cancelled') && (
                <Tag color="default" style={{ marginLeft: 8 }}>Final</Tag>
              )}
            </div>
          }
          size="small"
        >
          <SlaStatusBadge
            ticketId={ticket.ticket_id}
            inline
          />
        </Card>
        )}

        {/* Ticket Information */}
        <Card title="Ticket Information" size="small">
          <Descriptions column={1} size="small">
            {ticket.is_guest ? (
              <>
                <Descriptions.Item label="Ticket Type">
                  <Tag color="purple" icon={<UserOutlined />}>GUEST TICKET</Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Guest Name">
                  <div className="font-medium">{ticket.guest_name}</div>
                </Descriptions.Item>

                <Descriptions.Item label="Guest Email">
                  <div className="text-blue-600">{ticket.guest_email}</div>
                </Descriptions.Item>

                <Descriptions.Item label="Guest Phone">
                  {ticket.guest_phone || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Created By">
                  <div className="flex items-center space-x-2">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">{ticket.coordinator_name || 'System'}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.coordinator_email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Assigned To">
                  {ticket.engineer_name ? (
                    <div className="flex items-center space-x-2">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div className="font-medium">{ticket.engineer_name}</div>
                        <div className="text-xs text-gray-500">
                          {ticket.engineer_email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Tag color="default">Unassigned</Tag>
                  )}
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="Created For">
                  <div className="flex items-center space-x-2">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">{ticket.created_by_user_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.created_by_user_email || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.created_at && formatDateTime(ticket.created_at)}
                      </div>
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Created By">
                  <div className="flex items-center space-x-2">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">
                        {ticket.coordinator_name || ticket.created_by_user_name || 'Self'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.coordinator_email || (ticket.coordinator_name ? '' : ticket.created_by_user_email) || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.created_at && formatDateTime(ticket.created_at)}
                      </div>
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Assigned By">
                  <div className="flex items-center space-x-2">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">
                        {ticket.assigned_by_name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.assigned_by_email ? ticket.assigned_by_email : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.assigned_at && formatDateTime(ticket.assigned_at)}
                      </div>
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="Assigned To">
                  {ticket.engineer_name ? (
                    <div className="flex items-center space-x-2">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div className="font-medium">{ticket.engineer_name}</div>
                        <div className="text-xs text-gray-500">
                          {ticket.engineer_email}
                        </div>
                        {/* 🔥 ADD THIS LINE */}
                      {ticket.assigned_at && (
                        <div className="text-xs text-gray-500">
                          {formatDateTime(ticket.assigned_at)}
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    <Tag color="default">Unassigned</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Department">
                  {ticket.department_name || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Location">
                  {ticket.location_name || 'N/A'}
                </Descriptions.Item>
              </>
            )}

            {ticket.due_date && (
              <Descriptions.Item label="Due Date">
                {ticketService.formatDate(ticket.due_date)}
              </Descriptions.Item>
            )}

            {ticket.resolved_at && (
              <Descriptions.Item label="Resolved At">
                {ticketService.formatDate(ticket.resolved_at)}
              </Descriptions.Item>
            )}

            {ticket.closed_at && (
              <Descriptions.Item label="Closed At">
                {ticketService.formatDate(ticket.closed_at)}
              </Descriptions.Item>
            )}

            {ticket.resolution_notes && (
              <Descriptions.Item label="Resolution Notes">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  {ticket.resolution_notes}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Linked Assets Section - Show for Hardware category or when no category */}
        {(!ticket.category || ticket.category === 'Hardware') && (
          <LinkedAssets
            ticketId={ticket.ticket_id}
            canEdit={canEditLinkedAssets}
            showRepairHistory={true}
            onViewRepairHistory={(assetId) => {
              // Find the asset tag from the linked assets if available
              handleViewRepairHistory(assetId, null);
            }}
          />
        )}

        {/* Linked Software Section - Show for Software category */}
        {ticket.category === 'Software' && (
          <LinkedSoftware
            ticketId={ticket.ticket_id}
            canEdit={canEditLinkedAssets}
          />
        )}

        {/* Flag Service Type Button - for engineers */}
        {canFlagServiceType && (
          <Card size="small" className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ToolOutlined className="text-blue-600 text-lg" />
                <div>
                  <div className="font-semibold text-blue-900">Flag Service Type</div>
                  <div className="text-sm text-blue-700">
                    Mark this ticket as Repair or Replacement
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                icon={<ToolOutlined />}
                onClick={() => setFlagServiceTypeVisible(true)}
              >
                Flag
              </Button>
            </div>
          </Card>
        )}

        {/* Pending Service Type Request Alert */}
        {pendingServiceTypeRequest && (
          <Card size="small" className="bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className="text-orange-600 text-lg" />
                <div>
                  <div className="font-semibold text-orange-900">
                    Service Type Change Pending
                  </div>
                  <div className="text-sm text-orange-700">
                    Requested: {pendingServiceTypeRequest.proposed_service_type === 'repair' ? 'Repair Service' : 'Replacement Service'}
                    {' '}by {pendingServiceTypeRequest.engineer_name || 'Engineer'}
                  </div>
                </div>
              </div>
              {isCoordinator && (
                <Button
                  type="primary"
                  onClick={() => setReviewServiceTypeVisible(true)}
                >
                  Review
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Service Type Request History */}
        {serviceTypeRequests.length > 0 && (
          <Card
            title={
              <div className="flex items-center space-x-2">
                <ToolOutlined />
                <span>Service Type Request History</span>
                <Tag>{serviceTypeRequests.length}</Tag>
              </div>
            }
            size="small"
          >
            <Timeline
              items={serviceTypeRequests.map((req) => ({
                children: (
                  <div key={req.request_id}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span className="font-medium">{req.engineer_name}</span>
                        <Tag size="small" color="blue">Engineer</Tag>
                      </div>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="text-xs text-gray-500 mb-1">Proposed Service Type:</div>
                        <Tag color={req.proposed_service_type === 'repair' ? 'orange' : 'red'}
                          icon={req.proposed_service_type === 'repair' ? <ToolOutlined /> : <SwapOutlined />}
                        >
                          {req.proposed_service_type === 'repair' ? 'Repair Service' : 'Replacement Service'}
                        </Tag>
                        {req.request_notes && (
                          <div className="mt-2 text-gray-700">{req.request_notes}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Status:</span>
                        <Tag color={
                          req.request_status === 'approved' ? 'green'
                            : req.request_status === 'rejected' ? 'red' : 'gold'
                        }>
                          {req.request_status.toUpperCase()}
                        </Tag>
                        <span className="text-xs text-gray-400">
                          {ticketService.formatRelativeTime(req.created_at)}
                        </span>
                      </div>
                      {req.request_status !== 'pending' && req.coordinator_name && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-300">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <span className="font-medium">{req.coordinator_name}</span>
                            <Tag size="small" color="purple">Coordinator</Tag>
                          </div>
                          {req.review_notes && (
                            <div className={`p-3 rounded border ${
                              req.request_status === 'approved'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="text-xs text-gray-500 mb-1">Coordinator Feedback:</div>
                              <div className="text-gray-700">{req.review_notes}</div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            Reviewed {ticketService.formatRelativeTime(req.reviewed_at)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ),
                color: req.request_status === 'approved' ? 'green'
                  : req.request_status === 'rejected' ? 'red' : 'blue'
              }))}
            />
          </Card>
        )}

        {/* Close Request History Section */}
        {closeRequestHistory.length > 0 && (
          <Card
            title={
              <div className="flex items-center space-x-2">
                <SendOutlined />
                <span>Close Request History</span>
                <Tag>{closeRequestHistory.length}</Tag>
              </div>
            }
            size="small"
          >
            {loadingHistory ? (
              <div className="text-center py-4">
                <Spin />
              </div>
            ) : (
              <Timeline
                items={closeRequestHistory.map((request) => ({
                  children: (
                    <div key={request.close_request_id}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar size="small" icon={<UserOutlined />} />
                          <div>
                            <span className="font-medium">{request.engineer_name}</span>
                            <Tag size="small" color="blue" className="ml-2">
                              Engineer
                            </Tag>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <div className="text-xs text-gray-500 mb-1">Resolution Notes:</div>
                          <div className="text-gray-700">{request.request_notes}</div>
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">Status:</span>
                          <Tag
                            color={
                              request.request_status === 'approved'
                                ? 'green'
                                : request.request_status === 'rejected'
                                  ? 'red'
                                  : 'gold'
                            }
                          >
                            {request.request_status.toUpperCase()}
                          </Tag>
                          <span className="text-xs text-gray-400">
                            {ticketService.formatRelativeTime(request.created_at)}
                          </span>
                        </div>

                        {request.request_status !== 'pending' && (
                          <div className="mt-2 pl-4 border-l-2 border-gray-300">
                            <div className="flex items-center space-x-2 mb-2">
                              <Avatar size="small" icon={<UserOutlined />} />
                              <div>
                                <span className="font-medium">{request.coordinator_name}</span>
                                <Tag size="small" color="purple" className="ml-2">
                                  Coordinator
                                </Tag>
                              </div>
                            </div>

                            {request.review_notes && (
                              <div className={`p-3 rounded border ${
                                request.request_status === 'approved'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="text-xs text-gray-500 mb-1">Coordinator Feedback:</div>
                                <div className="text-gray-700">{request.review_notes}</div>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2">
                              Reviewed {ticketService.formatRelativeTime(request.reviewed_at)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  color: request.request_status === 'approved'
                    ? 'green'
                    : request.request_status === 'rejected'
                      ? 'red'
                      : 'blue'
                }))}
              />
            )}
          </Card>
        )}

        {/* Pending Close Request Alert */}
        {ticket.status === 'pending_closure' && (
          <Card size="small" className="bg-cyan-50 border-cyan-200">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-cyan-600 text-lg" />
              <div>
                <div className="font-semibold text-cyan-900">Close Request Pending</div>
                <div className="text-sm text-cyan-700">
                  This ticket has a pending close request awaiting coordinator approval
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Comments Section */}
        <Card
          title={
            <div className="flex items-center space-x-2">
              <CommentOutlined />
              <span>Comments & Activity</span>
              <Tag>{comments.length}</Tag>
            </div>
          }
          size="small"
        >
          {loadingComments ? (
            <div className="text-center py-4">
              <Spin />
            </div>
          ) : comments.length > 0 ? (
            <Timeline
              items={comments.map((comment) => ({
                children: (
                  <div key={comment.comment_id}>
                    <div className="flex items-start space-x-2">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{comment.user_name}</span>
                          <Tag size="small" color="blue">
                            {comment.user_role}
                          </Tag>
                          <span className="text-xs text-gray-500">
                            {ticketService.formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-700">
                          {comment.comment_text}
                        </div>
                        
                        {comment.is_internal && (
                          <Tag size="small" color="orange" className="mt-1">
                            Internal Note
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                ),
                color: comment.is_internal ? 'orange' : 'blue'
              }))}
            />
          ) : (
            <Empty
              description="No comments yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}

          <Divider />

          {/* Add Comment */}
          {/* {ticket.status !== 'closed' && (
            <div className="space-y-2">
              <TextArea
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-end">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  loading={submittingComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
            </div>
          )} */}

         {ticket.status !== 'closed' && (
  <div className="space-y-3">

    {/* ================= COMMENT ================= */}
    <TextArea
      rows={3}
      placeholder="Add a comment..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      maxLength={500}
    />

    <Button
      type="primary"
      icon={<SendOutlined />}
      onClick={handleAddComment}
      loading={submittingComment}
      disabled={!newComment.trim()}
    >
      Add Comment
    </Button>

    {/* ================= UPLOAD TITLE ================= */}
    <Card
      style={{ marginTop: '10px' }}
      title={
        <div className="flex items-center space-x-2">
          <UploadOutlined />
          <span>Upload File</span>
        </div>
      }
      size="small"
    >

      {/* ================= DRAGGER ================= */}
      <Dragger
        fileList={fileList}
        beforeUpload={() => false}
        accept=".jpg,.jpeg,.png,.pdf"
        maxCount={1}
        showUploadList={false}
        onChange={({ fileList }) => {
          if (fileList.length > 1) {
            message.warning('Only 1 file allowed');
          }
          setFileList(fileList.slice(-1));
        }}
      >
        {fileList.length > 0 ? (

          <div className="flex items-center justify-between border p-2 rounded">

            <div className="flex items-center gap-2">
              {fileList[0].type?.includes('image') ? (
                <img
                  src={URL.createObjectURL(fileList[0].originFileObj)}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'contain',
                    borderRadius: 6
                  }}
                />
              ) : (
                <div style={{ fontSize: 24 }}>📄</div>
              )}

              <div style={{ fontSize: 12 }}>
                {fileList[0].name}
              </div>
            </div>

            <Button
              danger
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setFileList([]);
              }}
            >
              Remove
            </Button>

          </div>

        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to upload
            </p>
            <p className="ant-upload-hint">
              Only JPG, PNG, PDF allowed (Max 5MB)
            </p>
          </>
        )}
      </Dragger>

      {/* ================= UPLOAD BUTTON ================= */}
      <div className="flex justify-end mt-2">
        <Button
          type="primary"
          onClick={handleUploadFile}
          disabled={fileList.length === 0}
        >
          Upload File
        </Button>
        {/* 🔥 SHOW UPLOADED FILES */}
      </div>
      <div className="mt-3 space-y-2">
  {attachments && attachments.length > 0 ? (
    attachments.map(file => (
      <div key={file.attachment_id} className="flex items-center justify-between border p-2 rounded">

        <div className="flex items-center gap-2">

          {file.file_type?.includes('image') ? (
            <img
              src={`${BASE_URL}${file.file_path}`}
              style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 6
              }}
            />
          ) : (
            <div style={{ fontSize: 24 }}>📄</div>
          )}

          <div style={{ fontSize: 12 }}>
            {file.file_name}
          </div>

        </div>

        <a
          href={`https://itsm.mmrdaindia.com${file.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </a>

      </div>
    ))
  ) : (
    <div className="text-gray-400 text-sm">
      {/* No files uploaded */}
    </div>
  )}
</div>

      {/* ================= UPLOADED FILES ================= */}
      <div className="mt-3 space-y-2">

        {attachments && attachments.length > 0 ? (
          attachments
            .filter(file => file.uploaded_by_role === 'engineer') // 🔥 remove this line if not needed
            .map(file => (
              <div
                key={file.attachment_id}
                className="flex items-center justify-between border p-2 rounded"
              >

                <div className="flex items-center gap-2">

                  {/* IMAGE */}
                  {file.file_type?.includes('image') ? (
                    <img
                      src={`${BASE_URL}${file.file_path}`}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 6
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 24 }}>📄</div>
                  )}

                  <div style={{ fontSize: 12 }}>
                    {file.file_name}
                  </div>

                </div>

                <a
                  href={`https://itsm.mmrdaindia.com${file.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>

              </div>
            ))
        ) : (
          <div className="text-gray-400 text-sm">
            {/* No files uploaded */}
          </div>
        )}

      </div>

    </Card>

  </div>
)}

          {ticket.status === 'closed' && (
            <div className="text-center text-gray-500 text-sm py-2">
              This ticket is closed. Comments are disabled.
            </div>
          )}
        </Card>
      </div>

      {/* Asset Repair History Modal */}
      <Modal
        title="Asset Repair History"
        open={repairHistoryModal.visible}
        onCancel={handleCloseRepairHistory}
        footer={null}
        width={950}
        destroyOnClose
        zIndex={1100}
      >
        {repairHistoryModal.visible && repairHistoryModal.assetId ? (
          <AssetRepairHistory
            assetId={repairHistoryModal.assetId}
            assetTag={repairHistoryModal.assetTag}
            viewMode="table"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="Loading..." />
          </div>
        )}
      </Modal>

      {/* Edit Ticket Modal */}
      <EditTicketModal
        visible={editModalVisible}
        ticket={ticket}
        onClose={() => setEditModalVisible(false)}
        onSuccess={handleEditSuccess}
        currentUser={currentUser}
      />

      {/* Flag Service Type Modal - Engineer */}
      <FlagServiceTypeModal
        visible={flagServiceTypeVisible}
        ticket={ticket}
        onClose={() => setFlagServiceTypeVisible(false)}
        onSuccess={handleServiceTypeSuccess}
      />

      {/* Review Service Type Modal - Coordinator */}
      <ReviewServiceTypeModal
        visible={reviewServiceTypeVisible}
        ticket={ticket}
        request={pendingServiceTypeRequest}
        onClose={() => setReviewServiceTypeVisible(false)}
        onSuccess={handleServiceTypeSuccess}
      />
    </Drawer>
  );
};

export default TicketDetailsDrawer;
