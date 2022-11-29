odoo.define('pos_technotrade.TransactionButton', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    const { isConnectionError } = require('point_of_sale.utils');
    const { Gui } = require('point_of_sale.Gui');

    class TransactionButton extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this.onClick);
        }
        get currentOrder() {
            return this.env.pos.get_order();
        }
        async onClick() {
          try {
              console.log('Presiona boton transactions')
              // ping the server, if no error, show the screen
              // Use rpc from services which resolves even when this
              // component is destroyed (removed together with the popup).
              var date_end = new Date();
              var date_start = new Date();
              date_start.setHours(date_end.getHours()-6)              
              await this.env.services.rpc({
                  model: 'sale.order',
                  method: 'browse',
                  args: [[]],
                  kwargs: { context: this.env.session.user_context },
              });

              
              // LegacyComponent doesn't work the same way as before.
              // We need to use Gui here to show the screen. This will work
              // because ui methods in Gui is bound to the root component.
              const screen = 'TransactionManagementScreen';
              Gui.showScreen(screen);
              console.log('Pantalla mostrada')
          } catch (error) {
              if (isConnectionError(error)) {
                  this.showPopup('ErrorPopup', {
                      title: this.env._t('Network Error'),
                      body: this.env._t('Cannot access order management screen if offline.'),
                  });
              } else {
                  throw error;
              }
          }
        }
    }
    TransactionButton.template = 'TransactionButton';

    ProductScreen.addControlButton({
        component: TransactionButton,
        condition: function() {
            return true;
        },
    });

    Registries.Component.add(TransactionButton);

    
    console.log('TRANSACTION BUTTON JS')
    return TransactionButton;
});
