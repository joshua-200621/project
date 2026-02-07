import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ParkingCard } from '../components/ParkingCard';
import { parkingService, ParkingLocation } from '../services/parkingService';
import { Search, AlertCircle, Loader } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [parkings, setParkings] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const price = maxPrice ? parseFloat(maxPrice) : undefined;
      const results = await parkingService.searchParkings(city, price);
      setParkings(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">Find Your Parking</h1>
            <p className="text-blue-100 mb-8">Search available parking spaces in your area</p>

            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name..."
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                  />
                </div>
                <div className="sm:w-40">
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max price/hr"
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Searching for parkings...</p>
            </div>
          )}

          {searched && !loading && parkings.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No parking spaces found in "{city}"</p>
              <p className="text-gray-500">Try searching for another city or adjusting your filters</p>
            </div>
          )}

          {parkings.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Found {parkings.length} Parkings in {city}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parkings.map((parking) => (
                  <ParkingCard key={parking.id} parking={parking} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
