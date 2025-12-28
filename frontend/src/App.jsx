import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SupplierMaster from './pages/masters/SupplierMaster';
import CategoryMaster from './pages/masters/CategoryMaster';
import UOMMaster from './pages/masters/UOMMaster';
import GSTRateMaster from './pages/masters/GSTRateMaster';
import ItemMaster from './pages/masters/ItemMaster';
import TransporterMaster from './pages/masters/TransporterMaster';
import CustomerMaster from './pages/masters/CustomerMaster';
import CreateOrder from './pages/orders/CreateOrder';
import OrderList from './pages/orders/OrderList';
import ViewOrder from './pages/orders/ViewOrder';
import ProformaInvoice from './pages/orders/ProformaInvoice';
import DispatchDetails from './pages/orders/DispatchDetails';
import DispatchList from './pages/orders/DispatchList';
import Settings from './pages/Settings';
import CompanyInformation from './pages/settings/CompanyInformation';
import WhatsappIntegration from './pages/settings/WhatsappIntegration';
import EmailSetup from './pages/settings/EmailSetup';
import BankDetails from './pages/settings/BankDetails';
import PendingOrdersReport from './pages/reports/PendingOrdersReport';
import PendingByPartyReport from './pages/reports/PendingByPartyReport';
import PendingByItemsReport from './pages/reports/PendingByItemsReport';
import DispatchReport from './pages/reports/DispatchReport';
import ScrapGRN from './pages/grn/ScrapGRN';
import ScrapGRNList from './pages/grn/ScrapGRNList';
import EditScrapGRN from './pages/grn/EditScrapGRN';
import PrintScrapGRN from './pages/grn/PrintScrapGRN';
import MeltingProcessList from './pages/manufacturing/MeltingProcessList';
import CreateMeltingProcess from './pages/manufacturing/CreateMeltingProcess';
import EditMeltingProcess from './pages/manufacturing/EditMeltingProcess';
import PrintMeltingProcess from './pages/manufacturing/PrintMeltingProcess';
import HeatTreatmentList from './pages/manufacturing/HeatTreatmentList';
import CreateHeatTreatment from './pages/manufacturing/CreateHeatTreatment';
import EditHeatTreatment from './pages/manufacturing/EditHeatTreatment';
import PrintHeatTreatment from './pages/manufacturing/PrintHeatTreatment';
import RawMaterialStock from './pages/reports/RawMaterialStock';
import MaterialConsumption from './pages/reports/MaterialConsumption';
import WIPStock from './pages/reports/WIPStock';
import ProductionReport from './pages/reports/ProductionReport';
import FinishedGoodsStock from './pages/reports/FinishedGoodsStock';
import StockMovement from './pages/reports/StockMovement';
import StockStatement from './pages/reports/StockStatement';
import UserManagement from './pages/users/UserManagement';
import UserManagementTest from './pages/users/UserManagementTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Master Routes */}
            <Route path="masters/suppliers" element={
              <ProtectedRoute module="Suppliers" action="view">
                <SupplierMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/categories" element={
              <ProtectedRoute module="Categories" action="view">
                <CategoryMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/uom" element={
              <ProtectedRoute module="UOM" action="view">
                <UOMMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/gst-rates" element={
              <ProtectedRoute module="GST Rates" action="view">
                <GSTRateMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/items" element={
              <ProtectedRoute module="Items" action="view">
                <ItemMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/transporters" element={
              <ProtectedRoute module="Transporters" action="view">
                <TransporterMaster />
              </ProtectedRoute>
            } />
            <Route path="masters/customers" element={
              <ProtectedRoute module="Customers" action="view">
                <CustomerMaster />
              </ProtectedRoute>
            } />
          
            {/* Order Routes - Add protection as needed */}
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/edit/:id" element={<CreateOrder />} />
            <Route path="orders/list" element={<OrderList />} />
            <Route path="orders/view/:id" element={<ViewOrder />} />
            <Route path="orders/proforma/:id" element={<ProformaInvoice />} />
            <Route path="orders/dispatch-details" element={<DispatchDetails />} />
            <Route path="orders/dispatch-details/edit/:id" element={<DispatchDetails />} />
            <Route path="orders/dispatch-details/view/:id" element={<DispatchDetails />} />
            <Route path="orders/dispatches" element={<DispatchList />} />
            
            {/* Settings Routes */}
            <Route path="settings/company" element={<CompanyInformation />} />
            <Route path="settings/whatsapp" element={<WhatsappIntegration />} />
            <Route path="settings/email" element={<EmailSetup />} />
            <Route path="settings/bank" element={<BankDetails />} />
            
            {/* Report Routes */}
            <Route path="reports/pending-orders" element={<PendingOrdersReport />} />
            <Route path="reports/pending-by-party" element={<PendingByPartyReport />} />
            <Route path="reports/pending-by-items" element={<PendingByItemsReport />} />
            <Route path="reports/dispatch" element={<DispatchReport />} />
            
            {/* GRN Routes */}
            <Route path="grn/scrap" element={<ScrapGRN />} />
            <Route path="grn/scrap-list" element={<ScrapGRNList />} />
            <Route path="grn/scrap/edit/:id" element={<EditScrapGRN />} />
            <Route path="grn/scrap/print/:id" element={<PrintScrapGRN />} />
            
            {/* Manufacturing Routes */}
            <Route path="manufacturing/melting" element={<MeltingProcessList />} />
            <Route path="manufacturing/melting/create" element={<CreateMeltingProcess />} />
            <Route path="manufacturing/melting/edit/:id" element={<EditMeltingProcess />} />
            <Route path="manufacturing/melting/print/:id" element={<PrintMeltingProcess />} />
            
            <Route path="manufacturing/heat-treatment" element={<HeatTreatmentList />} />
            <Route path="manufacturing/heat-treatment/create" element={<CreateHeatTreatment />} />
            <Route path="manufacturing/heat-treatment/edit/:id" element={<EditHeatTreatment />} />
            <Route path="manufacturing/heat-treatment/print/:id" element={<PrintHeatTreatment />} />
            
            {/* Stock Report Routes */}
            <Route path="stock-reports/raw-material" element={<RawMaterialStock />} />
            <Route path="stock-reports/consumption" element={<MaterialConsumption />} />
            <Route path="stock-reports/wip" element={<WIPStock />} />
            <Route path="stock-reports/production" element={<ProductionReport />} />
            <Route path="stock-reports/finished-goods" element={<FinishedGoodsStock />} />
            <Route path="stock-reports/movement" element={<StockMovement />} />
            <Route path="stock-reports/stock-statement" element={<StockStatement />} />
            
            {/* User Management Routes */}
            <Route path="users/management" element={
              <ProtectedRoute module="User Management" action="view">
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const ComingSoon = ({ title }) => (
  <div className="card text-center">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="mt-2 text-gray-600">This module is coming soon!</p>
  </div>
);

export default App;
