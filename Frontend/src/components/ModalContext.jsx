import { createContext, useState, useContext } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success"); // success | error
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [onConfirm, setOnConfirm] = useState(null);

    const showModal = (message, type = "success") => {
        setModalMessage(message);
        setModalType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalMessage("");
    };

    const showConfirmationModal = (message, confirmCallback) => {
        setConfirmMessage(message);
        setOnConfirm(() => confirmCallback);
        setConfirmOpen(true);
    };

    const closeConfirmationModal = () => {
        setConfirmOpen(false);
        setConfirmMessage("");
        setOnConfirm(null);
    };

    return (
        <ModalContext.Provider value={{ showModal, closeModal, showConfirmationModal, closeConfirmationModal }}>
            {children}

            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm animate-fadeIn z-50">
                    <div className={`bg-white p-8 rounded-2xl shadow-2xl w-[90%] sm:w-96 text-center`}>
                        <div className="flex justify-center mb-4">
                            {modalType === "success" ? (
                                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                </svg>
                            ) : (
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            )}
                        </div>
                        <p className={`text-lg font-semibold ${modalType === "success" ? "text-green-700" : "text-red-700"}`}>{modalMessage}</p>
                        <button 
                            className={`mt-5 px-6 py-2 ${modalType === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white rounded-full shadow-lg transition duration-300`}
                            onClick={closeModal}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {confirmOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm animate-fadeIn z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-[90%] sm:w-96 text-center">
                        <p className="text-lg font-semibold text-gray-800">{confirmMessage}</p>
                        <div className="mt-5 flex justify-center gap-4">
                            <button 
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition duration-300"
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    closeConfirmationModal();
                                }}
                            >
                                OK
                            </button>
                            <button 
                                className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-full shadow-lg transition duration-300"
                                onClick={closeConfirmationModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);
