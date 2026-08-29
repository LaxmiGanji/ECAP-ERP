const Heading = ({ title, desc }) => {
  return (
    <div className="bento-header-banner mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-xl">
          ⚡
        </div>
        <div>
          <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {desc || "Sphoorthy Engineering College Autonomous Management Portal"}
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 self-start md:self-auto">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[11px] font-bold text-slate-700 tracking-wide">ECAP v2.0 Active</span>
      </div>
    </div>
  );
};

export default Heading;
