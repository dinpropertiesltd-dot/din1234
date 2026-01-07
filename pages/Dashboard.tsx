
import React, { useMemo, useState, useEffect } from 'react';
import { PropertyFile, Transaction, User } from '../types';
import { generateSmartSummary } from '../AIService';
import { 
  CreditCard, 
  Home, 
  Users, 
  RefreshCcw, 
  AlertOctagon, 
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Clock,
  ArrowRightCircle,
  ShieldCheck,
  Sparkles,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  onSelectFile: (file: PropertyFile) => void;
  files: PropertyFile[];
  userName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectFile, files, userName }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);

  // Re-fetch AI summary when files change
  useEffect(() => {
    const fetchSummary = async () => {
      if (files.length === 0) {
        setAiSummary("No active property files found in your registry profile.");
        setIsAiLoading(false);
        return;
      }
      setIsAiLoading(true);
      // Construct a mock user object for the summary service
      const mockUser: any = { name: userName };
      const summary = await generateSmartSummary(mockUser, files);
      setAiSummary(summary || '');
      setIsAiLoading(false);
    };
    fetchSummary();
  }, [files, userName]);

  const findGlobalNextPayment = () => {
    let next: { trans: Transaction, plotName: string, itemCode: string } | null = null;
    files.forEach(file => {
      const unpaid = file.transactions.find(t => (!t.amount_paid || t.amount_paid === 0) && (t.receivable && t.receivable > 0));
      if (unpaid && !next) {
        next = { trans: unpaid, plotName: file.plotSize, itemCode: file.fileNo };
      }
    });
    return next;
  };

  const getFileNextPayment = (file: PropertyFile) => {
    return file.transactions.find(t => (!t.amount_paid || t.amount_paid === 0) && (t.receivable && t.receivable > 0));
  };

  const getFileStatus = (file: PropertyFile) => {
    const hasOverdue = file.transactions.some(t => {
      return t.balduedeb && t.balduedeb > 0;
    });

    if (hasOverdue) return { label: 'Action Required', color: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (file.balance > 0) return { label: 'Active Ledger', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    return { label: 'Clearance Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  };

  const globalNextPayment = findGlobalNextPayment();

  const stats = useMemo(() => {
    const activeRecordsCount = files.filter(f => f.balance > 0).length;
    const alertCount = files.filter(f => f.overdue > 0 || f.transactions.some(t => (t.balduedeb || 0) > 0)).length;
    const transferCount = files.reduce((acc, f) => acc + f.transactions.filter(t => (t.u_intname || '').toUpperCase() === 'TRANSFER').length, 0);

    return [
      { label: 'Verified Assets', value: files.length.toString().padStart(2, '0'), icon: Home, color: 'bg-blue-600' },
      { label: 'Active Records', value: activeRecordsCount.toString().padStart(2, '0'), icon: CreditCard, color: 'bg-emerald-600' },
      { label: 'Joint Members', value: '00', icon: Users, color: 'bg-amber-600' }, 
      { label: 'Transfers', value: transferCount.toString().padStart(2, '0'), icon: RefreshCcw, color: 'bg-purple-600' },
      { label: 'Alerts', value: alertCount.toString().padStart(2, '0'), icon: AlertOctagon, color: 'bg-rose-600' },
      { label: 'Integrations', value: 'SAP', icon: Layers, color: 'bg-slate-600' },
    ];
  }, [files]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportSummary = () => {
    if (files.length === 0) return;
    const headers = ['Item Code', 'Plot Description', 'Item Value', 'Paid To Date', 'OS Balance', 'Reg Date'];
    const rows = files.map(f => [f.fileNo, f.plotSize, f.plotValue, f.paymentReceived, f.balance, f.regDate]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Portfolio_Summary_${userName.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter">Verified Portfolio</h2>
          <p className="text-slate-400 font-bold mt-1 text-sm sm:text-base">Authenticated Identity: {userName}</p>
        </div>
        <div className="flex bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm items-center gap-4 self-start md:self-center">
          <Calendar size={20} className="text-emerald-600" />
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Portal Access Date</p>
            <p className="text-[11px] font-black text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* AI Smart Summary Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/30">
            {isAiLoading ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} />}
          </div>
          <div className="flex-1">
            <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">AI Registry Intelligence</h3>
            <div className="text-white text-sm sm:text-base font-medium leading-relaxed">
              {isAiLoading ? (
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <span className="text-slate-500 ml-2 italic">Scanning secure ledger nodes...</span>
                </div>
              ) : (
                <p className="animate-in fade-in slide-in-from-left-4 duration-500">{aiSummary}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} />
            </div>
            <p className="text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2 sm:px-4">
            <h3 className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Asset Synchronization Unit
            </h3>
            <button 
              onClick={handleExportSummary}
              disabled={files.length === 0}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900 text-white hover:bg-black rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-20 shadow-lg shadow-slate-900/10"
            >
              <FileSpreadsheet size={14} /> <span className="hidden sm:inline">Global Export</span>
            </button>
          </div>
          
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                    <th className="px-10 py-6">Item Code & Classification</th>
                    <th className="px-10 py-6">Next Commitment</th>
                    <th className="px-10 py-6">Recovery Index</th>
                    <th className="px-10 py-6">SAP Status</th>
                    <th className="px-10 py-6 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => {
                    const status = getFileStatus(file);
                    const next = getFileNextPayment(file);
                    const recoveryPercent = file.plotValue > 0 ? Math.round((file.paymentReceived / file.plotValue) * 100) : 0;
                    
                    return (
                      <tr key={file.fileNo} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{file.plotSize}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">ID: {file.fileNo}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          {next ? (
                            <div>
                              <div className="text-xs font-black text-slate-900">{formatCurrency(next.receivable || 0)}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1">
                                <Clock size={10} /> {next.duedate}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck size={12} /> Registry Clear
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-900">{formatCurrency(file.paymentReceived)}</span>
                            <span className="text-[9px] font-black text-slate-400">{recoveryPercent}% Secured</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${recoveryPercent > 70 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                              style={{ width: `${recoveryPercent}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                            {status.label}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <button 
                            onClick={() => onSelectFile(file)}
                            className="bg-slate-900 text-white hover:bg-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            Ledger Summary <ArrowRightCircle size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 sm:p-6 space-y-4">
              {files.map((file) => {
                const status = getFileStatus(file);
                const next = getFileNextPayment(file);
                const recoveryPercent = file.plotValue > 0 ? Math.round((file.paymentReceived / file.plotValue) * 100) : 0;

                return (
                  <div key={file.fileNo} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="max-w-[70%]">
                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{file.plotSize}</div>
                        <div className="text-[9px] text-emerald-600 font-black uppercase mt-1.5 tracking-widest">ID: {file.fileNo}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
                        {status.label.split(' ')[0]}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Inbound</p>
                        <p className="text-xs font-black text-slate-900 mt-1">{next ? formatCurrency(next.receivable || 0) : 'Registry Clear'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secured Ratio</p>
                        <p className="text-xs font-black text-slate-900 mt-1">{recoveryPercent}%</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => onSelectFile(file)}
                      className="w-full bg-white border border-slate-200 text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all"
                    >
                      Extract Ledger <ArrowRightCircle size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {files.length === 0 && (
              <div className="px-10 py-24 text-center">
                <div className="flex flex-col items-center opacity-30">
                  <AlertOctagon size={48} className="text-slate-300 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">No Asset Records Identified in Secure Registry</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[400px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-600/40">
                <TrendingUp size={32} />
              </div>
              
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">PORTFOLIO ALERT</h4>
              
              {globalNextPayment ? (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Asset Reference</p>
                    <p className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{globalNextPayment.plotName}</p>
                    <p className="text-[11px] text-emerald-500/80 font-bold mt-1 uppercase tracking-widest">Item Code: {globalNextPayment.itemCode}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem]">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Amount Outstanding</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(globalNextPayment.trans.receivable || 0)}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 px-2">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-500 border border-white/10">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Date</p>
                        <p className="text-base font-black text-white">{globalNextPayment.trans.duedate}</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-[2rem] sm:rounded-[2.5rem] transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px]">
                    Proceed To Payment
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center text-center opacity-40">
                  <ShieldCheck size={64} className="text-emerald-500 mb-6" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-white leading-relaxed">
                    Registry Synchronized<br/>Portfolio Status: Clear
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
