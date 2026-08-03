import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import BookingService from '../../services/BookingService';
import BookingStepper from '../../components/BookingStepper';

const MomoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [errorMessage, setErrorMessage] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');
    const transId = searchParams.get('transId');
    const amount = searchParams.get('amount');

    if (!resultCode || !orderId || !transId || !amount) {
      setStatus('failed');
      setErrorMessage('Thông tin phản hồi từ cổng MoMo không đầy đủ hoặc không hợp lệ.');
      return;
    }

    // Gọi backend verify chữ ký và cập nhật trạng thái đặt vé
    BookingService.verifyMomoRedirect({
      resultCode: parseInt(resultCode),
      orderId,
      transId,
      amount: parseFloat(amount)
    })
      .then((res) => {
        if (res.data && res.data.success) {
          setStatus('success');
          setInvoiceId(res.data.invoiceId);
          // Tự động chuyển hướng sang trang success sau 3 giây
          setTimeout(() => {
            navigate(`/booking/success/${res.data.invoiceId}`);
          }, 3000);
        } else {
          setStatus('failed');
          setErrorMessage(searchParams.get('message') || 'Thanh toán thất bại hoặc đã bị hủy.');
        }
      })
      .catch((err) => {
        console.error('Lỗi verify kết quả MoMo:', err);
        setStatus('failed');
        setErrorMessage('Không thể xác thực giao dịch thanh toán từ MoMo.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="bg-[#F8F9FA] dark:bg-transparent min-h-screen text-gray-900 dark:text-gray-100 pb-20 selection:bg-[#E50914] selection:text-white font-sans transition-colors duration-300">
      <BookingStepper currentStep={3} />
      
      <div className="max-w-md mx-auto px-6 pt-16 text-center">
        {status === 'verifying' && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 flex flex-col items-center transition-colors duration-300">
            <Loader2 className="w-16 h-16 text-[#E50914] animate-spin" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Đang Xác Minh Giao Dịch</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
              Vui lòng không tắt hoặc tải lại trang. Chúng tôi đang xử lý xác thực thanh toán từ ví MoMo...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 flex flex-col items-center transition-colors duration-300 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-150 text-green-600 mb-2">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Thanh Toán Thành Công!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
              Giao dịch qua ví MoMo đã được xác thực thành công. Đang chuyển hướng bạn sang trang hiển thị vé...
            </p>
            <button
              onClick={() => navigate(`/booking/success/${invoiceId}`)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-all"
            >
              Xem vé ngay lập tức
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 flex flex-col items-center transition-colors duration-300 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-650 mb-2">
              <XCircle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-red-650">Thanh Toán Thất Bại</h2>
            <p className="text-red-500 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-950/40 p-3 rounded-lg w-full">
              Lỗi: {errorMessage}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
              Giao dịch thanh toán chưa thành công. Mọi ghế đã chọn đã được mở khóa tự động để bạn có thể chọn lại.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold rounded-lg text-xs transition-all"
              >
                Về trang chủ
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-3 bg-[#E50914] hover:bg-[#B80710] text-white font-bold rounded-lg text-xs transition-all"
              >
                Quay lại thanh toán
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomoCallbackPage;
