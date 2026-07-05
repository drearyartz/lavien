const PrinterService = require('./PrinterService');

/**
 * BrowserPrintAdapter: bu fazda gercek bir fiziksel yazdirma yapmaz.
 * Gercek yazdirma islemi frontend'de window.print() ile gerceklesir.
 * Bu adapter, receiptPayload'i oldugu gibi geri doner (backend tarafinda
 * "yazdirildi" olarak isaretleme / loglama noktasi olarak kullanilabilir).
 */
class BrowserPrintAdapter extends PrinterService {
  // eslint-disable-next-line class-methods-use-this
  async print(receiptPayload) {
    return {
      adapter: 'browser',
      delivered: true,
      payload: receiptPayload,
    };
  }
}

module.exports = BrowserPrintAdapter;
