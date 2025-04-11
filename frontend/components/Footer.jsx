import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-4 px-6 border-t border-gray-200 bg-white text-gray-600 text-sm z-40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p>Sistem Gestionare Contestații</p>
        </div>
        
        <div className="flex items-center">
          <p className="text-gray-500">
            &copy; {currentYear} Dezvoltat de{' '}
            <a 
              href="mailto:contact@alcaziurobert.ro" 
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Alcaziu Robert
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
