import { useState } from 'react';
import { Building2, MessageCircle, Mail, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const settingsModules = [
    {
      id: 'company',
      title: 'Company Information',
      description: 'Manage company details, address, and contact information',
      icon: Building2,
      path: '/settings/company',
      color: 'blue',
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Integration',
      description: 'Configure WhatsApp API for sending notifications',
      icon: MessageCircle,
      path: '/settings/whatsapp',
      color: 'green',
    },
    {
      id: 'email',
      title: 'Email Setup',
      description: 'Configure SMTP settings for email notifications',
      icon: Mail,
      path: '/settings/email',
      color: 'red',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-50',
      green: 'bg-green-100 text-green-600 hover:bg-green-50',
      red: 'bg-red-100 text-red-600 hover:bg-red-50',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage application settings and configurations
        </p>
      </div>

      {/* Settings Module List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsModules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-3 rounded-lg ${getColorClasses(module.color)}`}
                >
                  <Icon size={24} />
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{module.description}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Stats or Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          Settings Overview
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Configure company information for invoices and documents
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Set up WhatsApp for automated customer notifications
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Configure email for sending invoices and updates
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
