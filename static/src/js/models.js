odoo.define('pos_technotrade.models', function(require) {
    'use strict';

//const models = require('point_of_sale.models');
const { PosGlobalState, Order } = require('point_of_sale.models');
const Registries = require('point_of_sale.Registries');
const rpc = require('web.rpc');

//const { useListener } = require('web.custom_hooks');
// var models = require('point_of_sale.models');

const PosTechnoPosGlobalState = (PosGlobalState) => class PosHrPosGlobalState extends PosGlobalState {
    async setTable(table, orderUid=null) {
            const table_super = super.setTable(table, orderUid);
            //console.log('INHERIT')
            var pump = 1;
            try {
                const report_pump_transactions = await this.report_pump_transactions(1)
                if (report_pump_transactions){
                    if (report_pump_transactions.length > 0){
                        if ("Data" in report_pump_transactions[0]){
                            report_pump_transactions[0]["Data"].forEach(data => {

                                console.log('data')
                                console.log(data)
                                var product_tecno = this.db.get_product_by_id(data["product_id"])
                                console.log(product_tecno)
                                product_tecno["tracking"] = "none"
                                var options = {
                                          is_tip: false,
                                          quantity: 1,
                                          price: data["Amount"],
                                        }
                                this.add_new_order().add_product(product_tecno, options);
                            });
                        }else{
                            console.log('ERROR TECHNOTRADE')
                        }
                    }
                }
                //console.log('despues rpc')
                //console.log(report_pump_transactions)
            }catch (reason) {
                //console.log('catch')
                
                console.log(reason)
            }
            //this.report_pump_transactions(pump);
            return table_super;

        }
    
    async report_pump_transactions(pump) {
            console.log('report_pump_transactions por timout')
            return await this.env.services.rpc({
                model: 'pos.order',
                method: 'report_pump_transactions',
                args: [[], [pump]],
            }, {
                timeout: 800,
                shadow: true,
            }).then(function(respuesta){
                    //self.set_synch(self.get('failed') ? 'error' : 'disconnected');
                    console.log('RESPUESTA REPORTE PUMP');
                    console.log(respuesta)
                    return respuesta
            })        
        }        
}

    
Registries.Model.extend(PosGlobalState, PosTechnoPosGlobalState);
//const PosRestaurantPosGlobalStateT = (PosGlobalStateT) => class PosRestaurantPosGlobalStateT extends PosGlobalStateT 
    
//RegistriesT.Model.extend(PosGlobalStateT, PosRestaurantPosGlobalStateT); 
});