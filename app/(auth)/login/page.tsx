import { redirect } from 'next/navigation';
// import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  // DEMO MODE: Direct redirect to dashboard without login
  redirect('/dashboard');

  /*
  // Original login UI preserved for future use:
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src='/logo.png' width={56} height={56} alt='PG Manager' className='rounded-2xl object-contain' />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">PG Manager</h1>
          <p className="text-sm text-[#8E8E93] mt-2">Sign in to manage your property</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
  */
}
