import { Building2 } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#34C759] rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1C1C1E]">PG Manager</h1>
          <p className="text-sm text-[#8E8E93] mt-2">Sign in to manage your property</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
