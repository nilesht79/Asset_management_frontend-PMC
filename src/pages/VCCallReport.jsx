import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  message,
  Spin,
  Space,
  Button,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

import { exportVCCallReport } from '../utils/vcCallReportExcel';

const VCCallReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/v1/reports/vc', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to fetch VC Call Reports'
        );
      }

      setReports(result.data || []);
    } catch (error) {
      console.error('VC Report API Error:', error);

      message.error(
        error.message || 'Failed to load VC Call Reports'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return '-';

    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value) => {
    if (!value) return '-';

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'green';

      case 'closed':
        return 'blue';

      case 'in_progress':
        return 'processing';

      case 'open':
        return 'orange';

      case 'cancelled':
        return 'red';

      default:
        return 'default';
    }
  };

  const getSlaColor = (status) => {
    switch (status) {
      case 'on_track':
        return 'green';

      case 'warning':
        return 'orange';

      case 'breached':
        return 'red';

      case 'paused':
        return 'blue';

      case 'resolved':
        return 'green';

      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Ticket No.',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 150,
      fixed: 'left',
    },

    {
      title: 'VC Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (value) => formatDate(value),
    },

    {
  title: 'User Name',
  dataIndex: 'created_by_user_name',
  key: 'created_by_user_name',
  width: 200,
  render: (value) => value || '-',
},

{
  title: 'Department',
  dataIndex: 'department_name',
  key: 'department_name',
  width: 200,
  render: (value) => value || '-',
},

{
  title: 'Location',
  dataIndex: 'location_name',
  key: 'location_name',
  width: 200,
  render: (value) => value || '-',
},

    {
      title: 'Meeting Subject',
      dataIndex: 'title',
      key: 'title',
      width: 220,
    },

    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (value) => value || '-',
    },

    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (value) => {
        const color =
          value === 'high'
            ? 'red'
            : value === 'medium'
              ? 'orange'
              : 'green';

        return (
          <Tag color={color}>
            {value ? value.toUpperCase() : '-'}
          </Tag>
        );
      },
    },

    {
      title: 'Ticket Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value) => (
        <Tag color={getStatusColor(value)}>
          {value ? value.replaceAll('_', ' ').toUpperCase() : '-'}
        </Tag>
      ),
    },

    {
      title: 'SLA Status',
      dataIndex: 'sla_status',
      key: 'sla_status',
      width: 130,
      render: (value) => (
        <Tag color={getSlaColor(value)}>
          {value ? value.replaceAll('_', ' ').toUpperCase() : '-'}
        </Tag>
      ),
    },

    {
      title: 'SLA Rule',
      dataIndex: 'rule_name',
      key: 'rule_name',
      width: 180,
      render: (value) => value || '-',
    },

    {
      title: 'SLA Start',
      dataIndex: 'sla_start_time',
      key: 'sla_start_time',
      width: 170,
      render: (value) => formatDateTime(value),
    },

    {
      title: 'Min Target',
      dataIndex: 'min_target_time',
      key: 'min_target_time',
      width: 170,
      render: (value) => formatDateTime(value),
    },

    {
      title: 'Avg Target',
      dataIndex: 'avg_target_time',
      key: 'avg_target_time',
      width: 170,
      render: (value) => formatDateTime(value),
    },

    {
      title: 'Max Target',
      dataIndex: 'max_target_time',
      key: 'max_target_time',
      width: 170,
      render: (value) => formatDateTime(value),
    },

    {
      title: 'Elapsed Minutes',
      dataIndex: 'business_elapsed_minutes',
      key: 'business_elapsed_minutes',
      width: 150,
      render: (value) => value ?? 0,
    },

    {
      title: 'Paused Minutes',
      dataIndex: 'total_paused_minutes',
      key: 'total_paused_minutes',
      width: 140,
      render: (value) => value ?? 0,
    },

    {
      title: 'Paused',
      dataIndex: 'is_paused',
      key: 'is_paused',
      width: 100,
      render: (value) =>
        value ? (
          <Tag color="blue">YES</Tag>
        ) : (
          <Tag>NO</Tag>
        ),
    },

    {
      title: 'Breach Time',
      dataIndex: 'breach_triggered_at',
      key: 'breach_triggered_at',
      width: 170,
      render: (value) => formatDateTime(value),
    },

    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="p-6">

      <Card
  title="VC Call Report"
  extra={
    <Space>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={() => {
          if (!reports.length) {
            message.warning(
              'No VC Call Reports available to export'
            );
            return;
          }

          exportVCCallReport(reports);

          message.success(
            `Exported ${reports.length} VC Call Report(s)`
          );
        }}
        disabled={loading || !reports.length}
      >
        Export Excel
      </Button>

      <Button
        icon={<ReloadOutlined />}
        onClick={loadReports}
        loading={loading}
      >
        Refresh
      </Button>
    </Space>
  }
>

        <Table
          rowKey="ticket_id"
          columns={columns}
          dataSource={reports}
          loading={loading}
          scroll={{ x: 2600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) =>
              `Total ${total} VC Reports`,
          }}
          locale={{
            emptyText: loading
              ? 'Loading VC Call Reports...'
              : 'No VC Call Reports found',
          }}
        />

      </Card>

    </div>
  );
};

export default VCCallReport;
