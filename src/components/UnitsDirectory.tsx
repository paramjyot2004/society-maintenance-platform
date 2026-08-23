import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  Shield
} from 'lucide-react';
import { SocietyUnit, CurrentUser } from '../types';

interface UnitsDirectoryProps {
  units: SocietyUnit[];
  currentUser: CurrentUser;
}

export const UnitsDirectory: React.FC<UnitsDirectoryProps> = ({
  units,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [towerFilter, setTowerFilter] = useState('ALL');
  const [occupancyFilter, setOccupancyFilter] = useState('ALL');

  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.tenantName && unit.tenantName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTower = towerFilter === 'ALL' || unit.tower === towerFilter;
    const matchesOccupancy = occupancyFilter === 'ALL' || unit.occupancyType === occupancyFilter;

    return matchesSearch && matchesTower && matchesOccupancy;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] shadow-none flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-teal-400" />
            Society Unit & Resident Directory
          </h2>
          <p className="text-xs text-slate-500">Registry of apartments, homeowners, tenants, and maintenance due compliance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by flat, owner, tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#374151] text-xs bg-[#0B1121] focus:bg-[#111827] focus:ring-2 focus:ring-teal-500/50 w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Tower filter */}
          <select
            value={towerFilter}
            onChange={(e) => setTowerFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#374151] text-xs bg-[#111827] text-slate-300"
          >
            <option value="ALL">All Towers</option>
            <option value="Tower A">Tower A</option>
            <option value="Tower B">Tower B</option>
            <option value="Tower C">Tower C</option>
          </select>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1121] border-b border-[#1F2937] text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Flat & Tower</th>
                <th className="px-6 py-3">Floor</th>
                <th className="px-6 py-3">Homeowner</th>
                <th className="px-6 py-3">Occupancy Status</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3 text-right">Maintenance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-[#0B1121]/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{unit.unitNumber}</div>
                    <div className="text-[11px] text-slate-500">{unit.tower}</div>
                  </td>

                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {unit.floor}th Floor
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{unit.ownerName}</div>
                    {unit.tenantName && (
                      <div className="text-[11px] text-teal-400 font-medium">
                        Tenant: {unit.tenantName}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {unit.occupancyType === 'OWNER_OCCUPIED' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Owner Occupied
                      </span>
                    )}
                    {unit.occupancyType === 'RENTED' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        Rented Out
                      </span>
                    )}
                    {unit.occupancyType === 'VACANT' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#1F2937] text-slate-400 border border-[#1F2937]">
                        Vacant
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{unit.contact}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{unit.email}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    {unit.dueStatus === 'CLEAR' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> All Dues Clear
                      </span>
                    ) : unit.dueStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3" /> ${unit.dueAmount} Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" /> ${unit.dueAmount} Overdue
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
