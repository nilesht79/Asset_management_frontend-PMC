import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import MainLayout from '../components/common/Layout/MainLayout'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/Users'
import NotFound from '../pages/NotFound'
import Unauthorized from '../pages/Unauthorized'

// Master Data Components
import OEMList from '../components/modules/masters/oem/OEMList'
import ProductMaster from '../components/modules/masters/products/ProductMaster'
import LocationMaster from '../components/modules/masters/locations/LocationMaster'
import DepartmentMaster from '../components/modules/masters/departments/DepartmentMaster'
import BoardMaster from '../components/modules/masters/boards/BoardMaster'
import TemplateManager from '../components/modules/masters/componentFieldTemplates/TemplateManager'
import VendorList from '../components/modules/masters/vendors/VendorList'

// Settings Components
import OrgConfig from '../components/modules/settings/OrgConfig'
import EmailSettings from '../components/modules/settings/EmailSettings'
import SmsSettings from '../components/modules/settings/SmsSettings'

import AssetInventory from "../components/modules/assets/AssetInventory"
import AssetMovement from "../pages/AssetMovement"
import AssetLifecycle from "../pages/AssetLifecycle"
import TicketDashboard from "../pages/TicketDashboard"
import EngineerTicketDashboard from "../pages/EngineerTicketDashboard"

// Standby Assets Components
import StandbyPool from "../pages/StandbyPool"
import StandbyAssignments from "../pages/StandbyAssignments"

// Requisition Components
import MyRequisitions from "../pages/MyRequisitions"
import AllRequisitions from "../pages/AllRequisitions"
import NewRequisition from "../pages/NewRequisition"
import RequisitionDetails from "../pages/RequisitionDetails"
import DepartmentHeadApprovals from "../pages/DepartmentHeadApprovals"
import ITHeadApprovals from "../pages/ITHeadApprovals"
import AssetAssignment from "../pages/AssetAssignment"
import DeliveryManagement from "../pages/DeliveryManagement"
import EngineerDeliveries from "../pages/EngineerDeliveries"

// Permission Control Component
import SuperAdminPermissions from '../pages/SuperAdminPermissions'

// Reconciliation Components
import ReconciliationList from '../components/modules/reconciliation/ReconciliationList'
import ReconciliationAssets from '../components/modules/reconciliation/ReconciliationAssets'

// Consumable Components
import ConsumableMaster from '../components/modules/consumables/ConsumableMaster'
import ConsumableRequests from '../components/modules/consumables/ConsumableRequests'
import ConsumableInventory from '../components/modules/consumables/ConsumableInventory'

// Software License Components
import SoftwareLicenses from '../components/modules/licenses/SoftwareLicenses'

// Fault Analysis Components
import FaultAnalysis from '../pages/FaultAnalysis'
import FaultThresholdConfig from '../components/modules/settings/FaultThresholdConfig'
import FaultTypeManagement from '../components/modules/admin/FaultTypeManagement'

// SLA Settings
import SlaSettings from '../pages/SlaSettings'
import { TicketReopenConfig } from '../components/modules/sla'

// Report Pages
import SparePartsReport from '../pages/SparePartsReport'
import ServiceReports from '../pages/ServiceReports'
import SlaComplianceReport from '../pages/SlaComplianceReport'
import TicketTrendAnalysis from '../pages/TicketTrendAnalysis'
import ConsumablesConsumptionReport from '../pages/ConsumablesConsumptionReport'
import AssetJobReports from '../pages/AssetJobReports'
import VCCallReport from '../pages/VCCallReport'
import ServerReport from '../pages/ServerReport'

// Gate Pass Management
import GatePasses from '../pages/GatePasses'

// Audit Logs
import AuditLogs from '../pages/AuditLogs'

// Backup Management
import BackupManagement from '../pages/BackupManagement'

// Company Settings
import CompanySettings from '../pages/CompanySettings'

// Employee Pages
import MyAssets from '../pages/MyAssets'
import EmployeeTicketDashboard from '../pages/EmployeeTicketDashboard'

const AppRouter = () => {
  const { user } = useSelector(state => state.auth)


  return (
    <Routes>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* User Management Routes - Admin/Superadmin only */}
        {['admin', 'superadmin'].includes(user?.role) && (
          <>
            <Route path="users" element={<Users />} />
            <Route path="departments" element={<DepartmentMaster />} />
          </>
        )}

        {/* Master Data Routes - Admin/Superadmin only */}
        {['admin', 'superadmin'].includes(user?.role) && (
          <>
            <Route path="masters/boards" element={<BoardMaster />} />
            <Route path="masters/oem" element={<OEMList />} />
            <Route path="masters/vendors" element={<VendorList />} />
            <Route path="masters/products" element={<ProductMaster />} />
            <Route path="masters/locations" element={<LocationMaster />} />
          </>
        )}

        {/* Asset Management Routes */}
        {['it_head', 'coordinator', 'admin', 'superadmin', 'department_coordinator'].includes(user?.role) && (
          <>
            <Route path="assets/inventory" element={<AssetInventory />} />
            {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
              <Route path="assets/lifecycle" element={<AssetLifecycle />} />
            )}
            {['coordinator', 'admin', 'superadmin', 'department_coordinator'].includes(user?.role) && (
              <>
                <Route path="assets/assignment" element={<div>Asset Assignment (To be implemented)</div>} />
                <Route path="assets/movement" element={<AssetMovement />} />
                <Route path="assets/requisitions" element={<div>Asset Requisitions (To be implemented)</div>} />
                <Route path="standby/pool" element={<StandbyPool />} />
                <Route path="standby/assignments" element={<StandbyAssignments />} />
              </>
            )}
          </>
        )}


        {/* Employee Routes - Available to all users */}
        <Route path="my-assets" element={<MyAssets />} />
        <Route path="my-tickets" element={<EmployeeTicketDashboard />} />
        <Route path="create-ticket" element={<EmployeeTicketDashboard />} />

        {/* Requisition Routes - Available to all employees */}
        <Route path="requisitions/my-requisitions" element={<MyRequisitions />} />
        <Route path="requisitions/new" element={<NewRequisition />} />
        <Route path="requisitions/details/:id" element={<RequisitionDetails />} />
        <Route path="requisitions/:id" element={<RequisitionDetails />} />

        {/* All Requisitions - For coordinators, dept heads, IT heads */}
        {['it_head', 'coordinator', 'department_head', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="requisitions/all-requisitions" element={<AllRequisitions />} />
        )}

        {/* Department Head Approval Routes */}
        {['department_head', 'department_coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="approvals/department-head" element={<DepartmentHeadApprovals />} />
        )}

        {/* IT Head Approval Routes - IT Head only */}
        {['it_head', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="approvals/it-head" element={<ITHeadApprovals />} />
        )}

        {/* Coordinator Routes - Asset assignment and delivery management */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <>
            <Route path="assignments/asset-assignment" element={<AssetAssignment />} />
            <Route path="deliveries/management" element={<DeliveryManagement />} />
          </>
        )}

        {/* Engineer Delivery Routes */}
        {user?.role === 'engineer' && (
          <Route path="deliveries/my-deliveries" element={<EngineerDeliveries />} />
        )}

        {/* Ticket Routes */}
        {['it_head', 'coordinator', 'department_coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="tickets" element={<TicketDashboard />} />
        )}

        {/* Engineer Ticket Routes */}
        {user?.role === 'engineer' && (
          <Route path="engineer/tickets" element={<EngineerTicketDashboard />} />
        )}

        {/* Consumable Routes - Available to all employees for requests */}
        <Route path="consumables/requests" element={<ConsumableRequests />} />

        {/* Consumable Management - Coordinator/Admin only */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <>
            <Route path="consumables/master" element={<ConsumableMaster />} />
            <Route path="consumables/inventory" element={<ConsumableInventory />} />
          </>
        )}

        {/* Software License Management - Admin, Coordinator, IT Head */}
        {['it_head', 'coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="licenses" element={<SoftwareLicenses />} />
        )}

        {/* Fault Analysis - Admin, Coordinator, IT Head, Engineer */}
        {['it_head', 'coordinator', 'admin', 'superadmin', 'engineer'].includes(user?.role) && (
          <Route path="fault-analysis" element={<FaultAnalysis />} />
        )}

        {/* Reports Routes */}
        <Route path="reports/dashboard" element={<div>Reports Dashboard (To be implemented)</div>} />
        <Route path="reports/assets" element={<div>Asset Reports (To be implemented)</div>} />
        <Route path="reports/tickets" element={<div>Ticket Reports (To be implemented)</div>} />

        {/* Spare Parts Report - Coordinator, Admin, Superadmin */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="reports/spare-parts" element={<SparePartsReport />} />
        )}

        {/* Service Reports - Coordinator, Admin, Superadmin, Engineer, IT Head */}
        {['coordinator', 'admin', 'superadmin', 'engineer', 'it_head'].includes(user?.role) && (
          <Route path="reports/service-reports" element={<ServiceReports />} />
        )}

        {/* SLA Compliance Report - Coordinator, Admin, Superadmin */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="reports/sla-compliance" element={<SlaComplianceReport />} />
        )}

        {/* Ticket Trend Analysis - Coordinator, Admin, Superadmin */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="reports/ticket-trends" element={<TicketTrendAnalysis />} />
        )}

        {/* Consumables Consumption Report - Coordinator, Admin, Superadmin */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="reports/consumables-consumption" element={<ConsumablesConsumptionReport />} />
        )}

        {/* Asset Job Reports - IT Asset Install/Move/Transfer - Coordinator, Admin, Superadmin, IT Head */}
        {['it_head', 'coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="reports/asset-job-reports" element={<AssetJobReports />} />
        )}

        {/* VC Call Report - IT Head, Coordinator, Admin, Superadmin */}
        {['it_head', 'coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route
            path="reports/vc-call-report"
            element={<VCCallReport />}
          />
        )}
        
        {/* Server Report - IT Head, Coordinator, Admin, Superadmin */}
        {['it_head', 'coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route
            path="reports/server-report"
            element={<ServerReport />}
          />
        )}

        {/* Gate Pass Management - Coordinator, Admin, Superadmin, IT Head */}
        {['it_head', 'coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="gate-passes" element={<GatePasses />} />
        )}

        {/* Audit Logs - Admin, Superadmin, IT Head */}
        {['it_head', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="audit-logs" element={<AuditLogs />} />
        )}

        {/* Backup Management - Superadmin only */}
        {user?.role === 'superadmin' && (
          <Route path="backup-management" element={<BackupManagement />} />
        )}

        {/* Reconciliation Routes - Coordinator, Admin, Superadmin, Engineer */}
        {['coordinator', 'admin', 'superadmin', 'engineer'].includes(user?.role) && (
          <>
            <Route path="reconciliation" element={<ReconciliationList />} />
            <Route path="reconciliation/:id/assets" element={<ReconciliationAssets />} />
          </>
        )}

        {/* Settings - Superadmin only */}
        {user?.role === 'superadmin' && (
          <>
            <Route path="settings/permission-control" element={<SuperAdminPermissions />} />
            <Route path="settings/field-templates" element={<TemplateManager />} />
            <Route path="settings/org-config" element={<OrgConfig />} />
            <Route path="settings/email" element={<EmailSettings />} />
            <Route path="settings/sms" element={<SmsSettings />} />
            <Route path="settings/company-branding" element={<CompanySettings />} />
            <Route path="settings/ticket-reopen" element={<TicketReopenConfig />} />
          </>
        )}

        {/* Fault Threshold Config - Admin/Superadmin */}
        {['admin', 'superadmin'].includes(user?.role) && (
          <Route path="settings/fault-thresholds" element={<FaultThresholdConfig />} />
        )}

        {/* Fault Type Management - Admin/Superadmin */}
        {['admin', 'superadmin'].includes(user?.role) && (
          <Route path="admin/fault-types" element={<FaultTypeManagement />} />
        )}

        {/* SLA Settings - Coordinator/Admin/Superadmin */}
        {['coordinator', 'admin', 'superadmin'].includes(user?.role) && (
          <Route path="settings/sla" element={<SlaSettings />} />
        )}

        {/* Error Routes */}
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
