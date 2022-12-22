odoo.define('pos_technotrade.PosTechPaymentScreen', function (require) {
    'use strict';

    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    // var rpc = require('web.rpc');
    var models = require('point_of_sale.models');

    const PosTechPaymentScreen = (PaymentScreen) =>
        class extends PaymentScreen {
          async validateOrder(isForceValidate) {
              console.log('this.get_customer_values()');
              console.log(this.get_customer_values());
              if(await this.get_customer_values() == true){
                  console.log('SUPER');
                  console.log('');
                  console.log('');
                  super.validateOrder();
              }

          }

          // x_function (){
          //   this.get_customer_values();
          // }


          async get_customer_values(){
            var self = this;
            var order = this.env.pos.get_order();
            console.log('Que tal fritos?');
            console.log('');
            console.log(order);
            console.log('');
            console.log(order.partner.id);
            console.log(order.paymentlines);
            var payment_method_x = false;
            var amount_total = 0;
            if (order.paymentlines){
              for(const i in order.paymentlines){

                if(order.paymentlines[i]['payment_method']['type'] == "pay_later"){
                  console.log('i');
                  console.log(i);
                  console.log('');
                  console.log('');
                  payment_method_x = true;
                  amount_total += order.paymentlines[i]['amount']
                }

              }
            }
            console.log('payment_method_x ');
            console.log(payment_method_x);
            console.log('');
            console.log('');
            if(payment_method_x == true){

              try{
                const response_partner = await this._get_response(order.partner.id, amount_total);
                if(response_partner == true){
                  console.log('Todo bien con el cliente');
                  return true;
                }else if (response_partner != true) {
                  console.log('ha ocurrido un error');
                  console.log(response_partner);
                  this.showPopup('ErrorPopup', {
                      title: this.env._t('Error'),
                      body: this.env._t(response_partner),
                  });
                  return false;
                }

              }catch(error){
                console.log('Catch error');
                console.log(error);
                return false;

              }

            }else{
                console.log('El metodo de pago no es credito');
                return true;
            }


          }


          async _get_response(id_partner, amount) {
              return await this.rpc({
                  model: 'res.partner',
                  method: 'values_partner',
                  args: [[], id_partner, amount],
              });
          }


        }


    Registries.Component.extend(PaymentScreen, PosTechPaymentScreen);

    return PosTechPaymentScreen;
});
