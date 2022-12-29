odoo.define('pos_technotrade.models', function(require) {
    'use strict';

//const models = require('point_of_sale.models');
const { PosGlobalState, Order, Orderline } = require('point_of_sale.models');
const Registries = require('point_of_sale.Registries');
const rpc = require('web.rpc');
//const models = require('point_of_sale.models');
//const { useListener } = require('web.custom_hooks');
// var models = require('point_of_sale.models');

const PosTechrOrder = (Order) => class PosTechrOrder extends Order {
    constructor(obj, options) {
        super(...arguments);
        console.log('constructor')
        this.transaction = this.get_transaction();
        this.nozzle = this.get_nozzle();
    }
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.transaction = false;
        console.log('TRANSACTION init_from_JSON')
        console.log(this.nozzle)
    }
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.transaction = this.get_transaction();
        json.nozzle = this.get_nozzle();
        console.log('json')
        console.log(json)
        return json;
    }
    set_transaction(transaction) {
        console.log('SET TRANSACTION ORDER')
        console.log(transaction)
        this.transaction = transaction;
    }

    get_transaction() {
        return this.transaction;
    }

    set_nozzle(nozzle) {
        console.log('SET TRANSACTION nozzle')
        console.log(nozzle)
        this.nozzle = nozzle;
    }

    get_nozzle() {
        return this.transaction;
    }
}
Registries.Model.extend(Order, PosTechrOrder);

const PosTechrOrderline = (Orderline) => class PosTechrOrderline extends Orderline {

  constructor(obj, options) {
      super(...arguments);
      console.log('Constructor OrderLine');
      this.transaction = this.transaction || options.transaction;
  }

  init_from_JSON(json) {
      super.init_from_JSON(...arguments);
      this.transaction = json.transaction;
      this.driver = json.driver;
      this.plate_number_id = json.plate_number_id;
      console.log('Json extends orderLine');
      console.log(json);
  }

  export_as_JSON() {
      const json = super.export_as_JSON(...arguments);
      json.transaction = this.transaction;
      json.driver = this.driver;
      json.plate_number_id = this.plate_number_id;
      console.log('export_as_json order.line')
      console.log(json)
      return json;
  }

  set_driver(driver){
      this.driver = driver;
  }

  get_driver(){
      return this.driver;
  }

  set_plate_number(plate_number_id){
      this.plate_number_id = plate_number_id;
  }

  get_plate_number(){
      return this.plate_number_id;
  }        
    
  set_transaction(transaction){
      this.transaction = transaction;
  }

  get_transaction(){
      return this.transaction;
  }


}
Registries.Model.extend(Orderline, PosTechrOrderline);
// const PosTechnoPosGlobalState = (PosGlobalState) => class PosHrPosGlobalState extends PosGlobalState {
//     async _processData(loadedData) {
//         await super._processData(...arguments);
//         console.log('FLOORS')
//         console.log(this.floors)
//         this.tables = loadedData['restaurant.table'];
//         console.log('table')
//         console.log(this.tables)
//     }
//     async setTable(table, orderUid=null) {
//             const table_super = super.setTable(table, orderUid);
//             //console.log('INHERIT')
//             console.log('TABLE')
//             console.log(table);
//             console.log(table.id)
//             var pump = 1;
//             try {
//                 var date_end = new Date();
//                 var date_start = new Date();
//                 date_start.setHours(date_end.getHours()-6)
//                 console.log(date_start)
//                 console.log(date_end)
//                 const report_pump_transactions = await this.report_pump_transactions(table.id, date_start.toISOString().split('.')[0], date_end.toISOString().split('.')[0])
//                 console.log('report_pump_transactions')
//                 console.log(report_pump_transactions)
//                 if (report_pump_transactions){
//                     if (report_pump_transactions.length > 0){
//                         if ("Data" in report_pump_transactions[0]){
//                             report_pump_transactions[0]["Data"].forEach(data => {
//
//                                 console.log('data')
//                                 console.log(data)
//                                 if ("product_id" in data && data["product_id"]){
//                                     var product_tecno = this.db.get_product_by_id(data["product_id"])
//                                     console.log(product_tecno)
//                                     product_tecno["tracking"] = "none"
//                                     var options = {
//                                               is_tip: false,
//                                               quantity: 1,
//                                               price: data["Amount"],
//                                             }
//                                     var new_order = this.add_new_order()
//                                     new_order.add_product(product_tecno, options);
//                                     new_order.set_transaction(data["Transaction"])
//                                     new_order.set_nozzle(data['nozzle'])
//                                 }
//
//                             });
//                         }else{
//                             console.log('ERROR TECHNOTRADE')
//                         }
//                     }else{
//                         console.log('else2')
//                         return table_super
//                     }
//                 }else{
//                     console.log('else3')
//                     return table_super
//                 }
//                 //console.log('despues rpc')
//                 //console.log(report_pump_transactions)
//             }catch (reason) {
//                 console.log('catch')
//                 console.log(reason)
//             }
//             return table_super;
//
//         }
//
//     async report_pump_transactions(table_id, date_start, date_end) {
//             console.log('report_pump_transactions por timout')
//             return await this.env.services.rpc({
//                 model: 'pos.order',
//                 method: 'report_pump_transactions',
//                 args: [[], [table_id],[date_start],[date_end]],
//             }, {
//                 timeout: 800,
//                 shadow: false,
//             }).then(function(respuesta){
//
//                     console.log('RESPUESTA REPORTE PUMP');
//                     console.log(respuesta)
//                     return respuesta
//             })
//         }
//
//     set_transaction(transaction) {
//         console.log('SET TRANSACTION')
//         console.log(transaction)
//         this.transaction = transaction;
//     }
//
//     get_transaction() {
//         return this.transaction;
//     }
//
//     set_nozzle(nozzle) {
//         console.log('SET nozzle')
//         console.log(nozzle)
//         this.nozzle = nozzle;
//     }
//
//     get_nozzle() {
//         return this.nozzle;
//     }
// }
//
//
// Registries.Model.extend(PosGlobalState, PosTechnoPosGlobalState);
});
