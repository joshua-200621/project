import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Star, Lock } from 'lucide-react';
import type { ParkingLocation } from '../services/parkingService';

interface Props {
  parking: ParkingLocation;
  onClick?: () => void;
}

export const ParkingCard: React.FC<Props> = ({ parking, onClick }) => {
  return (
    <Link
      to={`/parking/${parking.id}`}
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-40 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-4xl font-bold">{parking.available_slots}</p>
          <p className="text-sm opacity-90">of {parking.total_slots} slots</p>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{parking.name}</h3>

        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{parking.address}</p>
            <p className="text-gray-500">{parking.city}, {parking.state}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-900">
              {parking.average_rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">({parking.total_reviews} reviews)</span>
          </div>

          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-gray-900">{parking.price_per_hour}/hr</span>
          </div>
        </div>

        {!parking.is_active && (
          <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
            <Lock className="w-4 h-4" />
            Not Available
          </div>
        )}
      </div>
    </Link>
  );
};
