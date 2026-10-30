import { getSettings } from '@/lib/services/settings';
import SettingsForm from '@/components/settings/SettingsForm';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Settings</h1>
        <p className="text-[#8E8E93] text-[15px] mt-1 tracking-[-0.016em]">Manage your PG configuration</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
