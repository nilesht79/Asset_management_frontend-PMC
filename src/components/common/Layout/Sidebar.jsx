import { useState, useEffect, useMemo } from 'react'
import { Layout, Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  DashboardOutlined,
  TeamOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  ToolOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ControlOutlined,
  SecurityScanOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  SendOutlined,
  DeliveredProcedureOutlined,
  InboxOutlined,
  WarningOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  MailOutlined,
  ExportOutlined,
  ReloadOutlined,
  HistoryOutlined,
  CloudServerOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { selectSidebarCollapsed } from '../../../store/slices/uiSlice'
import { getThemeByRole } from '../../../utils/roleThemes'

const { Sider } = Layout

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useSelector(selectSidebarCollapsed)
  const { user } = useSelector(state => state.auth)
  const [openKeys, setOpenKeys] = useState([])

  // Get theme based on user role
  const theme = useMemo(() => {
    return user?.role ? getThemeByRole(user.role) : getThemeByRole('employee')
  }, [user?.role])


  // Initialize open keys based on current route
  useEffect(() => {
    setOpenKeys(getInitialOpenKeys())
  }, [location.pathname])

  // Force re-render when user role changes
  useEffect(() => {
    console.log('User role changed to:', user?.role);
  }, [user?.role])

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      }
    ]

    // Admin/Superadmin items - Complete Feature Set Based on SRS
    if (['admin', 'superadmin'].includes(user?.role)) {
      baseItems.push(
        // User Management Module
        {
          key: 'users',
          icon: <TeamOutlined />,
          label: 'User Management',
          children: [
             {
              key: '/users',
              label: 'User Master',
            },
            {
              key: '/departments',
              label: 'Department Master',
            },
          ],
        },
        // Master Data Module
        {
          key: 'masters',
          icon: <DatabaseOutlined />,
          label: 'Master Data',
          children: [
            {
              key: '/masters/boards',
              label: 'Board Master',
            },
            {
              key: '/masters/oem',
              label: 'OEM Master',
            },
            {
              key: '/masters/vendors',
              label: 'Vendor Master',
            },
            {
              key: '/masters/products',
              label: 'Product Master',
            },
            {
              key: '/masters/locations',
              label: 'Location Master',
            },
          ],
        },
        // Asset Management Module
        {
          key: 'assets',
          icon: <DesktopOutlined />,
          label: 'Asset Management',
          children: [
            {
              key: '/assets/inventory',
              label: 'Asset Inventory',
            },
            {
              key: '/assets/movement',
              label: 'Asset Movement',
            },
            {
              key: '/standby/pool',
              label: 'Standby Pool',
              icon: <SwapOutlined />
            },
            {
              key: '/standby/assignments',
              label: 'Standby Assignments',
            }
          ],
        },
        // Consumables Module
        {
          key: 'consumables',
          icon: <InboxOutlined />,
          label: 'Consumables',
          children: [
            {
              key: '/consumables/master',
              label: 'Consumable Master',
            },
            {
              key: '/consumables/inventory',
              label: 'Inventory Management',
            },
            {
              key: '/consumables/requests',
              label: 'Requests',
            },
          ],
        },
        // Ticketing & SLA Module
        {
          key: '/tickets',
          icon: <CustomerServiceOutlined />,
          label: 'Ticket Management',
        },
        // Inventory Reconciliation Module
        {
          key: '/reconciliation',
          icon: <CheckCircleOutlined />,
          label: 'Inventory Reconciliation',
        },
        // Software License Management
        {
          key: '/licenses',
          icon: <SafetyCertificateOutlined />,
          label: 'Software Licenses',
        },
        // Fault Analysis Module
        {
          key: 'fault-analysis',
          icon: <WarningOutlined />,
          label: 'Fault Analysis',
          children: [
            {
              key: '/fault-analysis',
              icon: <AlertOutlined />,
              label: 'Analysis Dashboard',
            },
            {
              key: '/admin/fault-types',
              icon: <ToolOutlined />,
              label: 'Fault Types',
            },
          ],
        },
        // Gate Pass Management
        {
          key: '/gate-passes',
          icon: <ExportOutlined />,
          label: 'Gate Passes',
        },
        // Reporting & Analytics Module
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Reports & Analytics',
          children: [
            {
              key: '/reports/service-reports',
              icon: <FileTextOutlined />,
              label: 'Service Reports',
            },
            {
              key: '/reports/spare-parts',
              icon: <ToolOutlined />,
              label: 'Spare Parts Consumption',
            },
            {
              key: '/reports/sla-compliance',
              label: 'SLA Compliance Reports',
            },
            {
              key: '/reports/ticket-trends',
              label: 'Ticket Trend Analysis',
            },
            {
              key: '/reports/consumables-consumption',
              label: 'Consumables Consumption',
            },
            {
              key: '/reports/asset-job-reports',
              icon: <DesktopOutlined />,
              label: 'Asset Job Reports',
            },
            {
            key: '/reports/vc-call-report',
            icon: <MessageOutlined />,
            label: 'VC Call Report',
          },
          {
            key: '/reports/server-report',
            icon: <CloudServerOutlined />,
            label: 'Server Report',
          },
          ],
        },
        // Audit Logs
        {
          key: '/audit-logs',
          icon: <HistoryOutlined />,
          label: 'Audit Logs',
        },
        // Backup Management (Superadmin only)
        ...(user?.role === 'superadmin' ? [{
          key: '/backup-management',
          icon: <CloudServerOutlined />,
          label: 'Backup Management',
        }] : []),
        // Settings Module
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Settings',
          children: [
            {
              key: '/settings/sla',
              icon: <ClockCircleOutlined />,
              label: 'SLA Configuration',
            },
            ...(user?.role === 'superadmin' ? [
              {
                key: '/settings/email',
                icon: <MailOutlined />,
                label: 'Email Configuration',
              },
              {
                key: '/settings/sms',
                icon: <MessageOutlined />,
                label: 'SMS Configuration',
              },
              {
                key: '/settings/permission-control',
                icon: <SecurityScanOutlined />,
                label: 'Permission Control',
              },
              {
                key: '/settings/field-templates',
                icon: <ControlOutlined />,
                label: 'Field Templates',
              },
              {
                key: '/settings/org-config',
                icon: <ControlOutlined />,
                label: 'Organization Config',
              },
              {
                key: '/settings/company-branding',
                icon: <CrownOutlined />,
                label: 'Company Branding',
              },
              {
                key: '/settings/fault-thresholds',
                icon: <WarningOutlined />,
                label: 'Fault Thresholds',
              },
              {
                key: '/settings/ticket-reopen',
                icon: <ReloadOutlined />,
                label: 'Ticket Reopen Config',
              }
            ] : []),
          ],
        }
      )
    }

    // Coordinator items - Asset allocation, movement, ticketing workflows
    if (['coordinator'].includes(user?.role)) {
      baseItems.push(
        {
          key: 'assets',
          icon: <DesktopOutlined />,
          label: 'Asset Management',
          children: [
            {
              key: '/assets/inventory',
              label: 'Asset Inventory',
            },
            {
              key: '/assets/movement',
              label: 'Asset Movement',
            },
            {
              key: '/standby/pool',
              label: 'Standby Pool',
              icon: <SwapOutlined />
            },
            {
              key: '/standby/assignments',
              label: 'Standby Assignments',
            },
            {
              key: 'asset-requisitions',
              icon: <ShoppingOutlined />,
              label: 'Asset Requisitions',
              children: [
                {
                  key: '/assignments/asset-assignment',
                  icon: <SendOutlined />,
                  label: 'Asset Assignment',
                },
                {
                  key: '/deliveries/management',
                  icon: <DeliveredProcedureOutlined />,
                  label: 'Delivery Management',
                },
                {
                  key: '/requisitions/all-requisitions',
                  icon: <FileTextOutlined />,
                  label: 'All Requisitions',
                }
              ]
            }
          ],
        },
        {
          key: 'consumables',
          icon: <InboxOutlined />,
          label: 'Consumables',
          children: [
            {
              key: '/consumables/master',
              label: 'Consumable Master',
            },
            {
              key: '/consumables/inventory',
              label: 'Inventory Management',
            },
            {
              key: '/consumables/requests',
              label: 'Requests',
            },
          ],
        },
        {
          key: '/tickets',
          icon: <CustomerServiceOutlined />,
          label: 'Ticket Management',
        },
        // Inventory Reconciliation
        {
          key: '/reconciliation',
          icon: <CheckCircleOutlined />,
          label: 'Inventory Reconciliation',
        },
        // Software License Management
        {
          key: '/licenses',
          icon: <SafetyCertificateOutlined />,
          label: 'Software Licenses',
        },
        // Fault Analysis
        {
          key: '/fault-analysis',
          icon: <WarningOutlined />,
          label: 'Fault Analysis',
        },
        // Reports & Analytics for Coordinators
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Reports & Analytics',
          children: [
            {
              key: '/reports/service-reports',
              icon: <FileTextOutlined />,
              label: 'Service Reports',
            },
            {
              key: '/reports/spare-parts',
              icon: <ToolOutlined />,
              label: 'Spare Parts Consumption',
            },
            {
              key: '/reports/sla-compliance',
              icon: <ClockCircleOutlined />,
              label: 'SLA Compliance Reports',
            },
            {
              key: '/reports/ticket-trends',
              icon: <BarChartOutlined />,
              label: 'Ticket Trend Analysis',
            },
            {
              key: '/reports/consumables-consumption',
              icon: <InboxOutlined />,
              label: 'Consumables Consumption',
            },
            {
              key: '/reports/asset-job-reports',
              icon: <DesktopOutlined />,
              label: 'Asset Job Reports',
            },
            {
            key: '/reports/vc-call-report',
            icon: <MessageOutlined />,
            label: 'VC Call Report',
          },
          {
            key: '/reports/server-report',
            icon: <CloudServerOutlined />,
            label: 'Server Report',
          },
          ],
        },
        // Gate Pass Management
        {
          key: '/gate-passes',
          icon: <ExportOutlined />,
          label: 'Gate Passes',
        },
        // SLA Settings
        {
          key: '/settings/sla',
          icon: <ClockCircleOutlined />,
          label: 'SLA Configuration',
        }
      )
    }

    // Department Head items - Department-scoped asset and ticket management + Employee features
    if (['department_head', 'department_coordinator'].includes(user?.role)) {
      baseItems.push(
        // Approval functionality
        {
          key: '/approvals/department-head',
          icon: <CheckCircleOutlined />,
          label: 'Requisition Approvals',
        },
        {
          key: '/requisitions/my-requisitions',
          icon: <FileTextOutlined />,
          label: 'Department Requisitions',
        },
        // Employee features - personal use
        {
          key: '/my-assets',
          icon: <DesktopOutlined />,
          label: 'My Assets',
        },
        {
          key: '/requisitions/new',
          icon: <ShoppingOutlined />,
          label: 'New Requisition',
        },
        {
          key: '/consumables/requests',
          icon: <InboxOutlined />,
          label: 'Consumable Requests',
        },
        {
          key: '/create-ticket',
          icon: <CustomerServiceOutlined />,
          label: 'Report Issue',
        },
        {
          key: '/my-tickets',
          icon: <FileTextOutlined />,
          label: 'My Tickets',
        }
      )
    }

    // IT Head items - IT approval workflow and asset management + Employee features
    if (['it_head'].includes(user?.role)) {
      baseItems.push(
        // IT Approval functionality
        {
          key: '/approvals/it-head',
          icon: <CheckCircleOutlined />,
          label: 'IT Requisition Approvals',
        },
        {
          key: '/requisitions/all-requisitions',
          icon: <FileTextOutlined />,
          label: 'All Requisitions',
        },
        // Employee features - personal use
        {
          key: '/my-assets',
          icon: <DesktopOutlined />,
          label: 'My Assets',
        },
        {
          key: '/requisitions/new',
          icon: <ShoppingOutlined />,
          label: 'New Requisition',
        },
        {
          key: '/consumables/requests',
          icon: <InboxOutlined />,
          label: 'Consumable Requests',
        },
        {
          key: '/create-ticket',
          icon: <CustomerServiceOutlined />,
          label: 'Report Issue',
        },
        {
          key: '/my-tickets',
          icon: <FileTextOutlined />,
          label: 'My Tickets',
        },
        // IT Management features
        {
          key: 'assets',
          icon: <DesktopOutlined />,
          label: 'Asset Management',
          children: [
            {
              key: '/assets/inventory',
              label: 'Asset Inventory',
            },
          ],
        },
        {
          key: '/tickets',
          icon: <CustomerServiceOutlined />,
          label: 'Ticket Management',
        },
        // Software License Management
        {
          key: '/licenses',
          icon: <SafetyCertificateOutlined />,
          label: 'Software Licenses',
        },
        // Reports for IT Head
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Reports',
          children: [
            {
              key: '/reports/service-reports',
              icon: <FileTextOutlined />,
              label: 'Service Reports',
            },
            {
              key: '/reports/asset-job-reports',
              icon: <DesktopOutlined />,
              label: 'Asset Job Reports',
            },
            {
              key: '/reports/vc-call-report',
              icon: <MessageOutlined />,
              label: 'VC Call Report',
            },
            {
              key: '/reports/server-report',
              icon: <CloudServerOutlined />,
              label: 'Server Report',
            },
          ],
        },
        // Gate Pass Management
        {
          key: '/gate-passes',
          icon: <ExportOutlined />,
          label: 'Gate Passes',
        }
      )
    }

    // Engineer items - Technical ticket handling, asset viewing, deliveries
    if (['engineer'].includes(user?.role)) {
      baseItems.push(
        {
          key: '/deliveries/my-deliveries',
          icon: <DeliveredProcedureOutlined />,
          label: 'Asset Deliveries',
        },
        {
          key: '/engineer/tickets',
          icon: <CustomerServiceOutlined />,
          label: 'My Tickets',
        },
        {
          key: '/consumables/requests',
          icon: <InboxOutlined />,
          label: 'Consumable Requests',
        },
        {
          key: '/reconciliation',
          icon: <CheckCircleOutlined />,
          label: 'Inventory Reconciliation',
        }
      )
    }

    // Employee items - Basic asset viewing, requisition creation
    if (['employee'].includes(user?.role)) {
      baseItems.push(
        {
          key: '/my-assets',
          icon: <DesktopOutlined />,
          label: 'My Assets',
        },
        {
          key: 'requisitions',
          icon: <ShoppingOutlined />,
          label: 'Asset Requisitions',
          children: [
            {
              key: '/requisitions/my-requisitions',
              label: 'My Requisitions',
            },
            {
              key: '/requisitions/new',
              label: 'New Requisition',
            },
          ],
        },
        {
          key: '/consumables/requests',
          icon: <InboxOutlined />,
          label: 'Consumable Requests',
        },
        {
          key: '/create-ticket',
          icon: <CustomerServiceOutlined />,
          label: 'Report Issue',
        },
        {
          key: '/my-tickets',
          icon: <FileTextOutlined />,
          label: 'My Tickets',
        }
      )
    }

    return baseItems
  }

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const getSelectedKeys = () => {
    const pathname = location.pathname

    // Find exact match first
    if (pathname === '/dashboard') return ['/dashboard']
    if (pathname === '/my-assets') return ['/my-assets']
    if (pathname === '/create-requisition') return ['/create-requisition']
    if (pathname === '/create-ticket') return ['/create-ticket']
    if (pathname === '/my-tickets') return ['/my-tickets']

    // User Management routes
    if (pathname.startsWith('/users')) return ['/users']
    if (pathname.startsWith('/departments')) return ['/departments']

    // Master Data routes
    if (pathname.startsWith('/masters/oem')) return ['/masters/oem']
    if (pathname.startsWith('/masters/vendors')) return ['/masters/vendors']
    if (pathname.startsWith('/masters/product-categories')) return ['/masters/product-categories']
    if (pathname.startsWith('/masters/product-subcategories')) return ['/masters/product-subcategories']
    if (pathname.startsWith('/masters/product-types')) return ['/masters/product-types']
    if (pathname.startsWith('/masters/products')) return ['/masters/products']
    if (pathname.startsWith('/masters/clients')) return ['/masters/clients']
    if (pathname.startsWith('/masters/location-types')) return ['/masters/location-types']
    if (pathname.startsWith('/masters/locations')) return ['/masters/locations']

    // Asset Management routes
    if (pathname.startsWith('/assets/inventory')) return ['/assets/inventory']
    if (pathname.startsWith('/assets/assignment')) return ['/assets/assignment']
    if (pathname.startsWith('/assets/movement')) return ['/assets/movement']
    if (pathname.startsWith('/assets/lifecycle')) return ['/assets/lifecycle']
    if (pathname.startsWith('/assets/requisitions')) return ['/assets/requisitions']
    if (pathname.startsWith('/assets/discovery')) return ['/assets/discovery']
    if (pathname.startsWith('/assets/audit')) return ['/assets/audit']
    if (pathname.startsWith('/assets/delivery')) return ['/assets/delivery']
    if (pathname.startsWith('/assets/view')) return ['/assets/view']

    // Asset Requisitions routes (nested under Asset Management)
    if (pathname.startsWith('/assignments/asset-assignment')) return ['/assignments/asset-assignment']
    if (pathname.startsWith('/deliveries/management')) return ['/deliveries/management']
    if (pathname.startsWith('/requisitions/all-requisitions')) return ['/requisitions/all-requisitions']

    // Ticket Management routes
    if (pathname.startsWith('/engineer/tickets')) return ['/engineer/tickets']
    if (pathname.startsWith('/tickets')) return ['/tickets']

    // Reports & Analytics routes
    if (pathname.startsWith('/reports/service-reports')) return ['/reports/service-reports']
    if (pathname.startsWith('/reports/spare-parts')) return ['/reports/spare-parts']
    if (pathname.startsWith('/reports/sla-compliance')) return ['/reports/sla-compliance']
    if (pathname.startsWith('/reports/ticket-trends')) return ['/reports/ticket-trends']
    if (pathname.startsWith('/reports/consumables-consumption')) return ['/reports/consumables-consumption']
    if (pathname.startsWith('/reports/asset-job-reports')) return ['/reports/asset-job-reports']
    if (pathname.startsWith('/reports/vc-call-report')) return ['/reports/vc-call-report']
    if (pathname.startsWith('/reports/server-report')) return ['/reports/server-report']

    // Department Management routes
    if (pathname.startsWith('/department/assets')) return ['/department/assets']
    if (pathname.startsWith('/department/requisitions')) return ['/department/requisitions']
    if (pathname.startsWith('/department/tickets')) return ['/department/tickets']
    if (pathname.startsWith('/department/reports')) return ['/department/reports']

    // Settings routes
    if (pathname.startsWith('/settings/email')) return ['/settings/email']
    if (pathname.startsWith('/settings/sms')) return ['/settings/sms']
    if (pathname.startsWith('/settings/sla')) return ['/settings/sla']
    if (pathname.startsWith('/settings/permission-control')) return ['/settings/permission-control']
    if (pathname.startsWith('/settings/field-templates')) return ['/settings/field-templates']
    if (pathname.startsWith('/settings/org-config')) return ['/settings/org-config']
    if (pathname.startsWith('/settings/company-branding')) return ['/settings/company-branding']

    // Consumables routes
    if (pathname.startsWith('/consumables/master')) return ['/consumables/master']
    if (pathname.startsWith('/consumables/inventory')) return ['/consumables/inventory']
    if (pathname.startsWith('/consumables/requests')) return ['/consumables/requests']

    // Software Licenses route
    if (pathname.startsWith('/licenses')) return ['/licenses']

    // Gate Pass route
    if (pathname.startsWith('/gate-passes')) return ['/gate-passes']

    // Fault Analysis routes
    if (pathname === '/fault-analysis') return ['/fault-analysis']
    if (pathname.startsWith('/admin/fault-types')) return ['/admin/fault-types']
    if (pathname.startsWith('/settings/fault-thresholds')) return ['/settings/fault-thresholds']

    return [pathname]
  }

  const getInitialOpenKeys = () => {
    const pathname = location.pathname
    const keys = []

    if (pathname.startsWith('/users') || pathname.startsWith('/departments')) {
      keys.push('users')
    }
    if (pathname.startsWith('/masters')) {
      keys.push('masters')
    }
    if (pathname.startsWith('/assets')) {
      keys.push('assets')
    }
    // Auto-open Asset Requisitions submenu for requisition-related routes
    if (pathname.startsWith('/assignments/asset-assignment') ||
        pathname.startsWith('/deliveries/management') ||
        pathname.startsWith('/requisitions/all-requisitions')) {
      keys.push('assets', 'asset-requisitions')
    }
    if (pathname.startsWith('/tickets')) {
      keys.push('tickets')
    }
    if (pathname.startsWith('/reports')) {
      keys.push('reports')
    }
    if (pathname.startsWith('/department')) {
      keys.push('department')
    }
    if (pathname.startsWith('/settings')) {
      keys.push('settings')
    }
    if (pathname.startsWith('/consumables')) {
      keys.push('consumables')
    }
    if (pathname.startsWith('/fault-analysis') ||
        pathname.startsWith('/admin/fault-types')) {
      keys.push('fault-analysis')
    }

    return keys
  }

  const handleOpenChange = (keys) => {
    setOpenKeys(keys)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="shadow-lg transition-all duration-300 themed-sidebar"
      style={{
        background: `linear-gradient(180deg, ${theme.sidebar.bg} 0%, ${theme.sidebar.hover} 100%)`,
        borderRight: `1px solid rgba(255, 255, 255, 0.12)`,
        boxShadow: `2px 0 8px rgba(0, 0, 0, 0.1)`
      }}
      width={280}
      collapsedWidth={80}
    >
      {/* Logo and Brand */}
      <div className="h-20 flex items-center justify-center px-4 border-b-2 border-opacity-30"
           style={{ borderBottomColor: theme.sidebar.active }}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="PolePlus"
              className="h-10 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="PolePlus"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="text-white font-bold text-lg leading-none">
                PolePlus
              </div>
              <div className="text-xs opacity-75 leading-none mt-1"
                   style={{ color: theme.sidebar.icon }}>
                Unified ITSM Platform
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-hidden">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={getMenuItems()}
          onClick={handleMenuClick}
          className="border-none sidebar-menu"
          style={{
            backgroundColor: 'transparent',
            '--sidebar-bg': theme.sidebar.bg,
            '--sidebar-hover': theme.sidebar.hover,
            '--sidebar-active': theme.sidebar.active,
            '--sidebar-text': theme.sidebar.text,
            '--sidebar-icon': theme.sidebar.icon,
            '--accent-color': theme.accent
          }}
        />
      </div>
    </Sider>
  )
}

export default Sidebar
