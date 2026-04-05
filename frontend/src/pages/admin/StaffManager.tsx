export default function StaffManager() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
             <div>
                <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Staff Management</h2>
                <p className="text-stone-500 mt-1">Manage RBAC roles (Cashier, Waiter, Chef) and permissions.</p>
            </div>
            
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-2">Staff Integration Planned</h3>
                <p className="text-stone-500 max-w-md">
                    The staff manager module is currently marked for Phase 6. This module will integrate with the `/users` and `/roles` API endpoints.
                </p>
                <button className="mt-6 border border-stone-200 px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-50 transition-colors">
                    View DB Schema
                </button>
            </div>
        </div>
    );
}
