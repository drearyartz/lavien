const BrowserPrintAdapter = require('./BrowserPrintAdapter');

/**
 * PRINTER_ADAPTER env degiskenine gore uygun adapter'i doner.
 * Su an sadece 'browser' destekleniyor; ileride 'escpos-network' gibi
 * degerler eklenebilir.
 */
function getPrinterAdapter() {
  const adapterName = process.env.PRINTER_ADAPTER || 'browser';

  switch (adapterName) {
    case 'browser':
    default:
      return new BrowserPrintAdapter();
  }
}

module.exports = { getPrinterAdapter };
