import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, Building2, User, Mail, Phone, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { apiRegister } from '@/lib/api';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setForm] = useState({
        restaurant_name: '',
        admin_full_name: '',
        email: '',
        phone_number: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiRegister(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200 border border-stone-100 p-10 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl font-black text-stone-900 mb-2">Welcome to the Club!</h2>
                    <p className="text-stone-500 font-medium leading-relaxed">
                        Your restaurant <span className="text-stone-800 font-bold">{formData.restaurant_name}</span> has been registered. 
                        We've set up your dashboard, 5 tables, and your kitchen station.
                    </p>
                    <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col gap-1">
                        <p className="text-sm font-bold text-orange-800">Redirecting to Login...</p>
                        <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-orange-500 animate-[progress_3s_ease-in-out]"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Branding/Visuals */}
            <div className="hidden md:flex md:w-1/2 bg-stone-900 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#ea580c33,transparent)] pointer-events-none"></div>
                
                <div className="flex items-center gap-3 text-white relative z-10">
                    <div className="bg-orange-600 p-2 rounded-xl">
                        <ChefHat size={32} />
                    </div>
                    <span className="font-black text-2xl tracking-tighter">Rasoi360</span>
                </div>

                <div className="relative z-10">
                    <h1 className="text-5xl font-black text-white leading-tight mb-6">
                        The last POS you'll <br/>ever need to buy.
                    </h1>
                    <ul className="space-y-4">
                        {[
                            'Instant QR Digital Menus',
                            'Automated Kitchen Routing',
                            'Daily Sales & Tax Reports',
                            'Unlimited Staff Accounts'
                        ].map((text, i) => (
                            <li key={i} className="flex items-center gap-3 text-stone-400 font-medium">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-stone-500 text-sm font-medium relative z-10">
                    © 2024 Rasoi360 Technologies. All rights reserved.
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="max-w-md w-full py-12">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-stone-900 tracking-tight">Create your account</h2>
                        <p className="text-stone-500 font-medium mt-2">Get started with your 14-day free trial. No credit card needed.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 font-bold text-sm">
                           <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-stone-700 ml-1">Restaurant Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. Spice Route" 
                                    className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium"
                                    value={formData.restaurant_name}
                                    onChange={(e) => setForm({...formData, restaurant_name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-stone-700 ml-1">Your Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. John Doe" 
                                    className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium"
                                    value={formData.admin_full_name}
                                    onChange={(e) => setForm({...formData, admin_full_name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-stone-700 ml-1">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="name@work.com" 
                                        className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium text-sm"
                                        value={formData.email}
                                        onChange={(e) => setForm({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-stone-700 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                    <input 
                                        required
                                        type="tel" 
                                        placeholder="1234567890" 
                                        className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium text-sm"
                                        value={formData.phone_number}
                                        onChange={(e) => setForm({...formData, phone_number: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pb-2">
                            <label className="text-sm font-bold text-stone-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <input 
                                    required
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setForm({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            type="submit" 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={24} /> Creating Account...</>
                            ) : (
                                <>Create Restaurant <ArrowRight size={22} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-stone-500 font-medium mt-8">
                        Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
