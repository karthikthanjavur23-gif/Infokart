import React, { useState } from 'react';
import { CreditCard, Check, ShieldAlert, Sparkles, Building, Briefcase, Zap, HelpCircle } from 'lucide-react';

const Billing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans = [
    {
      id: 'growth',
      name: 'Growth',
      description: 'Ideal for small teams automating customer inquiries.',
      priceMonthly: 29,
      priceYearly: 24,
      features: [
        '1 Connected WABA Account',
        '1,000 AI Agent replies/mo',
        'Gemini 1.5 Flash API Engine',
        'Basic SQLite Knowledge Base (50 blocks)',
        '3 Team Inbox Members',
        'Shared Inbox & CRM'
      ],
      icon: Briefcase,
      badge: null
    },
    {
      id: 'pro',
      name: 'Pro AI Agent',
      description: 'Perfect for businesses seeking permanent smart automation.',
      priceMonthly: 79,
      priceYearly: 64,
      features: [
        '3 Connected WABA Accounts',
        '10,000 AI Agent replies/mo',
        'Infokart AI External Key Integration',
        'Unlimited Knowledge Base (URLs, PDFs, FAQ)',
        '10 Team Inbox Members',
        'Broadcast Campaign Campaigns',
        'Advanced CRM & Tag Automation',
        'Priority support'
      ],
      icon: Zap,
      badge: 'Popular'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom setups for high-volume corporate communication.',
      priceMonthly: 199,
      priceYearly: 159,
      features: [
        'Unlimited WABA Accounts',
        'Unlimited AI replies/mo',
        'Custom GPT-4 & LLM fine-tuning options',
        'Dedicated Local Database deployment',
        'Unlimited Team Members',
        'Custom Webhooks & Web Widget API',
        'SLA Response Guarantees',
        'Dedicated account manager'
      ],
      icon: Building,
      badge: 'Enterprise'
    }
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="text-purple-600" size={24} /> Plans & Subscription
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Scale your WhatsApp AI workforce with our premium subscriptions. Integrates with Infokart AI key or SQLite fallback.
        </p>
      </div>

      {/* Switch Toggle */}
      <div className="flex justify-center my-4">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`text-xs font-bold px-4 py-2 rounded-xl border-none transition-all ${
              billingCycle === 'monthly' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`text-xs font-bold px-4 py-2 rounded-xl border-none transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'
            }`}
          >
            Yearly Billing <span className="bg-purple-100 text-purple-600 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">-20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`card bg-white border rounded-[24px] p-6 shadow-sm flex flex-col justify-between cursor-pointer transition-all relative ${
                isSelected ? 'border-purple-600 ring-2 ring-purple-600/10' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 bg-purple-50 text-purple-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <PlanIcon size={18} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{plan.name}</h3>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold mb-6 leading-relaxed">
                  {plan.description}
                </p>

                {/* Pricing tags */}
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl font-extrabold text-slate-800">${price}</span>
                  <span className="text-[10px] font-bold text-slate-400">/ month</span>
                </div>

                {/* Features divider */}
                <div className="border-t border-slate-50 pt-6 flex flex-col gap-4">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Included Features:</h5>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <Check className="text-purple-600 shrink-0 mt-0.5" size={14} />
                        <span className="text-xs font-semibold text-slate-600 leading-normal">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-3 text-xs font-bold rounded-xl mt-8 flex items-center justify-center gap-1.5 border-none transition-all ${
                  isSelected
                    ? 'btn-primary shadow-sm shadow-purple-600/15'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isSelected ? <Sparkles size={14} /> : null}
                {isSelected ? 'Activated Plan' : `Subscribe to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Frequently Asked / Helper Box */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col gap-4 mt-4">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="text-purple-600" size={16} /> Subscription FAQ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <h5 className="text-xs font-bold text-slate-700">How do I connect my Infokart AI Chat credentials?</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Once you subscribe to Pro or Enterprise, head to the <strong className="text-purple-600">AI Agent</strong> configuration tab. You can input your Infokart API key and Agent ID to route messages directly through your trained AI model.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <h5 className="text-xs font-bold text-slate-700">Can I utilize the platform completely offline?</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Yes! If you choose not to connect Infokart AI credentials, our built-in local fallback engine leverages SQLite vector similarity matching combined with Google Gemini LLM using your own local env variables to automate WABA queries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
