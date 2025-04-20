import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';

function Footer() {
    return (
        <div className="max-w-screen-2xl container bg-white mx-auto px-4 md:px-20 py-10">
        <footer className="flex flex-col md:flex-row justify-between items-center bg-white text-black-content p-6 md:p-10">
            {/* Left Side - Logo & Contact Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                <img src="/MSU_LOGO.png" alt="logo" className="w-40 h-40" />
                <p className="text-gray-700 dark:text-white">
                    <span className="text-lg font-semibold">The M. S. University of Baroda, Pratapgunj,</span><br />
                    Vadodara, Gujarat-390002 <br />
                    <FontAwesomeIcon icon={faPhone} className="mr-2" />+91-265-2795555<br />
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2" />info@msubaroda.ac.in<br />
                    <FontAwesomeIcon icon={faGlobe} className="mr-2" />www.msubaroda.ac.in
                </p>
            </div>

            {/* Center - Social Links */}
            <nav className="mt-6 md:mt-0">
                <h6 className="footer-title text-lg font-semibold">Social</h6>
                <div className="flex space-x-4 mt-2">
                    <a href="#" className="text-gray-600 hover:text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                        </svg>
                    </a>
                    <a href="#" className="text-gray-600 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                        </svg>
                    </a>
                    <a href="#" className="text-gray-600 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                        </svg>
                    </a>
                </div>
            </nav>

            {/* Right Side - Navigation Links */}
            <div className="mt-6 md:mt-0">
                <ul className="space-y-4 text-center md:text-right">
                    <li>
                        <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-brown dark:hover:text-brown-dark font-medium text-lg">Home</a>
                    </li>
                    <li>
                        <a href="/about" className="text-gray-700 dark:text-gray-300 hover:text-brown dark:hover:text-brown-dark font-medium text-lg">About</a>
                    </li>
                    <li>
                        <a href="/feedback" className="text-gray-700 dark:text-gray-300 hover:text-brown dark:hover:text-brown-dark font-medium text-lg">Feedback</a>
                    </li>
                </ul>
            </div>
        </footer>
    </div>
    )
}

export default Footer