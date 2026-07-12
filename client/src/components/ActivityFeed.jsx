import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserCheck, RefreshCw, Tool, FilePlus, CheckCircle } from 'lucide-react';
import EmptyState from './EmptyState';

// Mock data fallback
const mockActivities = [
  { id: 1, type: 'assigned', message: 'Asset "Laptop X" assigned to John Doe', timestamp: '2024-11-01T10:15:00Z' },
  { id: 2, type: 'returned', message: 'Asset "Monitor Y" returned by Jane Smith', timestamp: '2024-11-02T14:30:00Z' },
  { id: 3, type: 'maintenance_created', message: 'Maintenance request for "Printer Z" created', timestamp: '2024-11-03T09:00:00Z' },
  { id: 4, type: 'maintenance_completed', message: 'Maintenance for "Printer Z" completed', timestamp: '2024-11-04T16:45:00Z' },
  { id: 5, type: 'new_asset', message: 'New asset "Router A" added to inventory', timestamp: '2024-11-05T08:20:00Z' },
];

const iconMap = {
  assigned: <UserCheck size={20} className="text-brand-primary" />, // adjust classes accordingly
  returned: <RefreshCw size={20} className="text-success-500" />, // placeholder
  maintenance_created: <Tool size={20} className="text-warning-500" />, // placeholder
  maintenance_completed: <CheckCircle size={20} className="text-success-500" />, // placeholder
  new_asset: <FilePlus size={20} className="text-brand-secondary" />, // placeholder
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get('/api/activity/recent');
        setActivities(res.data?.activities || []);
      } catch (err) {
        console.warn('Activity API unavailable, using mock data');
        setActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!activities.length) {
    return <EmptyState icon="📈" title="No recent activity" message="There are no recent events to display." />;
  }

  return (
    <div className="p-4 bg-white rounded shadow space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm mb-2">Recent Activity</h3>
      <ul className="space-y-2">
        {activities.map((act) => (
          <li key={act.id} className="flex items-center gap-2 text-sm text-gray-700">
            {iconMap[act.type] || <RefreshCw size={20} />}
            <span>{act.message}</span>
            <span className="ml-auto text-xs text-gray-500">
              {new Date(act.timestamp).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
