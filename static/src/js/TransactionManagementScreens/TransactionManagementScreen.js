odoo.define('pos_technotrade.TransactionManagementScreen', function (require) {
    'use strict';

    const { sprintf } = require('web.utils');
    const { parse } = require('web.field_utils');
    const { useListener } = require("@web/core/utils/hooks");
    const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const Registries = require('point_of_sale.Registries');
    const TransactionFetcher = require('pos_technotrade.TransactionFetcher');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const contexts = require('point_of_sale.PosContext');
    const { Orderline } = require('point_of_sale.models');

    const { onMounted, onWillUnmount, useState } = owl;

    class TransactionManagementScreen extends ControlButtonsMixin(IndependentToOrderScreen) {
        setup() {
            super.setup();
            console.log('TransactionManagementScreen')
            useListener('close-screen', this.close);
            useListener('click-sale-order', this._onClickSaleOrder);
            useListener('next-page', this._onNextPage);
            useListener('prev-page', this._onPrevPage);
            useListener('search', this._onSearch);

            TransactionFetcher.setComponent(this);
            this.orderManagementContext = useState(contexts.orderManagement);

            onMounted(this.onMounted);
            onWillUnmount(this.onWillUnmount);
        }
        onMounted() {
            TransactionFetcher.on('update', this, this.render);

            // calculate how many can fit in the screen.
            // It is based on the height of the header element.
            // So the result is only accurate if each row is just single line.
            const flexContainer = this.el.querySelector('.flex-container');
            const cpEl = this.el.querySelector('.control-panel');
            const headerEl = this.el.querySelector('.header-row');
            const val = Math.trunc(
                (flexContainer.offsetHeight - cpEl.offsetHeight - headerEl.offsetHeight) /
                    headerEl.offsetHeight
            );
            console.log('el val')
            console.log(val)
            TransactionFetcher.setNPerPage(500);

            // Fetch the order after mounting so that order management screen
            // is shown while fetching.
            setTimeout(() => TransactionFetcher.fetch(), 0);
        }
        onWillUnmount() {
            TransactionFetcher.off('update', this);
        }
        get selectedPartner() {
            const order = this.orderManagementContext.selectedOrder;
            return order ? order.get_partner() : null;
        }
        get orders() {
            console.log(' Transaction get orders fetches in ManagementScreen js')
            console.log(TransactionFetcher.get())
            return TransactionFetcher.get();
        }
        get orders_test(){
            console.log(' Transaction get orders_test fetches in ManagementScreen js')
            return TransactionFetcher.get();
        }

        async _setNumpadMode(event) {
            const { mode } = event.detail;
            this.numpadMode = mode;
            NumberBuffer.reset();
        }
        _onNextPage() {
            TransactionFetcher.nextPage();
        }
        _onPrevPage() {
            TransactionFetcher.prevPage();
        }
        _onSearch({ detail: domain }) {
            TransactionFetcher.setSearchDomain(domain);
            TransactionFetcher.setPage(1);
            TransactionFetcher.fetch();
        }
        async _onClickSaleOrder(event) {
            const clickedTransaction = event.detail;
            console.log('_onClickSaleOrder')
            console.log(event)
            console.log(event.detail)
            const { confirmed, payload: selectedOption } = await this.showPopup('SelectionPopup',
                {
                    title: this.env._t('What do you want to do?'),
                    list: [{id:"1", label: this.env._t("Agregar al pedido"), item: true}],
                });

            if(confirmed){
              let currentPOSOrder = this.env.pos.get_order();
              try {
                await this.env.pos.load_new_partners();
              }
              catch (_error){
              }
              if (selectedOption){
                console.log('producto')
                console.log(this.env.pos.db.get_product_by_id(clickedTransaction['product_id']))
                console.log('clickedTransaction');
                console.log(clickedTransaction);
                var transaction_x = false;
                if(clickedTransaction){
                    if(clickedTransaction.hasOwnProperty('id')){
                        transaction_x = clickedTransaction.id
                    }
                }

                let new_line = Orderline.create({}, {
                    pos: this.env.pos,
                    order: this.env.pos.get_order(),
                    product: this.env.pos.db.get_product_by_id(clickedTransaction['product_id']),
                    description: clickedTransaction.fuel_grade_name,
                    price: clickedTransaction.price,
                    price_manually_set: false,
                    transaction: clickedTransaction.id,
                    has_product_lot: 'none',
                    tracking: 'none',
                    nozzle: clickedTransaction.nozzle,
                    pump: clickedTransaction.pump,
                });
                    console.log('New Line');
                    console.log(new_line);
                    console.log(clickedTransaction);

                    new_line.set_transaction(transaction_x);
                    console.log(new_line)
                    //new_line.setQuantityFromSOL(line);
                    //new_line.set_unit_price(clickedTransaction.total_amount);
                    //new_line.set_discount(line.discount);

                    new_line.set_quantity(clickedTransaction.volume);

                    this.env.pos.get_order().add_orderline(new_line);

              }

              this.close();
            }

        }



    }
    TransactionManagementScreen.template = 'TransactionManagementScreen';
    TransactionManagementScreen.hideOrderSelector = true;

    Registries.Component.add(TransactionManagementScreen);

    return TransactionManagementScreen;
});
