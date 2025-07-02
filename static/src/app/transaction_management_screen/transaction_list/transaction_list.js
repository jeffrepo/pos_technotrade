/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { TransactionRow } from "@pos_technotrade/app/transaction_management_screen/transaction_row/transaction_row";
import { useService } from "@web/core/utils/hooks";

/**
 * @props {models.Order} [initHighlightedOrder] initially highligted order
 * @props {Array<models.Order>} orders
 */
export class TransactionList extends Component {
    static components = { TransactionRow };
    static template = "pos_technotrade.TransactionList";

    setup() {
        this.ui = useState(useService("ui"));
        this.state = useState({ highlightedOrder: this.props.initHighlightedOrder || null });
    }
    get highlightedOrder() {
        return this.state.highlightedOrder;
    }
    _onClickOrder(order) {
        this.state.highlightedOrder = order;
    }
}