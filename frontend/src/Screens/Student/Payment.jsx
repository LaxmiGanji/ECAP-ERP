import { useState } from "react";
import { FaQrcode } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";

const Payment = () => {
  const [showQR, setShowQR] = useState(false);

  const handleUPIClick = () => {
    setShowQR(true);
  };

  const handleBack = () => {
    setShowQR(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        {!showQR ? (
          <>
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
              Make a Payment
            </h1>
            <div
              onClick={handleUPIClick}
              className="cursor-pointer flex items-center justify-center gap-4 bg-gray-100 hover:bg-blue-100 p-6 rounded-xl shadow transition-all"
            >
              <FaQrcode size={40} className="text-blue-600" />
              <span className="text-lg font-medium">Pay via UPI</span>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-center text-blue-600 mb-6">
              Scan QR Code to Pay
            </h1>
            <div className="flex justify-center mb-6">
              {/* Replace the src URL with your actual QR code image */}
              <img
                src="https://via.placeholder.com/250x250.png?text=UPI+QR+Code"
                alt="UPI QR Code"
                className="w-64 h-64 object-contain border rounded-xl shadow"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                <IoArrowBack size={20} />
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payment;
