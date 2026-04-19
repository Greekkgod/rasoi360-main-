import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CheckCircle2, ArrowRight, Store, Smartphone, BarChart3, MenuSquare } from 'lucide-react';

export default function SaaSLanding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-orange-200">
            {/* Navigation */}
            <nav className="border-b border-stone-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-orange-600">
                        <ChefHat size={28} />
                        <span className="font-black text-xl tracking-tight">Rasoi360</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-stone-600 font-bold hover:text-stone-900 transition-colors">Log in</button>
                        <button onClick={() => navigate('/register')} className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-full font-bold transition-all shadow-lg shadow-stone-900/20 active:scale-95">
                            Start Free Trial
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main>
                <section className="relative pt-20 pb-32 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-white -z-10"></div>
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wider mb-6 border border-orange-200">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            The Modern POS for Modern Restaurants
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-stone-900 tracking-tight leading-tight max-w-4xl mx-auto">
                            Run your restaurant like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-500">Tech Company.</span>
                        </h1>
                        <p className="mt-6 text-xl text-stone-500 max-w-2xl mx-auto font-medium">
                            Cloud-based POS, smart kitchen displays (KDS), digital QR menus, and deep analytics. Everything you need to scale, zero setup required.
                        </p>
                        
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate('/register')} className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2 active:scale-[0.98] w-full sm:w-auto justify-center">
                                Start 14-Day Free Trial <ArrowRight size={20} />
                            </button>
                            <button className="h-14 px-8 bg-white border-2 border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50 rounded-full font-bold text-lg transition-all w-full sm:w-auto">
                                View Live Demo
                            </button>
                        </div>
                        <p className="mt-4 text-sm text-stone-400 font-medium">No credit card required. Cancel anytime.</p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-stone-50 border-y border-stone-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black tracking-tight text-stone-900">One platform. Every workflow.</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Smartphone className="text-orange-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-stone-800">QR Digital Menus</h3>
                                <p className="text-stone-500 font-medium">Customers scan, browse, and order directly from their phones. Updates instantly when items 86.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-all group-hover:scale-110"></div>
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <MenuSquare className="text-emerald-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-stone-800">Smart KDS Routing</h3>
                                <p className="text-stone-500 font-medium">Orders automatically split and route to specific kitchen stations. Eliminate paper tickets entirely.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="text-blue-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-stone-800">Live Analytics</h3>
                                <p className="text-stone-500 font-medium">Track revenue, table turnover rates, and most popular dishes in real-time from anywhere in the world.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black tracking-tight text-stone-900">Simple, transparent pricing.</h2>
                            <p className="mt-4 text-lg text-stone-500">Pick the plan that fits your growth.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Growth Plan */}
                            <div className="bg-white rounded-3xl border-2 border-stone-100 p-8 shadow-sm flex flex-col">
                                <h3 className="text-2xl font-bold text-stone-800">Growth</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-stone-900">$49</span>
                                    <span className="text-stone-500 font-medium">/mo</span>
                                </div>
                                <p className="mt-4 text-stone-500 font-medium">Perfect for single-location cafes and restaurants.</p>
                                
                                <ul className="mt-8 space-y-4 flex-1">
                                    {['Cloud POS System', 'Digital QR Menus', '1 Kitchen Display Station', 'Basic Analytics', 'Standard Support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-stone-700 font-medium">
                                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                
                                <button className="mt-8 w-full py-4 rounded-xl font-bold border-2 border-stone-200 text-stone-700 hover:border-stone-800 hover:text-stone-900 transition-colors">
                                    Start 14-Day Trial
                                </button>
                            </div>

                            {/* Pro Plan */}
                            <div className="bg-stone-900 rounded-3xl border-2 border-stone-900 p-8 shadow-2xl shadow-stone-900/20 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg">
                                    Most Popular
                                </div>
                                <h3 className="text-2xl font-bold text-white">Pro</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">$99</span>
                                    <span className="text-stone-400 font-medium">/mo</span>
                                </div>
                                <p className="mt-4 text-stone-400 font-medium">Advanced tools for high-volume restaurants.</p>
                                
                                <ul className="mt-8 space-y-4 flex-1">
                                    {['Everything in Growth', 'Unlimited Kitchen Stations', 'Advanced Analytics & Exports', 'Inventory Management', 'Priority 24/7 Support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-stone-300 font-medium">
                                            <CheckCircle2 size={20} className="text-orange-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                
                                <button className="mt-8 w-full py-4 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-lg shadow-orange-900/30">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
