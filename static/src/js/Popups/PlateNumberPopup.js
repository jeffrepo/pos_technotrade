odoo.define('pos_technotrade.PlateNumberPopup', function(require) {
    'use strict';

    const { _t } = require('web.core');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

    class PlateNumberPopup extends AbstractAwaitablePopup {

            setup() {
                super.setup();
                console.log('setup')
                console.log(this)
                Object.assign(this, this.props.info);
            }


    }

    //Create a custom popup

    PlateNumberPopup.template = 'PlateNumberPopup';
    PlateNumberPopup.defaultProps = {

      confirmText: _t('Ok'),

      cancelText: 'Cancel',

      title: 'Ingrese información',

      body: '',
    
      plate_numbers_list: false,
        
      texts: "hola",
        
      text2: {'2': [1,'ab']},
    };


    Registries.Component.add(PlateNumberPopup);
});