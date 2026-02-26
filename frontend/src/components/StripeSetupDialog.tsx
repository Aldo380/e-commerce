import { useState } from 'react';
import { useSetStripeConfiguration } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StripeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeSetupDialog({ open, onOpenChange }: StripeSetupDialogProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');
  const setStripeConfig = useSetStripeConfiguration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const allowedCountries = countries.split(',').map((c) => c.trim()).filter(Boolean);
    if (allowedCountries.length === 0) {
      toast.error('Please enter at least one country code');
      return;
    }

    try {
      await setStripeConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries,
      });
      toast.success('Stripe configured successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Stripe</DialogTitle>
          <DialogDescription>
            Enter your Stripe secret key and allowed countries to enable card payments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_test_..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
            <Input
              id="countries"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="US,CA,GB"
            />
            <p className="text-xs text-muted-foreground">Example: US,CA,GB,AU</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={setStripeConfig.isPending}>
              {setStripeConfig.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
