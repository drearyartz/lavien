/**
 * PrinterService: soyut yazici arayuzu.
 * Somut adapter'lar bu siniftan turer ve print(payload) metodunu implemente eder.
 * Ileride EscPosNetworkAdapter gibi gercek termal yazici adapterleri eklenebilir;
 * hangi adapter'in kullanilacagi PRINTER_ADAPTER env degiskeni ile secilir.
 */
class PrinterService {
  // eslint-disable-next-line class-methods-use-this
  async print(_receiptPayload) {
    throw new Error('print() metodu somut bir adapter tarafindan implemente edilmelidir.');
  }
}

module.exports = PrinterService;
