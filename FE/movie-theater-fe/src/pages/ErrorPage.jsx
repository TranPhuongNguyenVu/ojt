import { Link } from "react-router-dom";
import { Home, TriangleAlert } from "lucide-react";

const ErrorPage = () => (
  <main className="grid min-h-screen place-items-center bg-gray-50 px-6 font-sans">
    <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#C00000]"><TriangleAlert size={28} /></div>
      <p className="mt-5 text-sm font-black tracking-[0.25em] text-[#C00000]">404</p>
      <h1 className="mt-2 text-2xl font-black text-gray-950">Không tìm thấy trang</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#C00000] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#a00000]"><Home size={16} />Về trang chủ</Link>
    </section>
  </main>
);

export default ErrorPage;
