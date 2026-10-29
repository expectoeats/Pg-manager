import { getSettings } from '@/lib/services/settings';
import SettingsForm from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your PG configuration</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
