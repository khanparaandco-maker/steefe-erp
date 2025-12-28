import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  Factory,
  Users,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      permission: 'Dashboard'
    },
    {
      title: 'Masters',
      icon: Package,
      permission: 'Masters',
      submenu: [
        { title: 'Supplier Master', path: '/masters/suppliers', permission: 'Suppliers' },
        { title: 'Category Master', path: '/masters/categories', permission: 'Categories' },
        { title: 'UOM Master', path: '/masters/uom', permission: 'UOM' },
        { title: 'GST Rate Master', path: '/masters/gst-rates', permission: 'GST Rates' },
        { title: 'Item Master', path: '/masters/items', permission: 'Items' },
        { title: 'Transporter Master', path: '/masters/transporters', permission: 'Transporters' },
        { title: 'Customer Master', path: '/masters/customers', permission: 'Customers' },
      ],
    },
    {
      title: 'Order Management',
      icon: ShoppingCart,
      submenu: [
        { title: 'Create Order', path: '/orders/create' },
        { title: 'View Orders', path: '/orders/list' },
        { title: 'Dispatch Details', path: '/orders/dispatch-details' },
        { title: 'Dispatch List', path: '/orders/dispatches' },
        {
          title: 'Order Reports',
          submenu: [
            { title: 'Pending Orders', path: '/reports/pending-orders' },
            { title: 'Pending By Party', path: '/reports/pending-by-party' },
            { title: 'Pending By Items', path: '/reports/pending-by-items' },
            { title: 'Dispatch Report', path: '/reports/dispatch' },
          ],
        },
      ],
    },
    {
      title: 'GRN',
      icon: FileText,
      permission: 'GRN',
      submenu: [
        { title: 'New GRN', path: '/grn/scrap-list', permission: 'New GRN' },
      ],
    },
    {
      title: 'Manufacturing',
      icon: Factory,
      permission: 'Manufacturing',
      submenu: [
        { title: 'Melting Process', path: '/manufacturing/melting', permission: 'Melting Process' },
        { title: 'Heat-Treatment', path: '/manufacturing/heat-treatment', permission: 'Heat Treatment' },
      ],
    },
    {
      title: 'Stock Reports',
      icon: ClipboardList,
      permission: 'Reports',
      submenu: [
        { title: 'Raw Material Stock', path: '/stock-reports/raw-material', permission: 'Raw Material Stock' },
        { title: 'Material Consumption', path: '/stock-reports/consumption', permission: 'Consumption Report' },
        { title: 'WIP Stock', path: '/stock-reports/wip', permission: 'WIP Stock' },
        { title: 'Production Report', path: '/stock-reports/production', permission: 'Production Report' },
        { title: 'Finished Goods Stock', path: '/stock-reports/finished-goods', permission: 'Finished Goods Stock' },
        { title: 'Stock Movement', path: '/stock-reports/movement', permission: 'Stock Movement' },
        { title: 'Stock Statement', path: '/stock-reports/stock-statement', permission: 'Stock Movement' },
      ],
    },
    {
      title: 'User Management',
      icon: Users,
      permission: 'Users',
      submenu: [
        { title: 'User Management', path: '/users/management', permission: 'User Management' },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      permission: 'Settings',
      submenu: [
        { title: 'Company Information', path: '/settings/company', permission: 'Company Information' },
        { title: 'Bank Details', path: '/settings/bank', permission: 'Bank Details' },
        { title: 'WhatsApp Integration', path: '/settings/whatsapp', permission: 'WhatsApp Integration' },
        { title: 'Email Setup', path: '/settings/email', permission: 'Email Setup' },
      ],
    },
  ];

  // Filter menu items based on permissions
  const filterMenuByPermissions = (items) => {
    return items.filter(item => {
      // If no permission specified, show item
      if (!item.permission) return true;
      
      // Check if user has permission for this item
      if (!hasPermission(item.permission, 'view')) return false;
      
      // If item has submenu, filter submenu items
      if (item.submenu) {
        item.submenu = filterMenuByPermissions(item.submenu);
        // Show parent if at least one child is visible
        return item.submenu.length > 0;
      }
      
      return true;
    });
  };

  const visibleMenuItems = filterMenuByPermissions(menuItems);

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 bg-gray-800 text-white transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-700 bg-gray-900">
          <h1 className="text-xl font-bold text-white">SteelMelt ERP</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleMenuItems.map((item, index) => (
            <div key={index} className="mb-2">
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {openMenus[item.title] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {openMenus[item.title] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((sub, subIndex) => (
                        sub.submenu ? (
                          <div key={subIndex}>
                            <button
                              onClick={() => toggleMenu(item.title + '-' + sub.title)}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <span>{sub.title}</span>
                              {openMenus[item.title + '-' + sub.title] ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                            {openMenus[item.title + '-' + sub.title] && (
                              <div className="ml-4 mt-1 space-y-1">
                                {sub.submenu.map((nestedSub, nestedIndex) => (
                                  <Link
                                    key={nestedIndex}
                                    to={nestedSub.path}
                                    className={`block rounded-lg px-3 py-2 text-xs ${
                                      isActive(nestedSub.path)
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                  >
                                    {nestedSub.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            key={subIndex}
                            to={sub.path}
                            className={`block rounded-lg px-3 py-2 text-sm ${
                              isActive(sub.path)
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {sub.title}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg px-3 py-2 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
