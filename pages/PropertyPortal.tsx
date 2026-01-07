
import React, { useState, useMemo } from 'react';
import { PropertyFile, Transaction } from '../types';
import { 
  Search, 
  Eye, 
  Edit,
  X,
  Plus,
  Trash2,
  Save,
  Building
} from 'lucide-react';

interface PropertyPortalProps {
  allFiles: PropertyFile[];
  setAllFiles: (files: PropertyFile[]) => void;
  onPreviewStatement?: (file: PropertyFile) => void;
}

const PropertyPortal: React.FC<PropertyPortalProps> = ({ 
  allFiles, 
  setAllFiles,
  onPreviewStatement
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState<PropertyFile | null>(null);
  const [tempTransactions, setTempTransactions] = useState<Transaction[]>([]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  const startEditLedger = (file: PropertyFile) => {
    setEditingFile(file);
    setTempTransactions([...file.transactions].sort((a, b) => a.seq - b.seq));
  };

  const updateTempTrans = (index: number, field: keyof Transaction, value: any) => {
    const updated = [...tempTransactions];
    const trans = { ...updated[index], [field]: value };
    
    // Auto-calculate OS Balance when receivable or paid amount changes
    if (field === 'receivable' || field === 'amount_paid') {
      trans.balduedeb = Math.max(0, (trans.receivable || 0) - (trans.amount_paid || 0));
    }
    
    updated[index] = trans;
    setTempTransactions(updated);
  };

  const addTempTrans = () => {
    const newTrans: Transaction = {
      seq: tempTransactions.length + 1,
      transid: Date.now(),
      line_id: 0,
      shortname: '',
      duedate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      receivable: 0,
      u_intno: tempTransactions.length + 1,
      u_intname: 'INSTALLMENT',
      transtype: '13',
      itemcode: editingFile?.fileNo || '',
      plottype: 'Residential',
      currency: 'PKR',
      description: '',
      doctotal: editingFile?.plotValue || 0,
      status: 'Unpaid',
      balance: 0,
      balduedeb: 0,
      paysrc: null,
      amount_paid: 0,
      receipt_date: '',
      mode: 'Cash',
      surcharge: 0
    };
    setTempTransactions([...tempTransactions, newTrans]);
  };

  const deleteTempTrans = (index: number) => {
    setTempTransactions(tempTransactions.filter(((_, i) => i !== index)));
  };

  const saveLedger = () => {
    if (!editingFile) return;
    const updatedFiles = allFiles.map(f => {
      if (f.fileNo === editingFile.fileNo) {
        const sortedTrans = [...tempTransactions].sort((a, b) => a.seq - b.seq);
        const received = sortedTrans.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
        const totalOS = sortedTrans.reduce((sum, t) => sum + (t.balduedeb || 0), 0);
        return {
          ...f,
          transactions: sortedTrans,
          paymentReceived: received,
          balance: totalOS
        };
      }
      return f;
    });
    setAllFiles(updatedFiles);
    setEditingFile(null);
  };

  const filteredInventory = allFiles.filter(f => 
    f.fileNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-20">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Property Registry</h1>
        <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Asset Ledger & Member Management</p>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Filter property handles or member names..." 
              className="w-full pl-12 pr-6 py-4 sm:py-5 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[2rem] text-sm font-bold outline-none" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b">
                <th className="px-10 py-6">Item Code & Asset</th>
                <th className="px-10 py-6">Current Member</th>
                <th className="px-10 py-6 text-right">Registry Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((f) => (
                <tr key={f.fileNo} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 text-sm uppercase">{f.fileNo}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{f.plotSize}</div>
                  </td>
                  <td className="px-10 py-8 font-black text-slate-900 text-sm uppercase">{f.ownerName}</td>
                  <td className="px-10 py-8 text-right flex justify-end gap-3">
                    <button onClick={() => startEditLedger(f)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 px-4 shadow-sm">
                      <Edit size={18} />
                      <span className="text-[10px] font-black uppercase">Edit Ledger</span>
                    </button>
                    <button onClick={() => onPreviewStatement?.(f)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 px-4 shadow-sm">
                      <Eye size={18} />
                      <span className="text-[10px] font-black uppercase">Preview SAP</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 sm:p-6 space-y-4">
          {filteredInventory.map(f => (
            <div key={f.fileNo} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">{f.fileNo}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-widest">{f.plotSize}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEditLedger(f)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Edit size={14} /> Update</button>
                <button onClick={() => onPreviewStatement?.(f)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Eye size={14} /> View</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-hidden lg:p-4">
          <div className="bg-white lg:rounded-[3rem] w-full max-w-6xl h-full lg:h-[90vh] shadow-2xl flex flex-col border border-white/20 animate-in zoom-in duration-300">
            <div className="p-6 sm:p-8 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                  <Building size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">Editor: {editingFile.fileNo}</h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">Authorized Terminal Access</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={addTempTrans}
                  className="hidden sm:flex px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all items-center gap-2 shadow-lg"
                >
                  <Plus size={16} /> New Entry
                </button>
                <button onClick={() => setEditingFile(null)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl sm:rounded-2xl hover:text-red-500 transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
              <table className="hidden lg:table w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em] border-b">
                    <th className="pb-4 px-2">Seq</th>
                    <th className="pb-4 px-2">Due Date</th>
                    <th className="pb-4 px-2">Type</th>
                    <th className="pb-4 px-2">Receivable</th>
                    <th className="pb-4 px-2">Inbound</th>
                    <th className="pb-4 px-2">O/S Ledger</th>
                    <th className="pb-4 px-2 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tempTransactions.map((t, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2">
                        <input type="number" value={t.seq} onChange={(e) => updateTempTrans(idx, 'seq', parseInt(e.target.value))} className="w-12 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-bold" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="text" value={t.duedate} onChange={(e) => updateTempTrans(idx, 'duedate', e.target.value)} className="w-28 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-bold" />
                      </td>
                      <td className="py-4 px-2">
                        <select value={t.u_intname} onChange={(e) => updateTempTrans(idx, 'u_intname', e.target.value)} className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black uppercase tracking-tight">
                          <option value="BOOKING">BOOKING</option>
                          <option value="CONFIRMATION">CONFIRMATION</option>
                          <option value="INSTALLMENT">INSTALLMENT</option>
                          <option value="BALLOTING">BALLOTING</option>
                          <option value="POSSESSION">POSSESSION</option>
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" value={t.receivable || 0} onChange={(e) => updateTempTrans(idx, 'receivable', parseInt(e.target.value))} className="w-28 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black text-blue-600" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" value={t.amount_paid || 0} onChange={(e) => updateTempTrans(idx, 'amount_paid', parseInt(e.target.value))} className="w-28 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-xs font-black text-emerald-600" />
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" value={t.balduedeb || 0} disabled className="w-28 bg-transparent border-b border-transparent outline-none text-xs font-bold text-slate-400 cursor-not-allowed" />
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button onClick={() => deleteTempTrans(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="lg:hidden space-y-6">
                <button onClick={addTempTrans} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl mb-8"><Plus size={18} /> Append Transaction Entry</button>
                {tempTransactions.map((t, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 relative group">
                    <button onClick={() => deleteTempTrans(idx)} className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-red-500 bg-white rounded-xl shadow-sm"><Trash2 size={16} /></button>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seq</p>
                        <input type="number" value={t.seq} onChange={(e) => updateTempTrans(idx, 'seq', parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                        <input type="text" value={t.duedate} onChange={(e) => updateTempTrans(idx, 'duedate', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Commitment Type</p>
                        <select value={t.u_intname} onChange={(e) => updateTempTrans(idx, 'u_intname', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-blue-500">
                          <option value="BOOKING">BOOKING</option>
                          <option value="CONFIRMATION">CONFIRMATION</option>
                          <option value="INSTALLMENT">INSTALLMENT</option>
                          <option value="BALLOTING">BALLOTING</option>
                          <option value="POSSESSION">POSSESSION</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Receivable</p>
                        <input type="number" value={t.receivable || 0} onChange={(e) => updateTempTrans(idx, 'receivable', parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-blue-600 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inbound</p>
                        <input type="number" value={t.amount_paid || 0} onChange={(e) => updateTempTrans(idx, 'amount_paid', parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-emerald-600 outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 sm:gap-10 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                <div className="shrink-0">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Receivable</p>
                  <p className="text-base sm:text-xl font-black text-slate-900">{formatCurrency(tempTransactions.reduce((s, t) => s + (t.receivable || 0), 0))}</p>
                </div>
                <div className="shrink-0">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Inbound</p>
                  <p className="text-base sm:text-xl font-black text-emerald-600">{formatCurrency(tempTransactions.reduce((s, t) => s + (t.amount_paid || 0), 0))}</p>
                </div>
              </div>
              <button 
                onClick={saveLedger}
                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-4 active:scale-95"
              >
                <Save size={18} /> Commit Ledger Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPortal;
