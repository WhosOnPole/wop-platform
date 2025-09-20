import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Car, MapPin } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/teams')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Manage Teams</div>
              <p className="text-xs text-muted-foreground">
                Add, edit, and delete racing teams
              </p>
              <Button className="w-full mt-4" onClick={() => navigate('/admin/teams')}>
                Manage Teams
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/drivers')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Manage Drivers</div>
              <p className="text-xs text-muted-foreground">
                Add, edit, and delete racing drivers
              </p>
              <Button className="w-full mt-4" onClick={() => navigate('/admin/drivers')}>
                Manage Drivers
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/tracks')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracks</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Manage Tracks</div>
              <p className="text-xs text-muted-foreground">
                Add, edit, and delete racing tracks
              </p>
              <Button className="w-full mt-4" onClick={() => navigate('/admin/tracks')}>
                Manage Tracks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;