export function KitchenScreen() {
  const mockOrders = [
    { id: "102-1", table: "Стол 4", time: "05:12", status: "late", items: ["1x Борщ", "2x Цезарь"] },
    { id: "102-2", table: "Стол 2", time: "02:40", status: "normal", items: ["1x Карбонара", "1x Пицца Маргарита"] }
  ];

  return (
    <div className="w-screen h-screen bg-[#11161d] text-white flex flex-col p-4 overflow-hidden select-none">
      {/* Шапка KDS */}
      <header className="flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h1 className="text-2xl font-black tracking-wide text-emerald-400">МОНИТОР КУХНИ (ГОРЯЧИЙ ЦЕХ)</h1>
        <div className="font-mono text-xl">Активных заказов: {mockOrders.length}</div>
      </header>

      {/* Горизонтальная лента карточек заказов */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start">
        {mockOrders.map((order) => (
          <div 
            key={order.id} 
            className={`w-72 shrink-0 border rounded-2xl overflow-hidden shadow-xl flex flex-col bg-slate-900 ${
              order.status === "late" ? "border-red-600" : "border-slate-700"
            }`}
          >
            {/* Заголовок тикета */}
            <div className={`p-3 flex justify-between items-center text-slate-950 font-black ${
              order.status === "late" ? "bg-red-500" : "bg-slate-400"
            }`}>
              <span className="text-lg">{order.table}</span>
              <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-sm">{order.time}</span>
            </div>

            {/* Состав заказа */}
            <div className="p-4 flex-1 space-y-4 min-h-62.5">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <span className="text-lg font-bold text-slate-100">{item}</span>
                  <input type="checkbox" className="w-6 h-6 rounded accent-emerald-500 cursor-pointer" />
                </div>
              ))}
            </div>

            {/* Кнопка готовности */}
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-lg py-4 transition uppercase tracking-wider">
              Готово
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
