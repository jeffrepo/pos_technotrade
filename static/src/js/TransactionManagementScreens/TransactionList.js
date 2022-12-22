odoo.define('pos_transaction.TransactionList', function (require) {
    'use strict';

    const { useListener } = require("@web/core/utils/hooks");
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    const { useState } = owl;

    /**
     * @props {models.Order} [initHighlightedOrder] initially highligted order
     * @props {Array<models.Order>} orders
     */
    class TransactionList extends PosComponent {
        setup() {
            super.setup();
            useListener('click-order', this._onClickOrder);
            console.log('TransactionList')
            
            this.state = useState({ highlightedTransaction: this.props.initHighlightedOrder || null });
            console.log(this.state)
        }
        get highlightedTransaction() {
            console.log('highlightedTransaction')
            
            return this.state.highlightedTransaction;
            console.log(this.state)
        }
        _onClickOrder({ detail: order }) {
            this.state.highlightedOrder = order;
        }
    }
    TransactionList.template = 'TransactionList';

    Registries.Component.add(TransactionList);

    return TransactionList;
});
