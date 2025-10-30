import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getMyProfile, upsertMyProfile } from '@/services/apiProfile';
import { ArrowLeft, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [unit, setUnit] = useState<'lbs' | 'kg' | ''>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      (async () => {
        try {
          const p = await getMyProfile();
          if (p) {
            setUsername(p.username || '');
            setUnit((p.unit_preference as 'lbs' | 'kg') || '');
          }
        } finally {
          setLoading(false);
        }
      })();
    });
  }, [navigate]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertMyProfile({ username: username || null, unit_preference: unit || null });
      toast({ title: 'Profile updated' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message || 'Error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <UserIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Your Profile</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <Card className="p-6 bg-gradient-card border-border/50 shadow-card">
          <form className="space-y-6" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., ironclad" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit Preference</Label>
              <select
                id="unit"
                className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'lbs' | 'kg' | '')}
              >
                <option value="">Select unit</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="cta" className="flex-1">Save</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>Cancel</Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Profile;


