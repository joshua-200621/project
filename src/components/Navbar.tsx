import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Home className="w-6 h-6" />
            ParkPal
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium">
                Admin Panel
              </Link>
            )}

            {profile?.role === 'owner' && (
              <Link to="/owner/parkings" className="text-gray-700 hover:text-blue-600 font-medium">
                My Parkings
              </Link>
            )}

            {profile?.role === 'user' && (
              <Link to="/search" className="text-gray-700 hover:text-blue-600 font-medium">
                Find Parking
              </Link>
            )}

            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
              Dashboard
            </Link>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="space-y-2 mt-4">
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Panel
                </Link>
              )}

              {profile?.role === 'owner' && (
                <Link
                  to="/owner/parkings"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  My Parkings
                </Link>
              )}

              {profile?.role === 'user' && (
                <Link
                  to="/search"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Find Parking
                </Link>
              )}

              <Link
                to="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
