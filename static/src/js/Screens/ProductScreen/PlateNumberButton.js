odoo.define('pos_technotrade.PlateNumberButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const { ConnectionLostError, ConnectionAbortedError } = require('@web/core/network/rpc_service')
    const { identifyError } = require('point_of_sale.utils');
    
    class PlateNumberButton extends PosComponent {
        
      setup() {
                super.setup();
                useListener('click', this.onClick);
      }
        
      async onClick() {
        var order = this.env.pos.get_order();
        console.log("Este es el que vale 1");
        var value_reference1 = false;
        var value_reference2 = false;
        var value_reference3 = false;
        order.get_orderlines().forEach(function(prod){
          console.log("Que tiene productos?");
          console.log(prod);

        });

        const current_partner = this.env.pos.get_order().get_partner();
        console.log('current_customer')
        console.log(current_partner)
        
        var plate_numbers_list =  [];
        if (current_partner){
            plate_numbers_list = await this.rpc({
                model: 'pos.order',
                method: 'get_plate_number_list',
                args: [[], [current_partner.id]],
            });
        }
          
        
        const { confirmed, payload: inputNote } = await this.showPopup('PlateNumberPopup', {
            title: this.env._t('Ingrese información'),
            plate_numbers_list: plate_numbers_list,
        });
          


        if (confirmed) {
            var orderline_note = "";
            if (orderline){

                if (document.getElementById('driver')){
                    orderline.set_driver(document.getElementById('driver').value);
                    orderline_note += "Chofer: " + document.getElementById('driver').value
                }else{
                    orderline.set_driver(false);
                }


                if (document.getElementById('plate_number')){
                    orderline.set_plate_number(document.getElementById('plate_number').value);

                    var s_index = document.getElementById('plate_number').options.selectedIndex

                    orderline_note += " Matrícula: "+ document.getElementById('plate_number').options[s_index].innerText
                }else{
                    orderline.set_plate_number(false);
                }     

                orderline.set_customer_note(orderline_note);

            }


        };


      }

    }



    PlateNumberButton.template = 'PlateNumberButton';
    ProductScreen.addControlButton({
        component: PlateNumberButton,
        position: ['before', 'SetFiscalPositionButton'],
    });
    

    Registries.Component.add(PlateNumberButton);
    return PlateNumberButton;




});
